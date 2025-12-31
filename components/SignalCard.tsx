
import React from 'react';
import { Signal, SignalDirection } from '../types';

interface SignalCardProps {
  signal: Signal;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const isCall = signal.direction === SignalDirection.CALL;

  return (
    <div className={`glass rounded-2xl overflow-hidden border-l-4 ${isCall ? 'border-l-emerald-500' : 'border-l-rose-500'} transition-all hover:scale-[1.02] duration-300`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{signal.pair}</h3>
            <span className="text-xs font-medium text-slate-400 uppercase bg-slate-800 px-2 py-1 rounded mt-1 inline-block">
              {signal.timeframe}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${signal.confidence > 85 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              {signal.confidence}% Confiança
            </span>
          </div>
        </div>

        <div className={`flex items-center justify-center py-4 rounded-xl mb-4 ${isCall ? 'signal-call' : 'signal-put'}`}>
          <div className="flex flex-col items-center">
            {isCall ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span className="text-2xl font-black text-white">{isCall ? 'COMPRA (CALL)' : 'VENDA (PUT)'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center mb-4">
          <div className="bg-slate-800/50 p-2 rounded-lg">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Entrada</p>
            <p className="text-lg font-mono font-bold text-white">{signal.entryTime}</p>
          </div>
          <div className="bg-slate-800/50 p-2 rounded-lg">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Expiração</p>
            <p className="text-lg font-mono font-bold text-white">{signal.expirationTime}</p>
          </div>
        </div>

        <div className="mt-2 text-xs text-slate-400 italic">
          <strong className="text-slate-300 not-italic">Estratégia:</strong> {signal.strategy}
        </div>
      </div>
      
      <div className="bg-slate-800/30 px-5 py-2 flex justify-between items-center border-t border-slate-700/50">
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-custom"></span>
          Sinal Ativo
        </span>
        <span className="text-[10px] text-slate-500">ID: {signal.id}</span>
      </div>
    </div>
  );
};

export default SignalCard;
