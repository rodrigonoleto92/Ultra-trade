
import React, { useState, useEffect, useRef } from 'react';
import { ALL_PAIRS, TIMEFRAMES } from '../constants';
import { Signal, Timeframe, SignalDirection, MarketType } from '../types';
import { generateSignal } from '../services/geminiService';
import SignalCard from './SignalCard';
import Logo from './Logo';

interface DashboardProps {
  onLogout: () => void;
}

type AssetCategory = 'MOEDAS' | 'CRYPTO';

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(Timeframe.M1);
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('MOEDAS');
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [secondsToNextCandle, setSecondsToNextCandle] = useState(60);
  const [flashActive, setFlashActive] = useState(false);
  const [currentScanningPair, setCurrentScanningPair] = useState<{symbol: string, type: string} | null>(null);
  
  const lastTriggeredCandleRef = useRef<string>("");

  const isOTCOnlyTime = () => {
    const day = currentTime.getDay(); 
    const hour = currentTime.getHours();
    if (day === 0 || day === 6) return true;
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

      if (!isScanning && tfSeconds === 15) {
        const triggerId = `${selectedTimeframe}-${assetCategory}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
        if (lastTriggeredCandleRef.current !== triggerId) {
          lastTriggeredCandleRef.current = triggerId;
          handleMultiPairScan();
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedTimeframe, assetCategory, isScanning, currentTime]);

  const handleMultiPairScan = async () => {
    setIsScanning(true);
    setActiveSignal(null);
    
    try {
      const otcActive = isOTCOnlyTime();
      let availablePairs = [];

      if (assetCategory === 'CRYPTO') {
        // Crypto é sempre OTC na maioria das plataformas
        availablePairs = ALL_PAIRS.filter(p => p.type === MarketType.CRYPTO_OTC);
      } else {
        // Moedas respeita o horário de mercado/OTC
        availablePairs = otcActive 
          ? ALL_PAIRS.filter(p => p.type === MarketType.OTC)
          : ALL_PAIRS.filter(p => p.type === MarketType.FOREX);
      }

      const shuffledPairs = [...availablePairs].sort(() => 0.5 - Math.random());
      
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
  const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6;

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col">
      <header className="glass sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo size="sm" />
            <div className="hidden md:flex flex-col border-l border-white/10 pl-6">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full animate-pulse ${assetCategory === 'CRYPTO' ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' : (otcActive ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-blue-500 shadow-[0_0_8px_#3b82f6]')}`}></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  {assetCategory === 'CRYPTO' ? 'SCANNER CRYPTO OTC V4.1' : (isWeekend ? 'SCANNER WEEKEND OTC V4.1' : (otcActive ? 'SCANNER OTC V4.1' : 'SCANNER GLOBAL V4.1'))}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <div className="text-right hidden sm:block border-r border-white/10 pr-8">
              <p className="text-xl font-mono font-bold text-white tracking-tighter">
                {currentTime.toLocaleTimeString('pt-BR')}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Tempo Atual</p>
            </div>
            <div className="text-right border-r border-white/10 pr-4 sm:pr-8">
              <p className={`text-2xl font-mono font-black ${secondsToNextCandle <= 15 ? 'text-blue-400 animate-pulse' : 'logo-gradient-text'}`}>
                {formatTime(secondsToNextCandle)}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Fechamento</p>
            </div>
            
            <button 
              onClick={onLogout}
              className="group flex items-center gap-2 py-2 px-4 rounded-xl border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 group-hover:text-rose-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-rose-500 hidden md:block">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-3xl border border-white/5 shadow-2xl">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Parâmetros</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Tipo de Ativos</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setAssetCategory('MOEDAS');
                      setActiveSignal(null);
                    }}
                    className={`py-3 rounded-xl text-[10px] font-black transition-all border flex items-center justify-center gap-2 ${
                      assetCategory === 'MOEDAS'
                        ? 'logo-gradient-bg border-transparent text-slate-900 shadow-lg'
                        : 'bg-slate-900/80 border-slate-700/50 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    MOEDAS
                  </button>
                  <button
                    onClick={() => {
                      setAssetCategory('CRYPTO');
                      setActiveSignal(null);
                    }}
                    className={`py-3 rounded-xl text-[10px] font-black transition-all border flex items-center justify-center gap-2 ${
                      assetCategory === 'CRYPTO'
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 border-transparent text-white shadow-lg shadow-purple-500/20'
                        : 'bg-slate-900/80 border-slate-700/50 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    CRYPTO OTC
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Timeframe</label>
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
                          ? 'logo-gradient-bg border-transparent text-slate-900 shadow-md'
                          : 'bg-slate-900/80 border-slate-700/50 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10">
                <p className="text-[10px] text-blue-400 font-black uppercase mb-2 tracking-widest">Inteligência</p>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  {assetCategory === 'CRYPTO' 
                    ? 'Analisando volume de baleias e padrões de exaustão em redes descentralizadas.' 
                    : 'Monitorando fluxos institucionais e correlação de moedas em tempo real.'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-b from-transparent to-blue-500/5">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Agenda do Mercado</h2>
            <div className="space-y-4">
               <div className={`p-3 rounded-xl border ${assetCategory === 'CRYPTO' ? 'bg-purple-500/20 border-purple-500/50' : 'bg-slate-800/40 border-white/5 opacity-40'}`}>
                 <p className="text-[10px] text-white font-bold uppercase mb-1">Cripto (24/7 OTC)</p>
                 <p className="text-[9px] text-slate-400 uppercase font-medium">Atividade ininterrupta</p>
               </div>
               <div className={`p-3 rounded-xl border ${assetCategory === 'MOEDAS' && (isWeekend || otcActive) ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/40 border-white/5 opacity-40'}`}>
                 <p className="text-[10px] text-white font-bold uppercase mb-1">Moedas (OTC Ativo)</p>
                 <p className="text-[9px] text-slate-400 uppercase font-medium">Finais de semana e Noites</p>
               </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3">
          {!activeSignal ? (
            <div className="glass rounded-[40px] h-[550px] flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-white/5 relative overflow-hidden">
              {isScanning && <div className={`absolute inset-0 animate-pulse ${assetCategory === 'CRYPTO' ? 'bg-purple-500/10' : 'bg-blue-500/10'}`}></div>}
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className={`mb-10 transition-all ${isScanning ? 'scale-110' : 'opacity-20'}`}>
                  {isScanning ? (
                    <div className="relative h-32 w-32 flex items-center justify-center mx-auto">
                      <div className={`absolute inset-0 border-4 rounded-full ${assetCategory === 'CRYPTO' ? 'border-purple-500/10' : 'border-blue-500/10'}`}></div>
                      <div className={`absolute inset-0 border-4 rounded-full animate-spin ${assetCategory === 'CRYPTO' ? 'border-t-purple-500' : 'border-t-blue-500'}`}></div>
                      <div className="flex flex-col items-center">
                        <span className={`text-xs font-black leading-none ${assetCategory === 'CRYPTO' ? 'text-purple-400' : 'text-blue-400'}`}>{currentScanningPair?.symbol}</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase mt-1">Deep Analysis...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-full border-2 border-slate-800 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="max-w-md w-full">
                  <h3 className="text-3xl font-black text-white mb-6 tracking-tighter uppercase">
                    {isScanning ? 'Processando Redes...' : `Aguardando ${assetCategory.toLowerCase()}`}
                  </h3>
                  
                  <div className={`p-6 rounded-3xl border mb-8 transition-all duration-700 ${secondsToNextCandle <= 20 ? (assetCategory === 'CRYPTO' ? 'bg-purple-500/10 border-purple-500/30' : 'bg-blue-500/10 border-blue-500/30') : 'bg-slate-900/40 border-white/5'}`}>
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">
                      {secondsToNextCandle > 15 
                        ? `A IA iniciará o rastreamento aos 15 segundos finais da vela ${selectedTimeframe}.`
                        : `Sinal iminente. Filtrando ruído de mercado para ${assetCategory === 'CRYPTO' ? 'OTC Cripto' : 'Moedas'}.`}
                    </p>
                  </div>

                  {!isScanning && (
                    <div className="flex flex-col items-center gap-4">
                       <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] mb-2">Monitor {assetCategory} Ativo</span>
                       <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden">
                         <div 
                          className={`h-full transition-all duration-1000 ease-linear shadow-lg ${assetCategory === 'CRYPTO' ? 'bg-purple-500 shadow-purple-500/50' : 'bg-blue-500 shadow-blue-500/50'}`}
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
                <div className={`flex items-center gap-3 py-2.5 px-8 border rounded-full ${assetCategory === 'CRYPTO' ? 'bg-purple-500/10 border-purple-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                  <span className={`animate-ping h-2.5 w-2.5 rounded-full ${assetCategory === 'CRYPTO' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                  <span className={`text-sm font-black uppercase tracking-widest ${assetCategory === 'CRYPTO' ? 'text-purple-400' : 'text-blue-400'}`}>
                    Alta Probabilidade - Entrada em {secondsToNextCandle}s
                  </span>
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Sinal {assetCategory} Gerado</h2>
              </div>

              <SignalCard signal={activeSignal} />
              
              <div className="mt-8 p-10 glass rounded-[40px] border border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 pointer-events-none">
                   <span className="text-6xl font-black text-blue-500/10 tabular-nums">{secondsToNextCandle}</span>
                </div>
                
                <div className="flex items-center gap-5 mb-8">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border shadow-lg ${assetCategory === 'CRYPTO' ? 'bg-purple-500/20 border-purple-500/30' : 'bg-blue-500/20 border-blue-500/30'}`}>
                    {assetCategory === 'CRYPTO' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white uppercase tracking-widest leading-none mb-1">Execução VIP</h4>
                    <p className={`text-xs font-bold uppercase tracking-wider ${assetCategory === 'CRYPTO' ? 'text-purple-400/80' : 'text-blue-400/80'}`}>Protocolo de precisão {assetCategory} ativa</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-5 text-sm text-slate-300 items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                    <span className={`h-8 w-8 rounded-full text-slate-900 flex items-center justify-center font-black flex-shrink-0 shadow-md ${assetCategory === 'CRYPTO' ? 'bg-purple-500' : 'bg-blue-500'}`}>1</span>
                    <p>Localize o par <span className="text-white font-bold">{activeSignal.pair}</span>.</p>
                  </div>
                  <div className="flex gap-5 text-sm text-slate-300 items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                    <span className={`h-8 w-8 rounded-full text-slate-900 flex items-center justify-center font-black flex-shrink-0 shadow-md ${assetCategory === 'CRYPTO' ? 'bg-purple-500' : 'bg-blue-500'}`}>2</span>
                    <p>Tempo de expiração: <span className="text-white font-bold">{activeSignal.timeframe}</span>.</p>
                  </div>
                  <div className={`flex gap-5 text-sm text-slate-200 items-center p-5 rounded-2xl border shadow-xl ${assetCategory === 'CRYPTO' ? 'bg-purple-500/20 border-purple-500/40' : 'bg-blue-500/20 border-blue-500/40'}`}>
                    <span className="h-8 w-8 rounded-full bg-white text-slate-900 flex items-center justify-center font-black flex-shrink-0 animate-bounce shadow-md">3</span>
                    <p className="font-bold">Efetue a ordem de <span className="text-white font-black">{activeSignal.direction === 'CALL' ? 'COMPRA' : 'VENDA'}</span> na virada do minuto.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="glass border-t border-white/5 py-6 px-6 text-center">
        <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.5em]">
          ULTRA TRADE VIP © 2026 | PROTOCOLO {assetCategory} v4.1
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
