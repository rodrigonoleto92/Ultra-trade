
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

    if (assetCategory === 'CRYPTO') return { isOpen: true, label: 'MERCADO REAL (CRIPTO)' };

    if (signalType === SignalType.FOREX) {
      const isWeekend = (day === 5 && timeValue >= 960) || (day === 6) || (day === 0 && timeValue < 1260);
      return isWeekend ? { isOpen: false, label: 'MERCADO FECHADO (WEEKEND)' } : { isOpen: true, label: 'MERCADO REAL (FOREX)' };
    }

    const isOBOpen = timeValue >= 240 && timeValue <= 960;
    return isOBOpen 
      ? { isOpen: true, isOTC: false, label: 'MERCADO REAL (OB)' }
      : { isOpen: true, isOTC: true, label: 'MERCADO EM OTC (OB)' };
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
      {/* Header com Saudação Visível em Mobile e Desktop */}
      <header className="h-24 flex items-center justify-between px-4 md:px-10 border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4 md:gap-8">
          <Logo size="sm" hideText className="md:flex hidden" />
          <Logo size="sm" className="md:hidden flex" hideText />
          
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-[6px] md:text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">Próxima Vela</span>
              <span className="text-sm md:text-xl font-mono font-black logo-gradient-text leading-none">{formatTime(secondsToNextCandle)}</span>
            </div>
            <div className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full ${secondsToNextCandle <= 5 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-slate-500 leading-tight">Bem vindo,</span>
            <span className="text-[10px] md:text-xs font-bold logo-gradient-text leading-tight uppercase">{userName}</span>
          </div>
          <button onClick={onLogout} className="p-2 md:px-5 md:py-2.5 bg-white/5 hover:bg-rose-500/10 border border-white/10 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-all active:scale-95">
            <span className="hidden md:inline">Sair</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4 md:p-6 space-y-8 max-w-5xl mx-auto w-full">
        
        <div className="w-full flex justify-center">
           <div className={`px-6 md:px-10 py-3 rounded-full border shadow-lg backdrop-blur-sm flex items-center gap-3 ${marketStatus.isOpen ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'}`}>
             <div className={`h-2 w-2 rounded-full animate-pulse ${marketStatus.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
             <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em]">{marketStatus.label}</span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="glass p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-white/5 shadow-2xl space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">Painel de Comando</h3>
                {signalType === SignalType.BINARY && (
                  <span className="text-[8px] font-black text-blue-500 animate-pulse uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded">Varredura Ativa</span>
                )}
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-4 tracking-widest">Categoria de Ativos</label>
                <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl mb-4 border border-white/5">
                  <button onClick={() => setAssetCategory('MOEDAS')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${assetCategory === 'MOEDAS' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-600 hover:text-slate-400'}`}>MOEDAS</button>
                  <button onClick={() => setAssetCategory('CRYPTO')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${assetCategory === 'CRYPTO' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-600 hover:text-slate-400'}`}>CRYPTO</button>
                </div>

                {signalType === SignalType.FOREX ? (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Escolha o Ativo</label>
                    <select 
                      value={selectedPair} 
                      onChange={(e) => setSelectedPair(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-2xl p-4 md:p-5 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none shadow-xl cursor-pointer"
                    >
                      {currentPairsList.map(p => <option key={p.symbol} value={p.symbol}>{p.symbol}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="p-5 md:p-6 bg-slate-900/50 rounded-2xl border border-white/5 text-center space-y-3 animate-in fade-in zoom-in duration-700">
                    <div className="flex justify-center gap-1.5">
                       {[1,2,3].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{animationDelay: `${i*0.2}s`}}></div>)}
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Varredura em tempo real ativada</p>
                    <p className="text-[9px] text-slate-600 font-bold uppercase leading-relaxed">A IA selecionará o melhor ativo automaticamente.</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-4 tracking-widest">Estratégia e Tempo</label>
                <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl mb-4 border border-white/5">
                  <button onClick={() => setSignalType(SignalType.BINARY)} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${signalType === SignalType.BINARY ? 'logo-gradient-bg text-slate-950 shadow-lg' : 'text-slate-600'}`}>OPÇÕES (AUTO)</button>
                  <button onClick={() => setSignalType(SignalType.FOREX)} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${signalType === SignalType.FOREX ? 'logo-gradient-bg text-slate-950 shadow-lg' : 'text-slate-600'}`}>FOREX (MANUAL)</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(signalType === SignalType.BINARY ? BINARY_TIMEFRAMES : FOREX_TIMEFRAMES).map(tf => (
                    <button key={tf.value} onClick={() => setSelectedTimeframe(tf.value)} className={`py-3 md:py-4 rounded-2xl text-[10px] font-black border transition-all ${selectedTimeframe === tf.value ? 'bg-white text-slate-950 border-white shadow-white/10 shadow-lg' : 'bg-slate-900/50 text-slate-600 border-white/5 hover:border-white/20'}`}>{tf.label}</button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex flex-col items-center">
                 <div className="text-center mb-6 relative">
                    <div className="absolute -inset-6 bg-blue-500/5 blur-[30px] rounded-full animate-pulse"></div>
                    <p className="text-6xl md:text-6xl font-mono font-black logo-gradient-text tracking-tighter drop-shadow-[0_0_15px_rgba(96,165,250,0.3)] relative z-10">
                      {formatTime(secondsToNextCandle)}
                    </p>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3 relative z-10">
                      Próxima Vela <span className="text-slate-700">(Sincronizada)</span>
                    </p>
                 </div>

                 {signalType === SignalType.FOREX ? (
                    <button 
                      onClick={triggerSignalGeneration} 
                      disabled={isScanning || !marketStatus.isOpen}
                      className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-2xl ${
                        !marketStatus.isOpen ? 'bg-slate-800 text-slate-600 opacity-50' :
                        isScanning ? 'bg-slate-800 text-slate-600' : 
                        'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20'
                      }`}
                    >
                      {isScanning ? 'PROCESSANDO...' : 'GERAR SINAL FOREX'}
                    </button>
                 ) : (
                    <div className="w-full text-center py-5 bg-slate-900/30 rounded-[24px] border border-white/5 backdrop-blur-sm">
                       <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest animate-pulse">
                         {isScanning ? 'IA ESCANEANDO...' : 'SINAL AUTOMÁTICO EM 30S'}
                       </p>
                    </div>
                 )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col min-h-[400px] md:min-h-[500px]">
            {isScanning ? (
              <div className="flex-1 glass rounded-[32px] md:rounded-[40px] flex flex-col items-center justify-center p-8 md:p-12 text-center border border-blue-500/20 animate-in fade-in zoom-in">
                <div className="h-12 w-12 md:h-16 md:w-16 mb-6 md:mb-8 relative">
                   <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full animate-ping"></div>
                   <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h4 className="text-lg md:text-xl font-black uppercase tracking-tighter mb-2">Monitoramento Hunter</h4>
                <p className="text-slate-500 text-[10px] md:text-xs max-w-xs leading-relaxed font-bold">
                  {signalType === SignalType.BINARY 
                    ? `Varredura em ${currentPairsList.length} ativos...` 
                    : `Analisando ${selectedPair}...`}
                </p>
              </div>
            ) : activeSignal ? (
              <div className="animate-in fade-in zoom-in duration-700">
                <SignalCard signal={activeSignal} />
                <div className="mt-6 p-6 md:p-8 glass rounded-[24px] md:rounded-[32px] text-center border border-emerald-500/20 bg-emerald-500/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">Ponto Exato de Entrada</p>
                  <p className="text-emerald-400 text-4xl md:text-5xl font-black drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">{activeSignal.entryTime}</p>
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.4em] mt-5 group-hover:text-emerald-500 transition-colors">Ultra Sniper v12.1 Cloud</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 border-2 border-dashed border-white/5 rounded-[32px] md:rounded-[40px] flex flex-col items-center justify-center p-8 md:p-12 text-center opacity-40">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 md:mb-8 border border-white/5">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                   </svg>
                </div>
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">Aguardando disparo da IA</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-8 text-center border-t border-white/5 mt-12 bg-black/40">
        <p className="text-[9px] font-black uppercase tracking-[1em] text-slate-700">Ultra Sniper Terminal v12.1</p>
      </footer>
    </div>
  );
};

export default Dashboard;
