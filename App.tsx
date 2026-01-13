
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { APP_PASSWORDS, REMOTE_PASSWORDS_URL } from './constants';

const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutos em milisegundos

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!sessionStorage.getItem('ultra_trade_session');
  });
  
  const [authPassword, setAuthPassword] = useState<string | null>(() => {
    return sessionStorage.getItem('ultra_trade_session');
  });
  
  const [isVerifying, setIsVerifying] = useState(false);
  const inactivityTimerRef = useRef<number | null>(null);

  const handleLogout = useCallback(() => {
    setAuthPassword(null);
    setIsLoggedIn(false);
    sessionStorage.removeItem('ultra_trade_session');
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
    }
    
    if (isLoggedIn) {
      inactivityTimerRef.current = window.setTimeout(() => {
        handleLogout();
        alert("Sua sessão expirou por inatividade (10 minutos).");
      }, INACTIVITY_LIMIT);
    }
  }, [isLoggedIn, handleLogout]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleEvent = () => resetInactivityTimer();
    events.forEach(event => document.addEventListener(event, handleEvent));
    resetInactivityTimer();
    return () => {
      events.forEach(event => document.removeEventListener(event, handleEvent));
      if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
    };
  }, [isLoggedIn, resetInactivityTimer]);

  const fetchRemotePasswords = useCallback(async () => {
    try {
      const response = await fetch(`${REMOTE_PASSWORDS_URL}?t=${Date.now()}`);
      if (!response.ok) return [];
      const text = await response.text();
      return text.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    } catch (error) {
      return [];
    }
  }, []);

  const validatePassword = useCallback(async (pass: string) => {
    if (APP_PASSWORDS.includes(pass)) return true;
    const remoteList = await fetchRemotePasswords();
    if (remoteList.includes(pass)) return true;
    const localUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    if (localUsers.includes(pass)) return true;
    return false;
  }, [fetchRemotePasswords]);

  useEffect(() => {
    if (!authPassword) return;
    const checkAccess = async () => {
      setIsVerifying(true);
      const isValid = await validatePassword(authPassword);
      if (!isValid) {
        handleLogout();
        alert("Sessão expirada ou acesso revogado.");
      }
      setIsVerifying(false);
    };
    const timer = setInterval(checkAccess, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [authPassword, validatePassword, handleLogout]);

  const handleLogin = async (pass: string) => {
    setIsVerifying(true);
    const isValid = await validatePassword(pass);
    if (isValid) {
      setAuthPassword(pass);
      setIsLoggedIn(true);
      sessionStorage.setItem('ultra_trade_session', pass);
    } else {
      throw new Error("Acesso negado");
    }
    setIsVerifying(false);
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0c]">
        {isVerifying && (
          <div className="fixed top-24 right-4 z-50">
            <div className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Sincronizando Licença...</span>
            </div>
          </div>
        )}
        {/* Fixed: Pass currentUserId from authPassword */}
        <Dashboard onLogout={handleLogout} userId={authPassword || 'anon_trader'} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <Login onLogin={handleLogin} />
    </div>
  );
};

export default App;
