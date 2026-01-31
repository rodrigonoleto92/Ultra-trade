
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

  // Monitoramento de Versão (Silencioso)
  useEffect(() => {
    const checkAppUpdate = async () => {
      try {
        const response = await fetch(`${window.location.origin}/index.html?t=${Date.now()}`, { method: 'HEAD' });
        const etag = response.headers.get('etag') || response.headers.get('last-modified');
        const lastEtag = localStorage.getItem('ultra_last_etag');
        
        if (lastEtag && etag && lastEtag !== etag) {
          // Detectou atualização: Recarrega silenciosamente após 3 segundos
          localStorage.setItem('ultra_last_etag', etag);
          setTimeout(() => window.location.reload(), 3000);
        } else if (etag) {
          localStorage.setItem('ultra_last_etag', etag);
        }
      } catch (e) {}
    };

    const versionTimer = setInterval(checkAppUpdate, VERSION_CHECK_INTERVAL);
    return () => clearInterval(versionTimer);
  }, []);

  // Monitoramento de Sessão (Silencioso)
  useEffect(() => {
    if (view !== 'DASHBOARD' || !authPassword) return;

    // 1. Check periódico
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

  if (view === 'DASHBOARD') {
    return (
      <div className="min-h-screen bg-[#0a0a0c]">
        {/* Validação agora é silenciosa - a barra de status foi removida */}
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
