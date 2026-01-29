
import React, { useState } from 'react';
import Logo from './Logo';

interface RegisterProps {
  onSuccess: (password: string) => void;
  onBackToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSuccess, onBackToLogin }) => {
  const [formData, setFormData] = useState({ name: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (formData.password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    // Salvando no LocalStorage para validação no App.tsx
    const existing = JSON.parse(localStorage.getItem('registered_users_data') || '[]');
    localStorage.setItem('registered_users_data', JSON.stringify([...existing, { 
      name: formData.name, 
      password: formData.password 
    }]));

    onSuccess(formData.password);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white px-4">
      <div className="text-center mb-8">
        <Logo size="lg" className="justify-center mb-6" hideText />
        <h1 className="text-3xl font-bold mb-2">
          Nova <span className="logo-gradient-text">Licença</span>
        </h1>
        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Preencha os dados abaixo</p>
      </div>

      <div className="bg-[#0f0f0f] border border-white/5 p-8 rounded-[32px] w-full max-w-[420px] shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block ml-2">Seu Nome</label>
            <input 
              type="text" 
              required 
              placeholder="Ex: Rodrigo Sniper"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all text-sm font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block ml-2">Senha VIP (Aceita @#$)</label>
            <input 
              type="text" 
              required 
              placeholder="Senha Complexa 123!"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all text-sm font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block ml-2">Confirme a Senha</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              value={formData.confirm}
              onChange={e => setFormData({...formData, confirm: e.target.value})}
              className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all text-sm font-mono"
            />
          </div>

          {error && <p className="text-rose-500 text-[10px] font-black text-center uppercase tracking-widest">{error}</p>}

          <button 
            type="submit" 
            className="w-full py-5 rounded-2xl logo-gradient-bg text-slate-900 font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all"
          >
            GERAR LICENÇA AGORA
          </button>
        </form>

        <button 
          onClick={onBackToLogin}
          className="w-full mt-6 text-[10px] text-slate-500 uppercase font-black hover:text-white transition-colors tracking-widest"
        >
          Voltar ao Login
        </button>
      </div>
    </div>
  );
};

export default Register;
