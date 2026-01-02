
import React, { useState, useEffect, useRef } from 'react';
import { ALL_PAIRS, TIMEFRAMES } from '../constants';
import { Signal, Timeframe, SignalDirection, MarketType } from '../types';
import { generateSignal } from '../services/geminiService';
import SignalCard from './SignalCard';
import Logo from './Logo';

const Dashboard: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(Timeframe.M1);
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [secondsToNextCandle, setSecondsToNextCandle] = useState(60);
  const [flashActive, setFlashActive] = useState(false);
  const [currentScanningPair, setCurrentScanningPair] = useState<{symbol: string, type: string} | null>(null);
  
  const lastTriggeredCandleRef = useRef<string>("");

  const isOTCOnlyTime = () => {
    const hour = currentTime.getHours();
    if (hour >= 16 || hour < 4) return true;
    return false;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      const seconds = now.getSeconds();
      const minutes = now.getMinutes();
      
      let tfSeconds = 60;
      if (selectedTimeframe === Timeframe.M1) tfSeconds = 60 - seconds;
      else if (selectedTimeframe === Timeframe.M5) tfSeconds = (5 * 60) - ((minutes % 5) * 60 + seconds);
      else if (selectedTimeframe === Timeframe.M15) tfSeconds = (15 * 60) - ((minutes % 15) * 60 + seconds);

      setSecondsToNextCandle(tfSeconds);

      // GATILHO AUTOMÁTICO EXATAMENTE AOS 15 SEGUNDOS DO FIM DA VELA
      if (!isScanning && tfSeconds === 15) {
        const triggerId = `${selectedTimeframe}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
        if (lastTriggeredCandleRef.current !== triggerId) {
          lastTriggeredCandleRef.current = triggerId;
          handleMultiPairScan();
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedTimeframe, isScanning, currentTime]);

  const handleMultiPairScan = async () => {
    setIsScanning(true);
    setActiveSignal(null);
    
    try {
      const otcActive = isOTCOnlyTime();
      const availablePairs = otcActive 
        ? ALL_PAIRS.filter(p => p.type === MarketType.OTC)
        : ALL_PAIRS;

      const shuffledPairs = [...availablePairs].sort(() => 0.5 - Math.random());
      
      // Simulação visual de alta performance
      for (let i = 0; i < Math.min(3, shuffledPairs.length); i++) {
        setCurrentScanningPair({
          symbol: shuffledPairs[i].symbol,
          type: shuffledPairs[i].type
        });
        await new Promise(r => setTimeout(r, 350)); 
      }

      if (shuffledPairs.length > 0) {
        const winnerPair = shuffledPairs[0].symbol;
        const newSignal = await generateSignal(winnerPair, selectedTimeframe);
        
        setActiveSignal(newSignal);
        setFlashActive(true);
        setTimeout(() => setFlashActive(false), 800);
      }
      
    } catch (err) {
      console.error("Erro no processamento de sinal:", err);
    } finally {
      setIsScanning(false);
      setCurrentScanningPair(null);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const otcActive = isOTCOnlyTime();

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col">
      <header className="glass sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo size="sm" />
            <div className="hidden md:flex flex-col border-l border-white/10 pl-6">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full animate-pulse ${otcActive ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-blue-500 shadow-[0_0_8px_#3b82f6]'}`}></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  IA ENGINE: {otcActive ? 'SCANNER OTC V4.1' : 'SCANNER GLOBAL V4.1'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block border-r border-white/10 pr-8">
              <p className="text-xl font-mono font-bold text-white tracking-tighter">
                {currentTime.toLocaleTimeString('pt-BR')}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Tempo Atual</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-mono font-black ${secondsToNextCandle <= 15 ? 'text-blue-400 animate-pulse' : 'logo-gradient-text'}`}>
                {formatTime(secondsToNextCandle)}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Fechamento Vela</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-3xl border border-white/5 shadow-2xl">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Parâmetros</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Timeframe de Operação</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIMEFRAMES.map(tf => (
                    <button
                      key={tf.value}
                      onClick={() => {
                        setSelectedTimeframe(tf.value);
                        setActiveSignal(null);
                      }}
                      className={`py-3 rounded-xl text-xs font-black transition-all border ${
                        selectedTimeframe === tf.value
                          ? 'logo-gradient-bg border-transparent text-slate-900'
                          : 'bg-slate-900/80 border-slate-700/50 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10">
                <p className="text-[10px] text-blue-400 font-black uppercase mb-3 tracking-widest">Sincronização</p>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Protocolo de entrada automática: o sinal é gerado restando exatamente <span className="text-white font-bold">15 segundos</span> para o término do período.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-2 tracking-widest">Status do Terminal</p>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-emerald-500 font-black flex items-center gap-1 uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    IA Sincronizada
                  </span>
                  <span className="text-[9px] text-slate-500 font-black uppercase">v4.1 VIP</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-b from-transparent to-blue-500/5">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Monitoramento</h2>
            <div className="space-y-4">
               <div className={`p-3 rounded-xl border ${otcActive ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/40 border-white/5'}`}>
                 <p className="text-[10px] text-white font-bold uppercase mb-1">16:00 - 04:00 (OTC)</p>
                 <p className="text-[9px] text-slate-400 uppercase font-medium">Algoritmo de Volatilidade</p>
               </div>
               <div className={`p-3 rounded-xl border ${!otcActive ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-800/40 border-white/5'}`}>
                 <p className="text-[10px] text-white font-bold uppercase mb-1">04:01 - 15:59 (Aberto)</p>
                 <p className="text-[9px] text-slate-400 uppercase font-medium">Fluxo Institucional</p>
               </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3">
          {!activeSignal ? (
            <div className="glass rounded-[40px] h-[550px] flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-white/5 relative overflow-hidden">
              {isScanning && <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>}
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className={`mb-10 transition-all ${isScanning ? 'scale-110' : 'opacity-20'}`}>
                  {isScanning ? (
                    <div className="relative h-32 w-32 flex items-center justify-center mx-auto">
                      <div className={`absolute inset-0 border-4 rounded-full border-blue-500/10`}></div>
                      <div className={`absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin`}></div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-blue-400 leading-none">{currentScanningPair?.symbol}</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase mt-1">Analisando...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-full border-2 border-slate-800 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="max-w-md w-full">
                  <h3 className="text-3xl font-black text-white mb-6 tracking-tighter uppercase">
                    {isScanning ? 'Sincronizando Algoritmos...' : 'Aguardando sinal da IA'}
                  </h3>
                  
                  <div className={`p-6 rounded-3xl border mb-8 transition-all duration-700 ${secondsToNextCandle <= 20 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-900/40 border-white/5'}`}>
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">
                      {secondsToNextCandle > 15 
                        ? `O sistema entrará em modo de escaneamento nos 15 segundos finais do período de ${selectedTimeframe}.`
                        : `IA processando padrões de confluência... Mantenha a corretora aberta.`}
                    </p>
                  </div>

                  {!isScanning && (
                    <div className="flex flex-col items-center gap-4">
                       <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] mb-2">Protocolo de Alta Precisão v4.1</span>
                       <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden">
                         <div 
                          className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                          style={{ width: `${(60 - secondsToNextCandle) * 1.66}%` }}
                         ></div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div 
              className={`max-w-2xl mx-auto w-full transition-all duration-500 ${
                flashActive 
                  ? (activeSignal.direction === SignalDirection.CALL ? 'animate-flash-call' : 'animate-flash-put') 
                  : 'animate-in fade-in slide-in-from-bottom-6'
              }`}
            >
              <div className="mb-8 flex flex-col items-center gap-4">
                <div className={`flex items-center gap-3 py-2.5 px-8 border rounded-full bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]`}>
                  <span className="animate-ping h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                  <span className="text-sm font-black uppercase tracking-widest text-blue-400">
                    Sinal Detectado - Entre em {secondsToNextCandle}s
                  </span>
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Análise Concluída</h2>
              </div>

              <SignalCard signal={activeSignal} />
              
              <div className="mt-8 p-10 glass rounded-[40px] border border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 pointer-events-none">
                   <span className="text-6xl font-black text-blue-500/10 tabular-nums">{secondsToNextCandle}</span>
                </div>
                
                <div className="flex items-center gap-5 mb-8">
                  <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white uppercase tracking-widest leading-none mb-1">Execução Imediata</h4>
                    <p className="text-xs text-blue-400/80 font-bold uppercase tracking-wider">Aguarde os 15 segundos finais para entrada</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-5 text-sm text-slate-300 items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors">
                    <span className="h-8 w-8 rounded-full bg-blue-500 text-slate-900 flex items-center justify-center font-black flex-shrink-0 shadow-md">1</span>
                    <p>Localize o ativo <span className="text-white font-bold">{activeSignal.pair}</span> na sua plataforma.</p>
                  </div>
                  <div className="flex gap-5 text-sm text-slate-300 items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors">
                    <span className="h-8 w-8 rounded-full bg-blue-500 text-slate-900 flex items-center justify-center font-black flex-shrink-0 shadow-md">2</span>
                    <p>Confirme o tempo para <span className="text-white font-bold">{activeSignal.timeframe}</span>.</p>
                  </div>
                  <div className="flex gap-5 text-sm text-slate-200 items-center bg-blue-500/20 p-5 rounded-2xl border border-blue-500/40 shadow-xl">
                    <span className="h-8 w-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-black flex-shrink-0 animate-bounce shadow-md">3</span>
                    <p className="font-bold">Clique em <span className="text-white font-black">{activeSignal.direction === 'CALL' ? 'COMPRA' : 'VENDA'}</span> exatamente às <span className="text-white font-black">{activeSignal.entryTime}</span>.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="glass border-t border-white/5 py-6 px-6 text-center">
        <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.5em]">
          ULTRA TRADE VIP © 2026 | TERMINAL DE ALTA FREQUÊNCIA v4.1
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
