
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { APP_USERS, REMOTE_PASSWORDS_URL } from './constants';

const INACTIVITY_LIMIT = 10 * 60 * 1000;

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!sessionStorage.getItem('ultra_trade_session');
  });
  
  const [authPassword, setAuthPassword] = useState<string | null>(() => {
    return sessionStorage.getItem('ultra_trade_session');
  });

  const [userName, setUserName] = useState<string>(() => {
    return sessionStorage.getItem('ultra_trade_user') || 'Trader';
  });
  
  const [isVerifying, setIsVerifying] = useState(false);
  const inactivityTimerRef = useRef<number | null>(null);

  const handleLogout = useCallback(() => {
    setAuthPassword(null);
    setIsLoggedIn(false);
    sessionStorage.removeItem('ultra_trade_session');
    sessionStorage.removeItem('ultra_trade_user');
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

  const validateUser = useCallback(async (pass: string): Promise<{isValid: boolean, name?: string}> => {
    const user = APP_USERS.find(u => u.key === pass);
    if (user) return { isValid: true, name: user.name };

    const remoteList = await fetchRemotePasswords();
    if (remoteList.includes(pass)) return { isValid: true, name: 'Trader VIP' };

    const localUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    if (localUsers.includes(pass)) return { isValid: true, name: 'Trader Registrado' };

    return { isValid: false };
  }, [fetchRemotePasswords]);

  useEffect(() => {
    if (!authPassword) return;
    const checkAccess = async () => {
      setIsVerifying(true);
      const { isValid } = await validateUser(authPassword);
      if (!isValid) {
        handleLogout();
        alert("Sessão expirada ou acesso revogado.");
      }
      setTimeout(() => setIsVerifying(false), 3000);
    };
    const timer = setInterval(checkAccess, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [authPassword, validateUser, handleLogout]);

  const handleLogin = async (pass: string) => {
    setIsVerifying(true);
    const { isValid, name } = await validateUser(pass);
    if (isValid) {
      const finalName = name || 'Trader';
      setAuthPassword(pass);
      setUserName(finalName);
      setIsLoggedIn(true);
      sessionStorage.setItem('ultra_trade_session', pass);
      sessionStorage.setItem('ultra_trade_user', finalName);
    } else {
      throw new Error("Acesso negado");
    }
    setTimeout(() => setIsVerifying(false), 2000);
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0c]">
        {/* Indicador de Sincronização Redimensionado (Mais visível e destacado) */}
        <div className="fixed top-2 md:top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-700 pointer-events-none">
          <div className={`flex items-center gap-3 px-6 py-2.5 rounded-full border backdrop-blur-2xl shadow-2xl transition-all duration-1000 ${
            isVerifying 
            ? 'bg-blue-600/20 border-blue-400/50 opacity-100 translate-y-0 scale-100' 
            : 'bg-emerald-600/10 border-emerald-400/20 opacity-80 translate-y-0 scale-95'
          }`}>
            <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_12px_currentColor] ${
              isVerifying ? 'bg-blue-400 animate-ping' : 'bg-emerald-400 animate-pulse'
            }`}></div>
            <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] ${
              isVerifying ? 'text-blue-400' : 'text-emerald-400'
            }`}>
              {isVerifying ? 'Sincronizando Licença...' : 'Licença Ativa'}
            </span>
          </div>
        </div>
        
        <Dashboard onLogout={handleLogout} userName={userName} />
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
