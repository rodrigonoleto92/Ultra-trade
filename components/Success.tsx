
import React from 'react';

interface SuccessProps {
  onGoToLogin: () => void;
}

const Success: React.FC<SuccessProps> = ({ onGoToLogin }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white px-4">
      <div className="mb-8">
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 21H21" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5 7L12 3L19 7" stroke="#34d399" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5 21V7" stroke="#34d399" strokeWidth="2"/>
          <path d="M19 21V7" stroke="#34d399" strokeWidth="2"/>
          <path d="M10 21V11" stroke="#34d399" strokeWidth="2"/>
          <path d="M14 21V11" stroke="#34d399" strokeWidth="2"/>
        </svg>
      </div>

      <div className="bg-[#0f0f0f] border border-[#1f1f1f] p-12 rounded-2xl w-full max-w-[420px] shadow-2xl text-center">
        <div className="w-20 h-20 bg-[#34d399]/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <svg className="w-10 h-10 stroke-[#34d399]" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-3">Conta Criada!</h1>
        
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Seja bem-vindo ao <span className="logo-gradient-text font-bold">Ultra Trade</span>.<br />
          Seu cadastro foi realizado com sucesso e você já pode acessar a plataforma.
        </p>

        <button 
          onClick={onGoToLogin}
          className="w-full py-4 rounded-lg bg-gradient-to-r from-[#34d399] to-[#3b82f6] text-white font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Acessar Plataforma
        </button>
      </div>

      <div className="mt-10 text-[10px] text-[#374151] tracking-widest font-bold">
        © 2026 ULTRA TRADE • CRIPTOGRAFIA ATIVA
      </div>
    </div>
  );
};

export default Success;
