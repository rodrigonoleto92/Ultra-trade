
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
      setError('Chave de acesso inválida ou expirada.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] px-4">
      <div className="max-w-md w-full glass p-10 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"></div>

        <div className="text-center mb-10 relative z-10">
          <Logo size="lg" className="justify-center mb-8" />
          <div className="inline-block bg-blue-500/10 text-blue-400 text-[10px] font-black px-4 py-1 rounded-full border border-blue-500/20 mb-4 uppercase tracking-[0.3em]">
            Validação de Licença VIP
          </div>
          <p className="text-slate-400 mt-2 font-medium tracking-wide">Terminal Sincronizado v4.1</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-tighter">Sua Chave de Acesso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isLoading}
              className="w-full bg-slate-900/80 border border-slate-700/50 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-700 font-mono disabled:opacity-50"
              required
            />
          </div>

          {error && <p className="text-rose-500 text-sm font-bold text-center bg-rose-500/10 py-2 rounded-lg animate-shake">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full logo-gradient-bg hover:opacity-90 text-slate-900 font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] uppercase tracking-widest text-sm flex items-center justify-center gap-3 disabled:grayscale"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                Validando...
              </>
            ) : (
              'Acessar Terminal VIP'
            )}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-white/5 text-center relative z-10">
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">
            Ultra Trade Cloud Security<br/>Verificação via Satélite Ativa
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
