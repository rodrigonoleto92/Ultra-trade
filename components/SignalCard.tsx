
import React from 'react';
import { Signal, SignalDirection, SignalType } from '../types';

interface SignalCardProps {
  signal: Signal;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const isCall = signal.direction === SignalDirection.CALL;
  const isForex = signal.type === SignalType.FOREX;

  return (
    <div className={`glass rounded-[32px] overflow-hidden border-l-8 ${isCall ? 'border-l-emerald-500' : 'border-l-rose-500'} transition-all hover:scale-[1.01] duration-500 shadow-2xl`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              {signal.pair}
              <span className="text-[10px] bg-white/10 px-2 py-1 rounded-md text-slate-300 font-black tracking-widest">{signal.type}</span>
            </h3>
            <span className="text-xs font-black text-slate-400 uppercase bg-slate-800/80 border border-white/5 px-3 py-1.5 rounded-full mt-2 inline-block tracking-tighter">
              {signal.timeframe}
            </span>
          </div>
          <div className="text-right">
            <div className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${signal.confidence > 85 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              {signal.confidence}% CONFIANÇA
            </div>
          </div>
        </div>

        <div className={`flex items-center justify-center py-5 rounded-2xl mb-5 shadow-lg ${isCall ? 'signal-call' : 'signal-put'}`}>
          <div className="flex flex-col items-center">
            {isCall ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span className="text-2xl font-black text-white tracking-tighter">
              {isCall ? (isForex ? 'BUY (COMPRA)' : 'CALL (COMPRA)') : (isForex ? 'SELL (VENDA)' : 'PUT (VENDA)')}
            </span>
          </div>
        </div>

        {/* Instrução Estratégica VIP (POC / Correção) */}
        <div className={`mb-5 p-4 rounded-2xl border flex items-start gap-3 ${isCall ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
          <div className={`mt-0.5 p-1 rounded-md ${isCall ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isCall ? 'text-emerald-400' : 'text-rose-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className={`text-[11px] font-bold uppercase leading-relaxed ${isCall ? 'text-emerald-300' : 'text-rose-300'}`}>
            DICA SNIPER: {isCall 
              ? 'Compre sempre em uma correção, ou seja, próximo à POC (região com alto volume de compradores).' 
              : 'Venda sempre na correção, ou seja, próximo à POC (região com alto volume de vendedores).'}
          </p>
        </div>

        {/* Temperatura do Tempo Gráfico Atual */}
        <div className="mb-5 space-y-2 bg-slate-900/40 p-3 rounded-2xl border border-white/5">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center mb-1">Delta de Volume ({signal.timeframe})</p>
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-1">
            <span className="text-emerald-400">Buyer: {signal.buyerPercentage}%</span>
            <span className="text-rose-400">Seller: {signal.sellerPercentage}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500" style={{ width: `${signal.buyerPercentage}%` }}></div>
            <div className="h-full bg-rose-500" style={{ width: `${signal.sellerPercentage}%` }}></div>
          </div>
        </div>

        {isForex ? (
          <div className="space-y-3 mb-5">
            <div className="bg-slate-900/80 p-3.5 rounded-2xl flex justify-between items-center border border-white/5 shadow-inner">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Execução</span>
              <span className="text-xs font-mono font-black text-blue-400">À Mercado (Mkt)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-rose-500/10 p-3.5 rounded-2xl border border-rose-500/30 text-center flex flex-col items-center justify-center min-h-[75px] shadow-sm">
                <p className="text-[9px] text-rose-500 uppercase font-black mb-1 tracking-widest">PROTEÇÃO (SL)</p>
                <p className="text-[10px] font-bold text-white uppercase leading-tight">{signal.stopLoss}</p>
              </div>
              <div className="bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/30 text-center flex flex-col items-center justify-center min-h-[75px] shadow-sm">
                <p className="text-[9px] text-emerald-500 uppercase font-black mb-1 tracking-widest">LUCRO (TP)</p>
                <p className="text-[10px] font-bold text-white uppercase leading-tight">{signal.takeProfit}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-center mb-5">
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/5 shadow-inner">
              <p className="text-[9px] text-slate-500 uppercase font-black mb-1 tracking-widest">Entrada</p>
              <p className="text-lg font-mono font-black text-white">{signal.entryTime}</p>
            </div>
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/5 shadow-inner">
              <p className="text-[9px] text-slate-500 uppercase font-black mb-1 tracking-widest">Expiração</p>
              <p className="text-lg font-mono font-black text-white">{signal.expirationTime}</p>
            </div>
          </div>
        )}

        <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
          <strong className="text-slate-500 font-black uppercase text-[9px] tracking-widest block mb-1">Análise Técnica:</strong> 
          <p className="text-[11px] text-slate-300 leading-relaxed font-medium italic">"{signal.strategy}"</p>
        </div>
      </div>
      
      <div className="bg-slate-900/60 px-6 py-2.5 flex justify-between items-center border-t border-white/5">
        <span className="text-[9px] text-slate-500 flex items-center gap-2 uppercase font-black tracking-widest">
          <span className={`h-1.5 w-1.5 rounded-full ${isForex ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`}></span>
          Sinal Ativo
        </span>
        <span className="text-[9px] text-slate-600 font-mono font-bold tracking-tighter uppercase">Ref ID: {signal.id}</span>
      </div>
    </div>
  );
};

export default SignalCard;
