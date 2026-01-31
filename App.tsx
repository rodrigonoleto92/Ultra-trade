
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import Success from './components/Success';
import { APP_USERS, REMOTE_PASSWORDS_URL, SECURITY_VERSION } from './constants';

type AppView = 'LOGIN' | 'REGISTER' | 'SUCCESS' | 'DASHBOARD';

const SECURITY_CHECK_INTERVAL = 30000; // 30 segundos para check em background
const VERSION_CHECK_INTERVAL = 60000; // 1 minuto para check de versão

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
  const [updateDetected, setUpdateDetected] = useState(false);

  const handleLogout = useCallback(() => {
    setAuthPassword(null);
    setView('LOGIN');
    sessionStorage.clear();
    window.location.reload();
  }, []);

  const validateUser = useCallback(async (pass: string): Promise<{isValid: boolean, name?: string}> => {
    const user = APP_USERS.find(u => u.key === pass);
    if (user) return { isValid: true, name: user.name };

    try {
      const response = await fetch(`${REMOTE_PASSWORDS_URL}?t=${Date.now()}`);
      if (response.ok) {
        const text = await response.text();
        const remoteList = text.split('\n').map(p => p.trim());
        if (remoteList.includes(pass)) return { isValid: true, name: 'Acesso VIP' };
      }
    } catch (e) {
      console.error("Erro na validação remota");
    }

    const localUsersRaw = localStorage.getItem('registered_users_data');
    if (localUsersRaw) {
      const localUsers = JSON.parse(localUsersRaw);
      const localUser = localUsers.find((u: any) => u.password === pass);
      if (localUser) return { isValid: true, name: localUser.name };
    }

    return { isValid: false };
  }, []);

  const performStrictValidation = useCallback(async () => {
    if (view !== 'DASHBOARD' || !authPassword) return;
    
    setIsVerifying(true);
    const { isValid } = await validateUser(authPassword);
    
    if (!isValid) {
      handleLogout();
    }
    
    setTimeout(() => setIsVerifying(false), 2000);
  }, [view, authPassword, validateUser, handleLogout]);

  // Monitoramento de Versão
  useEffect(() => {
    const checkAppUpdate = async () => {
      try {
        const response = await fetch(`${window.location.origin}/index.html?t=${Date.now()}`, { method: 'HEAD' });
        const etag = response.headers.get('etag') || response.headers.get('last-modified');
        const lastEtag = localStorage.getItem('ultra_last_etag');
        
        if (lastEtag && etag && lastEtag !== etag) {
          setUpdateDetected(true);
          setTimeout(() => window.location.reload(), 3000);
        } else if (etag) {
          localStorage.setItem('ultra_last_etag', etag);
        }
      } catch (e) {}
    };

    const versionTimer = setInterval(checkAppUpdate, VERSION_CHECK_INTERVAL);
    return () => clearInterval(versionTimer);
  }, []);

  // Monitoramento de Sessão (Heartbeat + Gatilhos de Foco/Visibilidade)
  useEffect(() => {
    if (view !== 'DASHBOARD' || !authPassword) return;

    // 1. Check periódico (enquanto a página está aberta e visível)
    const timer = setInterval(performStrictValidation, SECURITY_CHECK_INTERVAL);

    // 2. Check Imediato ao voltar para a aba ou desbloquear o celular
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performStrictValidation();
      }
    };

    // 3. Check Imediato ao focar na janela
    const handleFocus = () => {
      performStrictValidation();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [view, authPassword, performStrictValidation]);

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

  if (updateDetected) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center p-6 text-center">
        <div className="glass p-10 rounded-[40px] border border-blue-500/30">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Atualizando Sistema</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sincronizando novas chaves e protocolos...</p>
        </div>
      </div>
    );
  }

  if (view === 'DASHBOARD') {
    return (
      <div className="min-h-screen bg-[#0a0a0c]">
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className={`flex items-center gap-3 px-6 py-2 rounded-full border backdrop-blur-2xl shadow-2xl transition-all duration-1000 ${
            isVerifying ? 'bg-blue-600/20 border-blue-400/50 opacity-100' : 'bg-emerald-600/10 border-emerald-400/20 opacity-40'
          }`}>
            <div className={`h-2 w-2 rounded-full ${isVerifying ? 'bg-blue-400 animate-ping' : 'bg-emerald-400'}`}></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-white">
              {isVerifying ? 'Validando Protocolos...' : 'Sessão Protegida'}
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

  return <Login onLogin={handleLogin} />;
};

export default App;
