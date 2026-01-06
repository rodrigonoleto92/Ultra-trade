
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

    // Simula a adição ao "banco de dados" do app
    const existing = JSON.parse(localStorage.getItem('registered_users') || '[]');
    localStorage.setItem('registered_users', JSON.stringify([...existing, formData.password]));

    // Dispara o sucesso para o App.tsx mudar de página
    onSuccess(formData.password);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white px-4">
      <div className="text-center mb-8">
        <Logo size="lg" className="justify-center mb-6" hideText />
        <h1 className="text-3xl font-bold mb-2">
          Crie sua conta no <span className="logo-gradient-text">Ultra Trade</span>
        </h1>
        <p className="text-slate-500 text-sm">Simples, rápido e seguro.</p>
      </div>

      <div className="bg-[#0f0f0f] border border-[#1f1f1f] p-8 rounded-2xl w-full max-w-[420px] shadow-2xl">
        <form 
          action="https://formsubmit.co/noletor831@gmail.com" 
          method="POST"
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* FormSubmit Configs */}
          <input type="hidden" name="_captcha" value="false" />
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
            <input 
              type="text" 
              name="name" 
              required 
              placeholder="Ex: João Silva"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#16181a] border border-[#2d2d2d] p-4 rounded-lg text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Crie uma Senha</label>
            <input 
              type="password" 
              name="password" 
              required 
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full bg-[#16181a] border border-[#2d2d2d] p-4 rounded-lg text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Repita a Senha</label>
            <input 
              type="password" 
              name="confirm-password" 
              required 
              placeholder="••••••••"
              value={formData.confirm}
              onChange={e => setFormData({...formData, confirm: e.target.value})}
              className="w-full bg-[#16181a] border border-[#2d2d2d] p-4 rounded-lg text-white outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}

          <button 
            type="submit" 
            className="w-full py-4 rounded-lg bg-gradient-to-r from-[#34d399] to-[#3b82f6] text-white font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Fazer Cadastro
          </button>
        </form>

        <button 
          onClick={onBackToLogin}
          className="w-full mt-4 text-[10px] text-slate-500 uppercase font-black hover:text-slate-300 transition-colors"
        >
          Já tenho uma conta. Voltar ao Login
        </button>
      </div>

      <div className="mt-10 text-[10px] text-[#374151] tracking-widest font-bold">
        © 2026 ULTRA TRADE • CRIPTOGRAFIA ATIVA
      </div>
    </div>
  );
};

export default Register;
