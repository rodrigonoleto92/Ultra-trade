
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { APP_PASSWORDS } from './constants';

const App: React.FC = () => {
  // Armazenamos a senha usada no login para monitoramento
  const [authPassword, setAuthPassword] = useState<string | null>(null);

  const handleLogout = () => {
    setAuthPassword(null);
  };

  // 1. Verificação Instantânea: Executa sempre que a senha ou a lista muda (útil para HMR/Desenvolvimento)
  useEffect(() => {
    if (authPassword && !APP_PASSWORDS.includes(authPassword)) {
      console.warn("Sessão invalidada: Chave de acesso não encontrada na lista.");
      handleLogout();
    }
  }, [authPassword, APP_PASSWORDS]);

  // 2. Verificação Periódica: Executa a cada 5 minutos conforme solicitado
  useEffect(() => {
    // Se não estiver logado, não inicia o cronômetro
    if (!authPassword) return;

    const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos em milissegundos

    const securityScanner = setInterval(() => {
      console.debug("[Segurança] Iniciando verificação periódica de credenciais...");
      
      // Verifica se a senha salva ainda é permitida
      const isStillValid = APP_PASSWORDS.includes(authPassword);
      
      if (!isStillValid) {
        console.error("[Segurança] Acesso revogado: Chave de acesso removida do servidor.");
        handleLogout();
        alert("Sua sessão expirou ou sua chave de acesso foi revogada.");
      } else {
        console.debug("[Segurança] Credencial verificada com sucesso.");
      }
    }, CHECK_INTERVAL);

    // Limpa o intervalo se o componente for desmontado ou o usuário deslogar
    return () => clearInterval(securityScanner);
  }, [authPassword]);

  return (
    <div className="min-h-screen">
      {authPassword ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={(pass) => setAuthPassword(pass)} />
      )}
    </div>
  );
};

export default App;
