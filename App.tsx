
import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import Success from './components/Success';
import TickerTape from './components/TickerTape';
import { APP_USERS, REMOTE_PASSWORDS_URL, SESSION_VERSION } from './constants';

type AppView = 'LOGIN' | 'REGISTER' | 'SUCCESS' | 'DASHBOARD';

const SECURITY_CHECK_INTERVAL = 1000; // Reduzido para 1 segundo para precisão máxima

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(() => {
    const savedSession = localStorage.getItem('ultra_trade_session');
    const savedVersion = localStorage.getItem('ultra_session_version');

    if (savedSession && savedVersion !== SESSION_VERSION) {
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
    localStorage.removeItem('ultra_trade_session');
    localStorage.removeItem('ultra_trade_user');
    localStorage.removeItem('ultra_session_version');
    setAuthPassword(null);
    setView('LOGIN');
    window.location.reload();
  }, []);

  // Função de validação agora é sensível a mudanças nas constantes globais
  const validateUser = useCallback(async (pass: string): Promise<{isValid: boolean, name?: string}> => {
    // Verifica contra a lista ATUAL em constants.ts
    const user = APP_USERS.find(u => u.key === pass);
    if (user) return { isValid: true, name: user.name };

    const localUsersRaw = localStorage.getItem('registered_users_data');
    if (localUsersRaw) {
      const localUsers = JSON.parse(localUsersRaw);
      const localUser = localUsers.find((u: any) => u.password === pass);
      if (localUser) return { isValid: true, name: localUser.name };
    }

    try {
      const response = await fetch(`${REMOTE_PASSWORDS_URL}?t=${Date.now()}`);
      if (response.ok) {
        const text = await response.text();
        const remoteList = text.split('\n').map(p => p.trim());
        if (remoteList.includes(pass)) return { isValid: true, name: 'Acesso VIP' };
      }
    } catch (e) {}

    return { isValid: false };
  }, [APP_USERS]); // Re-calcula se APP_USERS mudar

  // Efeito de monitoramento de segurança "Ultra Ativo"
  useEffect(() => {
    if (view !== 'DASHBOARD') return;

    const checkSecurity = async () => {
      const currentToken = localStorage.getItem('ultra_trade_session');
      const savedVersion = localStorage.getItem('ultra_session_version');

      // Check 1: Versão Global
      if (savedVersion !== SESSION_VERSION) {
        handleLogout();
        return;
      }

      // Check 2: Validação da senha ativa
      if (currentToken) {
        const { isValid } = await validateUser(currentToken);
        if (!isValid) {
          handleLogout();
        }
      } else {
        handleLogout();
      }
    };

    // Check imediato ao montar
    checkSecurity();

    // Loop de verificação em segundo plano
    const interval = setInterval(checkSecurity, SECURITY_CHECK_INTERVAL);

    // SENSORES DE MOVIMENTO: Verifica a cada interação do usuário no app
    const onUserInteraction = () => checkSecurity();
    
    window.addEventListener('mousedown', onUserInteraction);
    window.addEventListener('keydown', onUserInteraction);
    window.addEventListener('scroll', onUserInteraction);
    window.addEventListener('focus', onUserInteraction);
    window.addEventListener('visibilitychange', onUserInteraction);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousedown', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
      window.removeEventListener('scroll', onUserInteraction);
      window.removeEventListener('focus', onUserInteraction);
      window.removeEventListener('visibilitychange', onUserInteraction);
    };
  }, [view, handleLogout, validateUser]);

  const handleLogin = async (pass: string) => {
    const { isValid, name } = await validateUser(pass);
    if (isValid) {
      const finalName = name || 'Trader';
      localStorage.setItem('ultra_trade_session', pass);
      localStorage.setItem('ultra_trade_user', finalName);
      localStorage.setItem('ultra_session_version', SESSION_VERSION);
      
      setAuthPassword(pass);
      setUserName(finalName);
      setView('DASHBOARD');
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
