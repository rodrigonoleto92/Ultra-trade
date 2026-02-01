
import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import Success from './components/Success';
import TickerTape from './components/TickerTape';
import { APP_USERS, REMOTE_PASSWORDS_URL, SECURITY_VERSION, SESSION_VERSION } from './constants';

type AppView = 'LOGIN' | 'REGISTER' | 'SUCCESS' | 'DASHBOARD';

const SECURITY_CHECK_INTERVAL = 30000; // 30 segundos

const App: React.FC = () => {
  // Inicialização validando a versão da sessão salva
  const [view, setView] = useState<AppView>(() => {
    const savedSession = localStorage.getItem('ultra_trade_session');
    const savedVersion = localStorage.getItem('ultra_session_version');

    // Se a versão do código for diferente da versão salva, limpa tudo e pede login
    if (savedVersion !== SESSION_VERSION) {
      localStorage.removeItem('ultra_trade_session');
      localStorage.removeItem('ultra_trade_user');
      localStorage.removeItem('ultra_session_version');
      return 'LOGIN';
    }

    return savedSession ? 'DASHBOARD' : 'LOGIN';
  });

  const [authPassword, setAuthPassword] = useState<string | null>(() => {
    return localStorage.getItem('ultra_trade_session');
  });

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('ultra_trade_user') || 'Trader';
  });

  const handleLogout = useCallback(() => {
    setAuthPassword(null);
    localStorage.removeItem('ultra_trade_session');
    localStorage.removeItem('ultra_trade_user');
    localStorage.removeItem('ultra_session_version');
    setView('LOGIN');
    // Força o recarregamento para limpar estados residuais
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

  // Monitoramento contínuo de segurança e versão
  useEffect(() => {
    if (view !== 'DASHBOARD') return;

    const checkSessionIntegrity = async () => {
      const savedVersion = localStorage.getItem('ultra_session_version');
      
      // Verificação 1: Se a versão mudou no código (Atualização do admin)
      if (savedVersion !== SESSION_VERSION) {
        handleLogout();
        return;
      }

      // Verificação 2: Se a senha ainda é válida (Revogação de acesso)
      if (authPassword) {
        const { isValid } = await validateUser(authPassword);
        if (!isValid) {
          handleLogout();
        }
      }
    };

    const timer = setInterval(checkSessionIntegrity, SECURITY_CHECK_INTERVAL);

    // Verifica também ao voltar para a aba
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSessionIntegrity();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkSessionIntegrity);

    return () => {
      clearInterval(timer);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkSessionIntegrity);
    };
  }, [view, authPassword, validateUser, handleLogout]);

  const handleLogin = async (pass: string) => {
    const { isValid, name } = await validateUser(pass);
    if (isValid) {
      const finalName = name || 'Trader';
      
      // Salva no estado
      setAuthPassword(pass);
      setUserName(finalName);
      setView('DASHBOARD');

      // Salva no localStorage com a versão atual
      localStorage.setItem('ultra_trade_session', pass);
      localStorage.setItem('ultra_trade_user', finalName);
      localStorage.setItem('ultra_session_version', SESSION_VERSION);
    } else {
      throw new Error("Credenciais inválidas.");
    }
  };

  const handleRegisterSuccess = () => {
    setView('SUCCESS');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col">
      <TickerTape />
      
      {view === 'DASHBOARD' && (
        <Dashboard 
          onLogout={handleLogout} 
          userName={userName} 
          authPassword={authPassword || ''} 
        />
      )}

      {view === 'REGISTER' && (
        <Register onSuccess={handleRegisterSuccess} onBackToLogin={() => setView('LOGIN')} />
      )}

      {view === 'SUCCESS' && (
        <Success onGoToLogin={() => setView('LOGIN')} />
      )}

      {view === 'LOGIN' && (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;
