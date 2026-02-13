
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BINARY_TIMEFRAMES, FOREX_TIMEFRAMES, FOREX_PAIRS, CRYPTO_PAIRS, OTC_PAIRS, SECURITY_VERSION } from '../constants';
import { Signal, Timeframe, SignalType } from '../types';
import { generateSignal, scanForBestSignal } from '../services/geminiService';
import SignalCard from './SignalCard';
import Logo from './Logo';
import Sidebar from './Sidebar';
import WidgetOverlay from './WidgetOverlay';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface DashboardProps {
  onLogout: () => void;
  userName?: string;
  authPassword?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, userName = 'Trader', authPassword = '' }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(Timeframe.M1);
  const [assetCategory, setAssetCategory] = useState<'MOEDAS' | 'CRYPTO'>('MOEDAS');
  const [signalType, setSignalType] = useState<SignalType>(SignalType.BINARY);
  const [marketPreference, setMarketPreference] = useState<'REAL' | 'OTC'>('REAL');
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isVoiceAlertEnabled, setIsVoiceAlertEnabled] = useState(true);
  
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningText, setScanningText] = useState('ANALISANDO FLUXO...');
  const [secondsToNextCandle, setSecondsToNextCandle] = useState(60);
  const [activeWidget, setActiveWidget] = useState<'CALENDAR' | 'HEATMAP' | 'CHART' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [marketAlert, setMarketAlert] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  
  const autoTriggeredRef = useRef<number | null>(null);

  // Função para alerta sonoro - Otimizada para Mobile
  const playSignalAlert = () => {
    if (!isVoiceAlertEnabled) return;
    
    if ('speechSynthesis' in window) {
      // Cancela qualquer fala anterior para evitar fila infinita
      window.speechSynthesis.cancel();
      
      const msg = new SpeechSynthesisUtterance('Sinal gerado');
      msg.lang = 'pt-BR';
      
      // Carrega vozes disponíveis no momento (importante para Mobile)
      const voices = window.speechSynthesis.getVoices();
      
      // Busca exaustiva por vozes femininas em pt-BR (padrões iOS/Android/Chrome)
      const femaleVoice = voices.find(v => 
        (v.lang.toLowerCase().includes('pt-br') || v.lang.toLowerCase().includes('pt_br')) && (
          v.name.toLowerCase().includes('female') || 
          v.name.toLowerCase().includes('feminina') || 
          v.name.toLowerCase().includes('maria') || 
          v.name.toLowerCase().includes('luciana') || 
          v.name.toLowerCase().includes('vitória') || 
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('google português') ||
          v.name.toLowerCase().includes('francisca') ||
          v.name.toLowerCase().includes('heloisa') ||
          v.name.toLowerCase().includes('premium') ||
          v.name.toLowerCase().includes('siri')
        )
      ) || voices.find(v => v.lang.toLowerCase().includes('pt'));
      
      if (femaleVoice) msg.voice = femaleVoice;
      
      // Ajustes para voz "Robótica" e Inteligível
      msg.pitch = 1.35; 
      msg.rate = 1.0;
      msg.volume = 1.0;
      
      window.speechSynthesis.speak(msg);
    }
  };

  // Garante que o sistema de vozes está pronto (Mobile requer isso)
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const loadVoices = () => {
      synth.getVoices();
    };

    loadVoices();
    if ('onvoiceschanged' in synth) {
      synth.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    if (activeSignal && !isScanning) {
      playSignalAlert();
    }
  }, [activeSignal?.id]);

  const marketStatus = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); 
    const hour = now.getHours();
    
    const isWeekend = (day === 6) || (day === 0);
    const isWithinRealMarketHours = hour >= 4 && hour < 16;
    const isRealMarketOpen = !isWeekend && isWithinRealMarketHours;

    if (assetCategory === 'CRYPTO') return { isOpen: true, label: 'REAL (CRIPTO) - 24/7 ABERTO', isOTC: false };
    
    if (signalType === SignalType.FOREX) {
      return isRealMarketOpen 
        ? { isOpen: true, label: 'REAL (FOREX) - ABERTO', isOTC: false } 
        : { isOpen: false, label: 'FECHADO (FOREX REAL)', isOTC: false };
    }

    if (marketPreference === 'OTC') {
      return { isOpen: true, isOTC: true, label: 'LIVE FEED: SISTEMA OTC' };
    } else {
      return { 
        isOpen: isRealMarketOpen, 
        isOTC: false, 
        label: isRealMarketOpen ? 'MERCADO REAL - ABERTO' : 'FECHADO (MERCADO REAL)' 
      };
    }
  }, [assetCategory, signalType, marketPreference]);

  const triggerSignalGeneration = async () => {
    if (isScanning) return;

    if (!marketStatus.isOpen) {
      setMarketAlert("MERCADO REAL FECHADO. O PREGÃO OCORRE DE SEG A SEX DAS 04:00 ÀS 16:00. MUDE PARA 'OTC' OU 'CRYPTO' PARA CONTINUAR.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setMarketAlert(null), 6000);
      return;
    }

    setIsScanning(true);
    const isOTC = marketPreference === 'OTC' && assetCategory === 'MOEDAS';
    
    const texts = isOTC ? [
      'CONECTANDO API DE DADOS...', 
      'MAPEANDO CICLO ALGORÍTMICO...', 
      'IDENTIFICANDO ZONAS DE LIQUIDEZ...', 
      'FILTRANDO MANIPULAÇÃO...',
      'ALGO PULSE: SINAL VALIDADO!'
    ] : [
      'CONECTANDO AO DATA-FEED...', 
      'MAPEANDO ZONAS DE OFERTA...', 
      'IDENTIFICANDO QUEBRA DE ESTRUTURA...', 
      'VALIDANDO CONFLUÊNCIA RSI...',
      'SNIPER V18: SINAL CONFIRMADO!'
    ];

    for (const text of texts) {
      setScanningText(text);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      if (signalType === SignalType.BINARY) {
        const signal = isAutoMode 
          ? await scanForBestSignal(currentPairsList, selectedTimeframe, SignalType.BINARY)
          : await generateSignal(selectedPair, selectedTimeframe, isOTC, SignalType.BINARY);
        setActiveSignal(signal);
      } else {
        const signal = await generateSignal(selectedPair, selectedTimeframe, false, signalType);
        setActiveSignal(signal);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const currentPairsList = useMemo(() => {
    if (assetCategory === 'CRYPTO') return CRYPTO_PAIRS;
    if (signalType === SignalType.BINARY) {
      const baseList = marketPreference === 'OTC' ? OTC_PAIRS : FOREX_PAIRS;
      return baseList.filter(p => p.symbol !== 'XAU/USD');
    }
    return FOREX_PAIRS;
  }, [assetCategory, signalType, marketPreference]);

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
      
      if (signalType === SignalType.BINARY && isAutoMode && marketStatus.isOpen) {
        if (tfSeconds === 30 && autoTriggeredRef.current !== currentBoundary) {
          autoTriggeredRef.current = currentBoundary;
          triggerSignalGeneration();
        }
        if (tfSeconds === 40 && activeSignal && !isScanning) {
          setActiveSignal(null);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedTimeframe, signalType, marketStatus.isOpen, activeSignal, isScanning, currentPairsList, isAutoMode]);

  return (
    <div className="flex-1 flex flex-col text-white relative">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onSelectOption={(opt) => setActiveWidget(opt)}
        isVoiceAlertEnabled={isVoiceAlertEnabled}
        onToggleVoiceAlert={setIsVoiceAlertEnabled}
      />
      
      <WidgetOverlay 
        type={activeWidget} 
        onClose={() => setActiveWidget(null)} 
      />
      
      {marketAlert && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md animate-in slide-in-from-top-10 duration-500">
          <div className="glass bg-rose-950/60 border border-rose-500/50 p-5 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.4)] flex items-center gap-4">
            <div className="h-12 w-12 shrink-0 bg-rose-500/20 rounded-2xl flex items-center justify-center border border-rose-500/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[10px] md:text-xs font-black text-rose-100 tracking-wider leading-relaxed">
              {marketAlert}
            </p>
            <button onClick={() => setMarketAlert(null)} className="text-rose-500 hover:text-white ml-auto">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
          </div>
        </div>
      )}
      
      <header className="h-20 md:h-28 flex items-center justify-between px-4 md:px-10 border-b border-white/5 bg-black/80 backdrop-blur-2xl sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex flex-col ml-1 hidden md:flex">
            <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-slate-500 leading-tight">Bem vindo,</span>
            <span className="text-[10px] md:text-xs font-bold logo-gradient-text leading-tight uppercase">{userName}</span>
          </div>
        </div>

        <div className="flex justify-center flex-1">
          <Logo size="sm" hideText />
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 md:px-6 py-1.5 md:py-3 rounded-2xl shadow-lg">
             <span className="text-sm md:text-2xl font-mono font-black logo-gradient-text tracking-wider">
               {formatTime(secondsToNextCandle)}
             </span>
             <div className={`h-1.5 w-1.5 md:h-3 md:w-3 rounded-full shadow-[0_0_10px_currentColor] ${
               secondsToNextCandle <= 5 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'
             }`}></div>
          </div>
          
          <button onClick={onLogout} className="p-2.5 md:p-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl transition-colors hover:bg-rose-500/10 group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6 text-slate-400 group-hover:text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-3 md:p-6 space-y-4 md:space-y-6 max-w-6xl mx-auto w-full pb-20">
        <div className="w-full flex justify-center pt-2">
           <div className={`px-4 py-1.5 rounded-full border text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${marketStatus.isOpen ? (marketStatus.label.includes('OTC') ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5') : 'border-rose-500/20 text-rose-400 bg-rose-500/5'}`}>
             <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${!marketStatus.isOpen ? 'bg-rose-500' : (marketStatus.label.includes('OTC') ? 'bg-amber-500' : 'bg-emerald-500')}`}></div>
             {marketStatus.label}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 w-full">
          <div className="lg:col-span-5 space-y-4">
            <div className="glass p-5 md:p-8 rounded-[24px] md:rounded-[40px] border border-white/5 shadow-xl space-y-6">
              
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">1. Modalidade</h3>
                  {signalType === SignalType.BINARY && (
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">Auto</span>
                      <button 
                        onClick={() => setIsAutoMode(!isAutoMode)}
                        className={`w-8 h-4 rounded-full transition-colors relative flex items-center px-1 ${isAutoMode ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      >
                        <div className={`h-2.5 w-2.5 bg-white rounded-full transition-transform ${isAutoMode ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                  <button onClick={() => setSignalType(SignalType.BINARY)} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black transition-all ${signalType === SignalType.BINARY ? 'logo-gradient-bg text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-600'}`}>OB (BINÁRIAS)</button>
                  <button onClick={() => setSignalType(SignalType.FOREX)} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black transition-all ${signalType === SignalType.FOREX ? 'logo-gradient-bg text-slate-950 shadow-lg shadow-blue-500/20' : 'text-slate-600'}`}>FOREX / CRIPTO</button>
                </div>
              </div>

              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">2. Ativos</h3>
                <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                  <button onClick={() => setAssetCategory('MOEDAS')} className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${assetCategory === 'MOEDAS' ? 'bg-white/10 text-white' : 'text-slate-600'}`}>MOEDAS</button>
                  <button onClick={() => setAssetCategory('CRYPTO')} className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${assetCategory === 'CRYPTO' ? 'bg-white/10 text-white' : 'text-slate-600'}`}>CRYPTO / OUTROS</button>
                </div>
              </div>

              {signalType === SignalType.BINARY && assetCategory === 'MOEDAS' && (
                 <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                   <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">3. Tipo de Mercado</h3>
                   <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                     <button 
                       onClick={() => setMarketPreference('REAL')} 
                       className={`flex-1 py-2 rounded-lg text-[8px] font-black transition-all border ${marketPreference === 'REAL' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-transparent text-slate-600'}`}
                     >
                       MERCADO REAL
                     </button>
                     <button 
                       onClick={() => setMarketPreference('OTC')} 
                       className={`flex-1 py-2 rounded-lg text-[8px] font-black transition-all border ${marketPreference === 'OTC' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-transparent text-slate-600'}`}
                     >
                       MERCADO OTC
                     </button>
                   </div>
                 </div>
              )}

              <div className="space-y-4 pt-2 border-t border-white/5">
                {(signalType === SignalType.FOREX || (signalType === SignalType.BINARY && !isAutoMode)) && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Ativo Selecionado</h3>
                    <select 
                      value={selectedPair} 
                      onChange={(e) => setSelectedPair(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-500/50 transition-colors"
                    >
                      {currentPairsList.map(p => <option key={p.symbol} value={p.symbol}>{p.symbol}</option>)}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Timeframe (Vela)</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(signalType === SignalType.BINARY ? BINARY_TIMEFRAMES : FOREX_TIMEFRAMES).map(tf => (
                      <button key={tf.value} onClick={() => setSelectedTimeframe(tf.value)} className={`py-2 rounded-xl text-[9px] font-black border transition-all ${selectedTimeframe === tf.value ? 'bg-white text-slate-950 border-white' : 'bg-slate-900/50 text-slate-600 border-white/5'}`}>{tf.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              {(signalType === SignalType.FOREX || (signalType === SignalType.BINARY && !isAutoMode)) ? (
                <button 
                  onClick={triggerSignalGeneration} 
                  disabled={isScanning}
                  className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-xl group overflow-hidden relative ${shake ? 'animate-bounce border-rose-500' : ''} ${!marketStatus.isOpen ? 'bg-rose-900/40 text-rose-500 border border-rose-500/20 cursor-pointer' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20'}`}
                >
                  <span className="relative z-10">
                    {!marketStatus.isOpen ? 'MERCADO FECHADO' : (isScanning ? scanningText : 'GERAR ANÁLISE ULTRA')}
                  </span>
                  {marketStatus.isOpen && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>}
                  {!marketStatus.isOpen && !isScanning && <div className="absolute inset-0 bg-rose-500/5 animate-pulse"></div>}
                </button>
              ) : (
                <div 
                  onClick={triggerSignalGeneration}
                  className={`text-center py-5 rounded-2xl border cursor-pointer transition-all active:scale-95 ${!marketStatus.isOpen ? 'bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}
                >
                  <p className={`text-[8px] font-black uppercase tracking-widest ${!marketStatus.isOpen ? 'text-rose-400' : 'text-emerald-400 animate-pulse'}`}>
                    {!marketStatus.isOpen ? 'MERCADO FECHADO (CLIQUE P/ INFO)' : (isScanning ? scanningText : `SMC SCANNER ATIVO: ${formatTime(secondsToNextCandle)}`)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col">
            {isScanning ? (
              <div className="flex-1 glass rounded-[24px] md:rounded-[40px] flex flex-col items-center justify-center p-8 text-center border border-blue-500/20 min-h-[300px]">
                <div className="h-10 w-10 mb-4 relative">
                   <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full animate-ping"></div>
                   <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest">{scanningText}</h4>
                <p className="text-[9px] text-slate-600 font-bold mt-2 uppercase tracking-widest italic">Analisando Fluxo Institucional</p>
              </div>
            ) : activeSignal ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SignalCard signal={activeSignal} />
              </div>
            ) : (
              <div className="flex-1 border-2 border-dashed border-white/5 rounded-[24px] md:rounded-[40px] flex flex-col items-center justify-center p-8 text-center opacity-30 min-h-[300px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="space-y-2">
                  <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[9px]">
                    {!marketStatus.isOpen ? 'MERCADO REAL ATUALMENTE FECHADO' : 'Aguardando Quebra de Movimento'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center border-t border-white/5 mt-auto bg-black/20">
        <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.5em] text-slate-700">Ultra Trade {SECURITY_VERSION} Terminal Global</p>
      </footer>
    </div>
  );
};

export default Dashboard;
