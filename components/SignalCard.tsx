
import React, { useMemo } from 'react';
import { Signal, SignalDirection, SignalType } from '../types';

interface SignalCardProps {
  signal: Signal;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const isCall = signal.direction === SignalDirection.CALL;
  const isForex = signal.type === SignalType.FOREX;
  const isOTC = signal.pair.toUpperCase().includes('OTC');

  const techTags = useMemo(() => {
    // Adicionando PATTERNS e STRUC ao conjunto de tags
    const base = isOTC ? ["ALGO", "PULSE", "MACD"] : ["SMC", "EMA", "MACD"];
    return [...base, "PATTERNS", "STRUC"];
  }, [isOTC]);

  return (
    <div className={`glass rounded-[24px] md:rounded-[32px] overflow-hidden border-t-4 md:border-t-0 md:border-l-8 ${isCall ? 'border-emerald-500' : 'border-rose-500'} shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] transition-all duration-700 w-full`}>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-start mb-4 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/10 px-2 py-0.5 rounded text-[8px] font-black text-slate-300 uppercase tracking-tighter">
                {isForex ? 'ANALYSIS PRO' : 'OPÇÕES SNIPER'}
              </span>
              {isOTC ? (
                <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                  <div className="h-1 w-1 bg-amber-500 rounded-full animate-pulse"></div>
                  PULSE: ALGORITMO OTC
                </span>
              ) : (
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest animate-pulse">ALGORITMO V18</span>
              )}
            </div>
            <h3 className="text-xl md:text-3xl font-black text-white tracking-tight break-words">{signal.pair}</h3>
            
            <div className="flex flex-wrap gap-1 mt-2">
              {techTags.map(tag => (
                <span key={tag} className={`text-[7px] font-black border px-1.5 py-0.5 rounded uppercase ${isOTC ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{tag}</span>
              ))}
              <span className="text-[7px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">6 CONFLUÊNCIAS</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-[9px] md:text-[11px] font-black px-3 py-1.5 rounded-xl border whitespace-nowrap ${signal.confidence > 90 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
              {Math.floor(signal.confidence)}% <span className="opacity-50">ASSERTIVIDADE</span>
            </div>
          </div>
        </div>

        <div className={`flex flex-col items-center justify-center py-6 md:py-8 rounded-3xl mb-5 shadow-inner transition-all hover:brightness-110 active:scale-[0.98] cursor-default ${isCall ? 'signal-call animate-flash-call' : 'signal-put animate-flash-put'}`}>
          <div className="flex items-center gap-4">
            {isCall ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 11l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M19 13l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <div className="flex flex-col text-center">
              <span className="text-2xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                {isCall ? 'COMPRAR' : 'VENDER'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-black/60 p-3 md:p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
            <span className="text-[8px] text-slate-500 font-black mb-1 uppercase tracking-widest">Início</span>
            <span className="text-sm md:text-lg font-mono font-black text-white">{signal.entryTime}</span>
          </div>
          <div className="bg-black/60 p-3 md:p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
            <span className="text-[8px] text-slate-500 font-black mb-1 uppercase tracking-widest">Expiração</span>
            <span className="text-sm md:text-lg font-mono font-black text-white">{signal.expirationTime}</span>
          </div>
        </div>

        <div className="mb-5 space-y-2">
          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest px-1">
            <span className={isCall ? 'text-emerald-400' : 'text-slate-500'}>Volume de Compra</span>
            <span className={!isCall ? 'text-rose-400' : 'text-slate-500'}>Volume de Venda</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-white/5">
            <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981] transition-all duration-700" style={{ width: `${signal.buyerPercentage}%` }}></div>
            <div className="h-full bg-rose-500 shadow-[0_0_10px_#ef4444] transition-all duration-700" style={{ width: `${signal.sellerPercentage}%` }}></div>
          </div>
        </div>

        <div className={`p-4 md:p-5 rounded-2xl border backdrop-blur-sm flex flex-col items-center justify-center ${isCall ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${isCall ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white text-center">
              {signal.strategy}
            </span>
          </div>
          
          <div className="w-full mt-6 pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center">
              <span className="text-[7px] text-slate-600 font-black uppercase">PADRÕES</span>
              <div className="h-1 w-full bg-white/5 mt-1 rounded-full overflow-hidden">
                <div className={`h-full ${isCall ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[7px] text-slate-600 font-black uppercase">LTA/LTB</span>
              <div className="h-1 w-full bg-white/5 mt-1 rounded-full overflow-hidden">
                <div className={`h-full ${isCall ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[7px] text-slate-600 font-black uppercase">CANAL</span>
              <div className="h-1 w-full bg-white/5 mt-1 rounded-full overflow-hidden">
                <div className={`h-full ${isOTC ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;
