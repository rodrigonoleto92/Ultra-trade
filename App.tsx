
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { APP_USERS, REMOTE_PASSWORDS_URL, SECURITY_VERSION } from './constants';

const INACTIVITY_LIMIT = 10 * 60 * 1000;
const SECURITY_CHECK_INTERVAL = 30000; // 30 segundos

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const savedVersion = sessionStorage.getItem('ultra_v');
    if (savedVersion && savedVersion !== SECURITY_VERSION) {
      sessionStorage.clear();
      return false;
    }
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
    sessionStorage.clear();
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
    }
  }, []);

  const validateUser = useCallback(async (pass: string): Promise<{isValid: boolean, name?: string}> => {
    // 1. Validação local (Lista fixa no código)
    const user = APP_USERS.find(u => u.key === pass);
    if (user) return { isValid: true, name: user.name };

    // 2. Validação Remota (Busca no link externo se configurado)
    try {
      const response = await fetch(`${REMOTE_PASSWORDS_URL}?t=${Date.now()}`);
      if (response.ok) {
        const text = await response.text();
        const remoteList = text.split('\n').map(p => p.trim()).filter(p => p.length > 0);
        if (remoteList.includes(pass)) return { isValid: true, name: 'Trader VIP (Remoto)' };
      }
    } catch (e) {
      console.warn("Falha ao validar remotamente, usando apenas lista local.");
    }

    return { isValid: false };
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !authPassword) return;

    const performStrictValidation = async () => {
      setIsVerifying(true);
      
      const currentSessVersion = sessionStorage.getItem('ultra_v');
      if (currentSessVersion !== SECURITY_VERSION) {
        handleLogout();
        return;
      }

      const { isValid } = await validateUser(authPassword);
      if (!isValid) {
        handleLogout();
        alert("ACESSO REVOGADO: Sua licença não é mais válida neste terminal.");
      }
      
      setTimeout(() => setIsVerifying(false), 3000);
    };

    performStrictValidation();
    const timer = setInterval(performStrictValidation, SECURITY_CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, [isLoggedIn, authPassword, handleLogout, validateUser]);

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
      sessionStorage.setItem('ultra_v', SECURITY_VERSION);
    } else {
      throw new Error("Acesso negado");
    }
    setTimeout(() => setIsVerifying(false), 1500);
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0c]">
        {/* Indicador de Segurança */}
        <div className="fixed top-2 md:top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className={`flex items-center gap-3 px-6 py-2 rounded-full border backdrop-blur-2xl shadow-2xl transition-all duration-1000 ${
            isVerifying 
            ? 'bg-blue-600/20 border-blue-400/50 scale-100' 
            : 'bg-emerald-600/10 border-emerald-400/20 scale-95 opacity-50'
          }`}>
            <div className={`h-2 w-2 rounded-full ${isVerifying ? 'bg-blue-400 animate-ping' : 'bg-emerald-400'}`}></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-white">
              {isVerifying ? 'Sincronizando Segurança...' : 'Licença Ativa'}
            </span>
          </div>
        </div>
        <Dashboard onLogout={handleLogout} userName={userName} authPassword={authPassword || ''} />
      </div>
    );
  }

  return <Login onLogin={handleLogin} />;
};

export default App;
