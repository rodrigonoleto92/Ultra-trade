
import React, { useState } from 'react';
import Logo from './Logo';

interface LoginProps {
  onLogin: (password: string) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onLogin(password);
    } catch (err) {
      setError('Chave inválida. Verifique maiúsculas e símbolos.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050507] px-4 overflow-hidden relative">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="flex justify-around w-full h-full">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="flex flex-col items-center animate-pulse" style={{ animationDelay: `${i * 0.5}s`, opacity: Math.random() }}>
              <div className="w-[1px] h-full bg-slate-800 absolute"></div>
              <div className="flex flex-col gap-20 mt-10">
                <div className={`w-3 md:w-5 h-12 md:h-20 rounded-sm ${i % 3 === 0 ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e]' : 'bg-emerald-500 shadow-[0_0_15px_#10b981]'}`} style={{ marginTop: `${Math.random() * 300}px` }}></div>
                <div className={`w-3 md:w-5 h-8 md:h-14 rounded-sm ${i % 2 === 0 ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-rose-500 shadow-[0_0_15px_#f43f5e]'}`}></div>
                <div className={`w-3 md:w-5 h-16 md:h-24 rounded-sm ${i % 4 === 0 ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e]' : 'bg-emerald-500 shadow-[0_0_15px_#10b981]'}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="glass p-8 md:p-12 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-2xl relative overflow-hidden">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <Logo size="lg" hideText />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">
              Ultra <span className="logo-gradient-text">Trade</span>
            </h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Acesso Criptografado</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Chave VIP</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua chave..."
                disabled={isLoading}
                className="w-full bg-black/40 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center placeholder:text-slate-800 font-mono text-sm tracking-[0.1em] disabled:opacity-50"
                required
                autoComplete="off"
              />
              <p className="text-[7px] text-slate-600 text-center uppercase font-bold tracking-widest">
                Diferencia Maiúsculas e Símbolos (Ex: @, #, $)
              </p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 py-3 rounded-xl">
                <p className="text-rose-500 text-[9px] font-black text-center uppercase tracking-widest">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative overflow-hidden group h-16 rounded-2xl transition-all active:scale-95"
            >
              <div className="absolute inset-0 logo-gradient-bg"></div>
              <div className="relative flex items-center justify-center gap-3 text-slate-900 font-black uppercase tracking-[0.2em] text-xs">
                {isLoading ? 'VERIFICANDO...' : 'ENTRAR NO TERMINAL'}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
