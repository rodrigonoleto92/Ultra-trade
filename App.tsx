
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import Success from './components/Success';
import { APP_USERS, REMOTE_PASSWORDS_URL, SECURITY_VERSION } from './constants';

type AppView = 'LOGIN' | 'REGISTER' | 'SUCCESS' | 'DASHBOARD';

const SECURITY_CHECK_INTERVAL = 30000;

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(() => {
    const savedVersion = sessionStorage.getItem('ultra_v');
    if (savedVersion && savedVersion !== SECURITY_VERSION) {
      sessionStorage.clear();
      return 'LOGIN';
    }
    return sessionStorage.getItem('ultra_trade_session') ? 'DASHBOARD' : 'LOGIN';
  });

  const [authPassword, setAuthPassword] = useState<string | null>(() => {
    return sessionStorage.getItem('ultra_trade_session');
  });

  const [userName, setUserName] = useState<string>(() => {
    return sessionStorage.getItem('ultra_trade_user') || 'Trader';
  });
  
  const [isVerifying, setIsVerifying] = useState(false);

  const handleLogout = useCallback(() => {
    setAuthPassword(null);
    setView('LOGIN');
    sessionStorage.clear();
  }, []);

  const validateUser = useCallback(async (pass: string): Promise<{isValid: boolean, name?: string}> => {
    // Validação estrita: respeita maiúsculas, minúsculas e caracteres especiais (===)
    
    // 1. Verificação na lista de usuários fixos
    const user = APP_USERS.find(u => u.key === pass);
    if (user) return { isValid: true, name: user.name };

    // 2. Verificação em usuários registrados localmente no navegador
    const localUsersRaw = localStorage.getItem('registered_users_data');
    if (localUsersRaw) {
      const localUsers = JSON.parse(localUsersRaw);
      const localUser = localUsers.find((u: any) => u.password === pass);
      if (localUser) return { isValid: true, name: localUser.name };
    }

    // 3. Verificação remota (opcional)
    try {
      const response = await fetch(`${REMOTE_PASSWORDS_URL}?t=${Date.now()}`);
      if (response.ok) {
        const text = await response.text();
        const remoteList = text.split('\n').map(p => p.trim());
        if (remoteList.includes(pass)) return { isValid: true, name: 'Acesso VIP' };
      }
    } catch (e) {
      // Falha silenciosa na remota
    }

    return { isValid: false };
  }, []);

  useEffect(() => {
    if (view !== 'DASHBOARD' || !authPassword) return;

    const performStrictValidation = async () => {
      setIsVerifying(true);
      const { isValid } = await validateUser(authPassword);
      if (!isValid) {
        handleLogout();
        alert("Sessão expirada ou acesso revogado.");
      }
      setTimeout(() => setIsVerifying(false), 2000);
    };

    const timer = setInterval(performStrictValidation, SECURITY_CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, [view, authPassword, handleLogout, validateUser]);

  const handleLogin = async (pass: string) => {
    setIsVerifying(true);
    const { isValid, name } = await validateUser(pass);
    if (isValid) {
      const finalName = name || 'Trader';
      setAuthPassword(pass);
      setUserName(finalName);
      setView('DASHBOARD');
      sessionStorage.setItem('ultra_trade_session', pass);
      sessionStorage.setItem('ultra_trade_user', finalName);
      sessionStorage.setItem('ultra_v', SECURITY_VERSION);
    } else {
      throw new Error("Credenciais inválidas.");
    }
    setTimeout(() => setIsVerifying(false), 1000);
  };

  const handleRegisterSuccess = (pass: string) => {
    setView('SUCCESS');
  };

  if (view === 'DASHBOARD') {
    return (
      <div className="min-h-screen bg-[#0a0a0c]">
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className={`flex items-center gap-3 px-6 py-2 rounded-full border backdrop-blur-2xl shadow-2xl transition-all duration-1000 ${
            isVerifying ? 'bg-blue-600/20 border-blue-400/50 opacity-100' : 'bg-emerald-600/10 border-emerald-400/20 opacity-50'
          }`}>
            <div className={`h-2 w-2 rounded-full ${isVerifying ? 'bg-blue-400 animate-ping' : 'bg-emerald-400'}`}></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-white">
              {isVerifying ? 'Autenticando...' : 'Conectado'}
            </span>
          </div>
        </div>
        <Dashboard onLogout={handleLogout} userName={userName} authPassword={authPassword || ''} />
      </div>
    );
  }

  if (view === 'REGISTER') {
    return <Register onSuccess={handleRegisterSuccess} onBackToLogin={() => setView('LOGIN')} />;
  }

  if (view === 'SUCCESS') {
    return <Success onGoToLogin={() => setView('LOGIN')} />;
  }

  return <Login onLogin={handleLogin} onGoToRegister={() => setView('REGISTER')} />;
};

export default App;
