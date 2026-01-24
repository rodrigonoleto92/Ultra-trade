
import React, { useState, useEffect, useRef } from 'react';
import { BINARY_TIMEFRAMES, FOREX_TIMEFRAMES, FOREX_PAIRS, CRYPTO_PAIRS, OTC_PAIRS } from '../constants';
import { Signal, Timeframe, SignalDirection, SignalType } from '../types';
import { generateSignal, scanForBestSignal } from '../services/geminiService';
import SignalCard from './SignalCard';
import Logo from './Logo';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface DashboardProps {
  onLogout: () => void;
  userName?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, userName = 'Trader' }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(Timeframe.M1);
  const [assetCategory, setAssetCategory] = useState<'MOEDAS' | 'CRYPTO'>('MOEDAS');
  const [signalType, setSignalType] = useState<SignalType>(SignalType.BINARY);
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [secondsToNextCandle, setSecondsToNextCandle] = useState(60);
  
  const autoTriggeredRef = useRef<number | null>(null);

  const getMarketStatus = () => {
    const now = new Date();
    const day = now.getDay(); 
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const timeValue = hour * 60 + minutes;

    if (assetCategory === 'CRYPTO') return { isOpen: true, label: 'REAL (CRIPTO)' };

    if (signalType === SignalType.FOREX) {
      const isWeekend = (day === 6) || (day === 0) || (day === 5 && timeValue >= 1080) || (day === 1 && timeValue < 480);
      return isWeekend ? { isOpen: false, label: 'FECHADO' } : { isOpen: true, label: 'REAL (FOREX)' };
    }

    const isOBWeekend = (day === 6 || day === 0);
    const isWeekdayOpenHours = !isOBWeekend && timeValue >= 240 && timeValue <= 1080;

    if (isOBWeekend) {
      return { isOpen: true, isOTC: true, label: 'OTC (FINAL DE SEMANA)' };
    }

    return isWeekdayOpenHours 
      ? { isOpen: true, isOTC: false, label: 'MERCADO REAL' }
      : { isOpen: true, isOTC: true, label: 'MERCADO EM OTC' };
  };

  const marketStatus = getMarketStatus();

  const currentPairsList = assetCategory === 'CRYPTO' 
    ? CRYPTO_PAIRS 
    : (signalType === SignalType.BINARY && (marketStatus as any).isOTC ? OTC_PAIRS : FOREX_PAIRS);

  const triggerSignalGeneration = async () => {
    if (isScanning || !marketStatus.isOpen) return;
    setIsScanning(true);
    setActiveSignal(null);

    try {
      if (signalType === SignalType.BINARY) {
        const signal = await scanForBestSignal(currentPairsList, selectedTimeframe, SignalType.BINARY);
        setActiveSignal(signal);
      } else {
        const isActuallyOTC = (marketStatus as any).isOTC;
        const signal = await generateSignal(selectedPair, selectedTimeframe, isActuallyOTC, signalType);
        setActiveSignal(signal);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const seconds = now.getSeconds();
      const minutes = now.getMinutes();
      
      let tfSeconds = 60;
      let currentBoundary = 0;

      if (selectedTimeframe === Timeframe.M1) {
        tfSeconds = 60 - seconds;
        currentBoundary = minutes;
      } else if (selectedTimeframe === Timeframe.M5) {
        tfSeconds = (5 * 60) - ((minutes % 5) * 60 + seconds);
        currentBoundary = Math.floor(minutes / 5);
      } else if (selectedTimeframe === Timeframe.M15) {
        tfSeconds = (15 * 60) - ((minutes % 15) * 60 + seconds);
        currentBoundary = Math.floor(minutes / 15);
      }

      setSecondsToNextCandle(tfSeconds);

      if (signalType === SignalType.BINARY && tfSeconds === 30 && autoTriggeredRef.current !== currentBoundary) {
        autoTriggeredRef.current = currentBoundary;
        triggerSignalGeneration();
      }

      if (tfSeconds === 59 && activeSignal) {
         setActiveSignal(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedTimeframe, signalType, marketStatus.isOpen, selectedPair, assetCategory, activeSignal]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col text-white">
      {/* Header com Relógio Ampliado */}
      <header className="h-24 flex items-center justify-between px-4 md:px-10 border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Logo size="sm" hideText />
          <div className="flex flex-col">
            <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-slate-500 leading-tight">Bem vindo,</span>
            <span className="text-[10px] md:text-xs font-bold logo-gradient-text leading-tight uppercase">{userName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {/* Relógio Principal Ampliado */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 md:px-6 py-2 md:py-3 rounded-2xl shadow-lg">
             <span className="text-base md:text-2xl font-mono font-black logo-gradient-text tracking-wider">
               {formatTime(secondsToNextCandle)}
             </span>
             <div className={`h-2 w-2 md:h-3 md:w-3 rounded-full shadow-[0_0_10px_currentColor] ${
               secondsToNextCandle <= 5 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'
             }`}></div>
          </div>
          
          <button onClick={onLogout} className="p-3 bg-white/5 hover:bg-rose-500/10 border border-white/10 rounded-2xl transition-all active:scale-90 group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-slate-400 group-hover:text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-3 md:p-6 space-y-4 md:space-y-6 max-w-6xl mx-auto w-full">
        
        {/* Status de Mercado Compacto */}
        <div className="w-full flex justify-center">
           <div className={`px-4 py-1.5 rounded-full border text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${marketStatus.isOpen ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'}`}>
             <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${marketStatus.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
             {marketStatus.label}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 w-full">
          
          {/* Painel de Comando Otimizado */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass p-5 md:p-8 rounded-[24px] md:rounded-[40px] border border-white/5 shadow-xl space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Configuração</h3>
                {signalType === SignalType.BINARY && (
                  <span className="text-[7px] font-black text-blue-500 animate-pulse uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">AUTO-SCAN</span>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                  <button onClick={() => setAssetCategory('MOEDAS')} className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${assetCategory === 'MOEDAS' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-600'}`}>MOEDAS</button>
                  <button onClick={() => setAssetCategory('CRYPTO')} className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${assetCategory === 'CRYPTO' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-600'}`}>CRYPTO</button>
                </div>

                <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                  <button onClick={() => setSignalType(SignalType.BINARY)} className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${signalType === SignalType.BINARY ? 'logo-gradient-bg text-slate-950' : 'text-slate-600'}`}>OB (AUTO)</button>
                  <button onClick={() => setSignalType(SignalType.FOREX)} className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${signalType === SignalType.FOREX ? 'logo-gradient-bg text-slate-950' : 'text-slate-600'}`}>FX (MANUAL)</button>
                </div>

                {signalType === SignalType.FOREX && (
                  <select 
                    value={selectedPair} 
                    onChange={(e) => setSelectedPair(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none"
                  >
                    {currentPairsList.map(p => <option key={p.symbol} value={p.symbol}>{p.symbol}</option>)}
                  </select>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {(signalType === SignalType.BINARY ? BINARY_TIMEFRAMES : FOREX_TIMEFRAMES).map(tf => (
                    <button key={tf.value} onClick={() => setSelectedTimeframe(tf.value)} className={`py-2 rounded-xl text-[9px] font-black border transition-all ${selectedTimeframe === tf.value ? 'bg-white text-slate-950 border-white shadow-lg' : 'bg-slate-900/50 text-slate-600 border-white/5 hover:border-white/20'}`}>{tf.label}</button>
                  ))}
                </div>
              </div>

              {signalType === SignalType.FOREX ? (
                <button 
                  onClick={triggerSignalGeneration} 
                  disabled={isScanning || !marketStatus.isOpen}
                  className="w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isScanning ? 'GERANDO...' : 'GERAR SINAL'}
                </button>
              ) : (
                <div className="text-center py-4 bg-slate-900/30 rounded-xl border border-white/5">
                   <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest animate-pulse">
                     {isScanning ? 'IA BUSCANDO OPORTUNIDADE...' : `BUSCA AUTOMÁTICA EM ${formatTime(secondsToNextCandle)}`}
                   </p>
                </div>
              )}
            </div>
          </div>

          {/* Área de Sinal Priorizada */}
          <div className="lg:col-span-7 flex flex-col">
            {isScanning ? (
              <div className="flex-1 glass rounded-[24px] md:rounded-[40px] flex flex-col items-center justify-center p-8 text-center border border-blue-500/20 animate-in fade-in zoom-in">
                <div className="h-10 w-10 mb-4 relative">
                   <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full animate-ping"></div>
                   <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest">Analisando Mercado</h4>
                <p className="text-slate-500 text-[9px] mt-1 font-bold">SNIPER V12 CLOUD SECURITY</p>
              </div>
            ) : activeSignal ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SignalCard signal={activeSignal} />
                <div className="mt-3 p-4 md:p-6 glass rounded-[20px] md:rounded-[32px] text-center border border-emerald-500/10 bg-emerald-500/5 shadow-lg">
                  <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mb-1">Entrada Sincronizada</p>
                  <p className="text-emerald-400 text-3xl md:text-5xl font-black">{activeSignal.entryTime}</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 border-2 border-dashed border-white/5 rounded-[24px] md:rounded-[40px] flex flex-col items-center justify-center p-8 text-center opacity-30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[9px]">Aguardando Sincronização</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center border-t border-white/5 mt-auto bg-black/20">
        <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.5em] text-slate-700">Ultra Sniper v12.1 Terminal</p>
      </footer>
    </div>
  );
};

export default Dashboard;
