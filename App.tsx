
import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import Success from './components/Success';
import TickerTape from './components/TickerTape';
import { APP_USERS, REMOTE_PASSWORDS_URL, SESSION_VERSION } from './constants';

type AppView = 'LOGIN' | 'REGISTER' | 'SUCCESS' | 'DASHBOARD';

// Intervalo de verificação agressivo para garantir logout em tempo real
const SECURITY_CHECK_INTERVAL = 2000; 

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(() => {
    const savedSession = localStorage.getItem('ultra_trade_session');
    const savedVersion = localStorage.getItem('ultra_session_version');

    // Kill-switch imediato se a versão salva for diferente da constante atual
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
    // Forçar recarregamento garante que qualquer estado de memória seja limpo
    window.location.reload();
  }, []);

  const validateUser = useCallback(async (pass: string): Promise<{isValid: boolean, name?: string}> => {
    // 1. Verificação Mestra em APP_USERS (constants.ts)
    const user = APP_USERS.find(u => u.key === pass);
    if (user) return { isValid: true, name: user.name };

    // 2. Verificação de usuários registrados localmente (se permitido)
    const localUsersRaw = localStorage.getItem('registered_users_data');
    if (localUsersRaw) {
      const localUsers = JSON.parse(localUsersRaw);
      const localUser = localUsers.find((u: any) => u.password === pass);
      if (localUser) return { isValid: true, name: localUser.name };
    }

    // 3. Verificação Remota (Fallback)
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

  // Monitoramento contínuo de segurança
  useEffect(() => {
    if (view !== 'DASHBOARD') return;

    const checkSecurity = async () => {
      const currentToken = localStorage.getItem('ultra_trade_session');
      const savedVersion = localStorage.getItem('ultra_session_version');

      // 1. Verifica versão (Master Logout)
      if (savedVersion !== SESSION_VERSION) {
        console.log("Sessão expirada por atualização de versão.");
        handleLogout();
        return;
      }

      // 2. Verifica se a senha atual ainda consta na lista permitida
      if (currentToken) {
        const { isValid } = await validateUser(currentToken);
        if (!isValid) {
          console.log("Credenciais revogadas pelo administrador.");
          handleLogout();
        }
      } else {
        handleLogout();
      }
    };

    // Verificação inicial
    checkSecurity();

    // Loop de verificação frequente
    const interval = setInterval(checkSecurity, SECURITY_CHECK_INTERVAL);

    // Verificação extra ao voltar para a janela (evita bypass com aba inativa)
    const onFocus = () => checkSecurity();
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onFocus);
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
