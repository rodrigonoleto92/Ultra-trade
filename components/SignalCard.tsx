
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
    <div className={`glass rounded-[24px] md:rounded-[32px] overflow-hidden border-t-4 md:border-t-0 md:border-l-8 ${isCall ? 'border-emerald-500' : 'border-rose-500'} shadow-2xl`}>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-lg md:text-2xl font-black text-white">{signal.pair}</h3>
            <span className="text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">{signal.type} • {signal.timeframe}</span>
          </div>
          <div className={`text-[8px] md:text-[10px] font-black px-2 py-1 rounded-lg border ${signal.confidence > 85 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
            {signal.confidence}%
          </div>
        </div>

        <div className={`flex items-center justify-center py-4 rounded-xl mb-4 shadow-lg ${isCall ? 'signal-call' : 'signal-put'}`}>
          <div className="flex items-center gap-3">
            {isCall ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase">
              {isCall ? 'COMPRAR' : 'VENDER'}
            </span>
          </div>
        </div>

        {/* Delta Flow Compacto */}
        <div className="mb-4 bg-slate-900/40 p-2 rounded-xl border border-white/5">
          <div className="flex justify-between text-[7px] md:text-[9px] font-black uppercase mb-1">
            <span className="text-emerald-400">{dynamicBuyer.toFixed(0)}% BUY</span>
            <span className="text-rose-400">{dynamicSeller.toFixed(0)}% SELL</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${dynamicBuyer}%` }}></div>
            <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${dynamicSeller}%` }}></div>
          </div>
        </div>

        {isForex ? (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-rose-500/5 p-2 rounded-lg border border-rose-500/20 text-center">
              <p className="text-[7px] text-rose-500 font-black mb-0.5 uppercase">STOP LOSS</p>
              <p className="text-[10px] font-bold text-white font-mono">{signal.stopLoss}</p>
            </div>
            <div className="bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/20 text-center">
              <p className="text-[7px] text-emerald-500 font-black mb-0.5 uppercase">TAKE PROFIT</p>
              <p className="text-[10px] font-bold text-white font-mono">{signal.takeProfit}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5 text-center">
              <p className="text-[7px] text-slate-500 font-black mb-0.5 uppercase">ENTRADA</p>
              <p className="text-sm font-mono font-black text-white">{signal.entryTime}</p>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5 text-center">
              <p className="text-[7px] text-slate-500 font-black mb-0.5 uppercase">EXPIRAÇÃO</p>
              <p className="text-sm font-mono font-black text-white">{signal.expirationTime}</p>
            </div>
          </div>
        )}

        <div className="bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
          <p className="text-[9px] text-slate-400 leading-relaxed font-medium italic">"{signal.strategy}"</p>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;
