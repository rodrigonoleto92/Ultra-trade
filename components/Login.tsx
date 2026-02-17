
import React, { useState, useEffect } from 'react';
import Logo from './Logo';

interface LoginProps {
  onLogin: (password: string) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('CONECTAR AO TERMINAL');

  // Ciclo de mensagens durante o loading de 2 segundos
  useEffect(() => {
    if (isLoading) {
      const texts = [
        'AUTENTICANDO CHAVE...',
        'SINCRONIZANDO DATA-FEED...',
        'CONECTANDO AO TERMINAL...',
        'SINAL CONCEDIDO!'
      ];
      let i = 0;
      const interval = setInterval(() => {
        if (i < texts.length - 1) {
          i++;
          setLoadingText(texts[i]);
        }
      }, 500);
      return () => clearInterval(interval);
    } else {
      setLoadingText('CONECTAR AO TERMINAL');
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onLogin(password);
    } catch (err) {
      setError('Acesso negado: Chave VIP inválida ou expirada.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#050507] px-4 overflow-hidden relative min-h-screen">
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

      <div className="max-w-md w-full relative z-10 py-10">
        <div className="glass p-8 md:p-12 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-2xl relative overflow-hidden">
          {/* Barra de Progresso no topo para simular carregamento */}
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
              <div className="h-full logo-gradient-bg animate-[progress_2s_ease-in-out]"></div>
            </div>
          )}

          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <Logo size="lg" hideText />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">
              Ultra <span className="logo-gradient-text">Trade</span>
            </h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Terminal de Alta Performance</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Chave VIP de Acesso</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insira sua licença..."
                disabled={isLoading}
                className="w-full bg-black/40 border border-white/10 text-white px-6 py-4 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center placeholder:text-slate-800 font-mono text-sm tracking-[0.1em] disabled:opacity-50"
                required
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 py-3 rounded-xl animate-bounce">
                <p className="text-rose-500 text-[9px] font-black text-center uppercase tracking-widest">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative overflow-hidden group h-16 rounded-2xl transition-all active:scale-95 shadow-xl shadow-blue-500/10 disabled:opacity-80"
            >
              <div className={`absolute inset-0 transition-opacity duration-500 ${isLoading ? 'opacity-40' : 'logo-gradient-bg'}`}></div>
              {isLoading && <div className="absolute inset-0 bg-slate-900 animate-pulse"></div>}
              <div className="relative flex items-center justify-center gap-3 text-slate-950 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">
                {isLoading && (
                  <svg className="animate-spin h-4 w-4 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span className={isLoading ? 'text-white' : ''}>{loadingText}</span>
              </div>
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center">
            <p className="text-xs font-black italic logo-gradient-text tracking-[0.2em] uppercase">
              De trader para trader
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 opacity-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Acesso Criptografado</span>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Login;
