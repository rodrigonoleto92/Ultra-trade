
import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { APP_PASSWORDS, REMOTE_PASSWORDS_URL } from './constants';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!localStorage.getItem('ultra_trade_session');
  });
  
  const [authPassword, setAuthPassword] = useState<string | null>(() => {
    return localStorage.getItem('ultra_trade_session');
  });
  
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchRemotePasswords = useCallback(async () => {
    try {
      // O parâmetro t= força o bypass do cache para verificar em tempo real
      const response = await fetch(`${REMOTE_PASSWORDS_URL}?t=${Date.now()}`);
      if (!response.ok) return [];
      const text = await response.text();
      return text.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    } catch (error) {
      console.error('Erro na verificação remota:', error);
      return [];
    }
  }, []);

  const validatePassword = useCallback(async (pass: string) => {
    // 1. Verifica senhas locais (Backup)
    if (APP_PASSWORDS.includes(pass)) return true;
    
    // 2. Verifica senhas no GitHub/Servidor
    const remoteList = await fetchRemotePasswords();
    return remoteList.includes(pass);
  }, [fetchRemotePasswords]);

  // Monitor de segurança em segundo plano
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

    // Verifica a cada 5 minutos se o acesso ainda é válido
    const timer = setInterval(checkAccess, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [authPassword, validatePassword]);

  const handleLogin = async (pass: string) => {
    setIsVerifying(true);
    const isValid = await validatePassword(pass);
    
    if (isValid) {
      setAuthPassword(pass);
      setIsLoggedIn(true);
      localStorage.setItem('ultra_trade_session', pass);
    } else {
      throw new Error("Acesso negado");
    }
    setIsVerifying(false);
  };

  const handleLogout = () => {
    setAuthPassword(null);
    setIsLoggedIn(false);
    localStorage.removeItem('ultra_trade_session');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      {/* Indicador de status de conexão segura */}
      {isVerifying && isLoggedIn && (
        <div className="fixed top-24 right-4 z-50">
          <div className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Sincronizando...</span>
          </div>
        </div>
      )}

      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;
