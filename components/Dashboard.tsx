
import React, { useState, useEffect, useRef } from 'react';
import { ALL_PAIRS, OTC_PAIRS, TIMEFRAMES } from '../constants';
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

  // Determina se estamos em horário de OTC obrigatório (16:00 às 04:00)
  const isOTCOnlyTime = () => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    
    // De 16:00:00 até 04:00:59
    if (hour >= 16 || hour < 4) {
      return true;
    }
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

      // GATILHO: 15 SEGUNDOS ANTES DO FECHAMENTO
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
      const otcOnly = isOTCOnlyTime();
      const availablePairs = otcOnly 
        ? ALL_PAIRS.filter(p => p.type === MarketType.OTC)
        : ALL_PAIRS;

      const shuffledPairs = [...availablePairs].sort(() => 0.5 - Math.random());
      
      // Simulação visual de análise para o usuário
      for (let i = 0; i < Math.min(4, shuffledPairs.length); i++) {
        setCurrentScanningPair({
          symbol: shuffledPairs[i].symbol,
          type: shuffledPairs[i].type
        });
        await new Promise(r => setTimeout(r, 450)); 
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
                  IA ENGINE: {otcActive ? 'SCANNER OTC ATIVO' : 'SCANNER HÍBRIDO ATIVO'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block border-r border-white/10 pr-8">
              <p className="text-xl font-mono font-bold text-white tracking-tighter">
                {currentTime.toLocaleTimeString('pt-BR')}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Relógio do Sistema</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-mono font-black ${secondsToNextCandle <= 15 ? 'text-blue-400 animate-pulse' : 'logo-gradient-text'}`}>
                {formatTime(secondsToNextCandle)}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Gatilho (15s)</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Configurações</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Timeframe de Análise</label>
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

              <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-3 tracking-widest">Monitoramento</p>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Aberto (04:01-15:59)</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${!otcActive ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-800'}`}></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">OTC (16:00-04:00)</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${otcActive ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-800'}`}></span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest text-center animate-pulse">
                   IA aguardando leitura do fluxo...
                </p>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-b from-transparent to-blue-500/5">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Regras de Mercado</h2>
            <div className="space-y-4">
               <div className={`p-3 rounded-xl border transition-colors ${otcActive ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/40 border-white/5'}`}>
                 <p className="text-[10px] text-white font-bold uppercase mb-1 flex items-center gap-2">
                   16:00 às 04:00 {otcActive && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>}
                 </p>
                 <p className="text-[9px] text-slate-400 uppercase leading-relaxed font-medium">Sinais exclusivos para ativos OTC.</p>
               </div>
               <div className={`p-3 rounded-xl border transition-colors ${!otcActive ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-800/40 border-white/5'}`}>
                 <p className="text-[10px] text-white font-bold uppercase mb-1 flex items-center gap-2">
                   04:01 às 15:59 {!otcActive && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping"></span>}
                 </p>
                 <p className="text-[9px] text-slate-400 uppercase leading-relaxed font-medium">Sinais para Mercado Aberto e OTC.</p>
               </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3">
          <div className="flex justify-between items-end mb-8">
            <div className="flex flex-col gap-1">
               <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Terminal IA v3.1</h2>
               <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">
                 {otcActive ? 'Processando algoritmos de volatilidade OTC' : 'Monitorando fluxo global institucional'}
               </span>
            </div>
          </div>

          {!activeSignal ? (
            <div className="glass rounded-[40px] h-[550px] flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-white/5 relative overflow-hidden">
              {isScanning && <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>}
              <div className="relative z-10">
                <div className={`mb-10 transition-all ${isScanning ? 'scale-110' : 'opacity-10 grayscale'}`}>
                  {isScanning ? (
                    <div className="relative h-24 w-24 flex items-center justify-center mx-auto">
                      <div className={`absolute inset-0 border-4 rounded-full ${otcActive ? 'border-amber-500/20' : 'border-blue-500/20'}`}></div>
                      <div className={`absolute inset-0 border-4 border-t-transparent rounded-full animate-spin ${otcActive ? 'border-amber-500' : 'border-blue-500'}`}></div>
                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-black leading-none ${otcActive ? 'text-amber-500' : 'text-blue-400'}`}>{currentScanningPair?.symbol}</span>
                        <span className="text-[8px] text-slate-500 font-bold">{currentScanningPair?.type}</span>
                      </div>
                    </div>
                  ) : (
                    <Logo size="lg" hideText className="justify-center" />
                  )}
                </div>
                <h3 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase">
                  {isScanning ? 'Aguardando IA fazer a leitura do mercado...' : 'Aguardando Próxima Vela'}
                </h3>
                <p className="text-slate-500 text-base max-w-sm mx-auto leading-relaxed font-medium">
                  {isScanning 
                    ? `Analisando força de fluxo institucional em ${currentScanningPair?.symbol}...` 
                    : `Sinal automático aos 45 segundos (15s para preparação).`}
                </p>
              </div>
            </div>
          ) : (
            <div 
              className={`max-w-2xl mx-auto w-full transition-all duration-500 ${
                flashActive 
                  ? (activeSignal.direction === SignalDirection.CALL ? 'animate-flash-call' : 'animate-flash-put') 
                  : 'animate-in fade-in slide-in-from-bottom-4'
              }`}
            >
              <div className={`mb-4 flex items-center justify-center gap-2 py-2 px-4 border rounded-full w-fit mx-auto ${otcActive ? 'bg-amber-500/10 border-amber-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                <span className={`animate-ping h-2 w-2 rounded-full ${otcActive ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${otcActive ? 'text-amber-500' : 'text-blue-400'}`}>
                  Sinal Identificado - {activeSignal.pair}
                </span>
              </div>
              <SignalCard signal={activeSignal} />
              
              <div className="mt-12 p-8 glass rounded-[32px] border border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">Checklist de Operação (15s)</h4>
                </div>
                <ul className="space-y-4">
                  <li className="flex gap-4 text-xs text-slate-400 items-center">
                    <span className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-black flex-shrink-0 border border-white/5">1</span>
                    Selecione o ativo <span className="text-white font-bold">{activeSignal.pair}</span> agora na corretora.
                  </li>
                  <li className="flex gap-4 text-xs text-slate-400 items-center">
                    <span className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-black flex-shrink-0 border border-white/5">2</span>
                    Confirme o tempo de expiração para <span className="text-white font-bold">{activeSignal.timeframe}</span>.
                  </li>
                  <li className="flex gap-4 text-xs text-slate-400 items-center">
                    <span className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-black flex-shrink-0 border border-white/5">3</span>
                    Clique no botão às <span className="text-white font-black">{activeSignal.entryTime}</span> em ponto.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="glass border-t border-white/5 py-4 px-6 text-center">
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">
          Ultra Trade Signal VIP - IA Predição v3.1 | {otcActive ? 'OTC MODE' : 'HYBRID MODE'}
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
