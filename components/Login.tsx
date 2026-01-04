
import React, { useState } from 'react';
import { APP_PASSWORDS } from '../constants';
import Logo from './Logo';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Verifica se a senha digitada está incluída na lista de senhas permitidas
    if (APP_PASSWORDS.includes(password)) {
      onLogin();
    } else {
      setError('Senha de acesso inválida ou expirada.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] px-4">
      <div className="max-w-md w-full glass p-10 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="text-center mb-10 relative z-10">
          <Logo size="lg" className="justify-center mb-8" />
          <div className="inline-block bg-blue-500/10 text-blue-400 text-[10px] font-black px-4 py-1 rounded-full border border-blue-500/20 mb-4 uppercase tracking-[0.3em]">
            Acesso Restrito a Membros
          </div>
          <p className="text-slate-400 mt-2 font-medium tracking-wide">Terminal de Alta Performance v3.1</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-tighter">Chave de Acesso VIP</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-900/80 border border-slate-700/50 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-slate-700 font-mono"
              required
            />
          </div>

          {error && <p className="text-rose-500 text-sm font-bold text-center bg-rose-500/10 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            className="w-full logo-gradient-bg hover:opacity-90 text-slate-900 font-black py-4 rounded-2xl transition-all shadow-xl shadow-green-500/20 active:scale-[0.98] uppercase tracking-widest text-sm"
          >
            Entrar no Terminal VIP
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-white/5 text-center relative z-10">
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">
            Ultra Trade Signal © 2026<br/>Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
