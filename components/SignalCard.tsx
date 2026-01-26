
import React, { useState, useEffect } from 'react';
import { Signal, SignalDirection, SignalType } from '../types';

interface SignalCardProps {
  signal: Signal;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const isCall = signal.direction === SignalDirection.CALL;
  const isForex = signal.type === SignalType.FOREX;

  const [dynamicBuyer, setDynamicBuyer] = useState(signal.buyerPercentage);
  const [dynamicSeller, setDynamicSeller] = useState(signal.sellerPercentage);

  useEffect(() => {
    setDynamicBuyer(signal.buyerPercentage);
    setDynamicSeller(signal.sellerPercentage);

    const interval = setInterval(() => {
      setDynamicBuyer(prev => {
        const drift = (Math.random() - 0.5) * 2;
        const newVal = Math.min(Math.max(prev + drift, 10), 90);
        setDynamicSeller(100 - newVal);
        return newVal;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [signal.id, signal.buyerPercentage, signal.sellerPercentage]);

  return (
    <div className={`glass rounded-[24px] md:rounded-[32px] overflow-hidden border-t-4 md:border-t-0 md:border-l-8 ${isCall ? 'border-emerald-500' : 'border-rose-500'} shadow-2xl transition-all duration-700`}>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg md:text-2xl font-black text-white">{signal.pair}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">{signal.type} • {signal.timeframe}</span>
              <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                <div className="h-1 w-1 rounded-full bg-blue-400 animate-pulse"></div>
                <span className="text-[7px] font-black text-blue-400 uppercase tracking-tighter">ANÁLISE ATIVA</span>
              </div>
            </div>
          </div>
          <div className={`text-[8px] md:text-[10px] font-black px-2 py-1 rounded-lg border ${signal.confidence > 85 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
            {signal.confidence}% ACERTIVIDADE
          </div>
        </div>

        <div className={`flex items-center justify-center py-5 rounded-2xl mb-4 shadow-xl transition-transform active:scale-95 ${isCall ? 'signal-call animate-flash-call' : 'signal-put animate-flash-put'}`}>
          <div className="flex items-center gap-3">
            {isCall ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase">
              {isCall ? 'COMPRAR' : 'VENDER'}
            </span>
          </div>
        </div>

        {/* Gerenciamento FX/CRYPTO */}
        {isForex && (
          <div className="mb-4 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-center">
            <p className="text-[8px] text-blue-400 font-black uppercase mb-1 tracking-widest">Alvo de Operação</p>
            <p className="text-xs font-bold text-white uppercase italic">
              {isCall ? 'Stop no fundo anterior • Alvo 2:1' : 'Stop no topo anterior • Alvo 2:1'}
            </p>
          </div>
        )}

        <div className="mb-4 bg-slate-900/60 p-3 rounded-xl border border-white/5">
          <div className="flex justify-between text-[7px] md:text-[9px] font-black uppercase mb-1.5">
            <span className="text-emerald-400">{dynamicBuyer.toFixed(0)}% COMPRADORES</span>
            <span className="text-rose-400">{dynamicSeller.toFixed(0)}% VENDEDORES</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500 shadow-[0_0_8px_#10b981] transition-all duration-1000" style={{ width: `${dynamicBuyer}%` }}></div>
            <div className="h-full bg-rose-500 shadow-[0_0_8px_#ef4444] transition-all duration-1000" style={{ width: `${dynamicSeller}%` }}></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5 text-center">
            <p className="text-[7px] text-slate-500 font-black mb-1 uppercase tracking-widest">Entrada</p>
            <p className="text-sm font-mono font-black text-white">{signal.entryTime}</p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-white/5 text-center">
            <p className="text-[7px] text-slate-500 font-black mb-1 uppercase tracking-widest">Expiração</p>
            <p className="text-sm font-mono font-black text-white">{isForex ? 'AUTO-PROFIT' : signal.expirationTime}</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isCall ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`h-1.5 w-1.5 rounded-full ${isCall ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 italic">Sniper Vision v15.0</span>
          </div>
          <p className="text-[11px] md:text-[12px] text-white leading-relaxed font-bold">
            "{signal.strategy}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;
