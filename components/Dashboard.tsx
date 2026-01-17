
import React, { useState, useEffect, useRef } from 'react';
import { ALL_PAIRS, BINARY_TIMEFRAMES, FOREX_TIMEFRAMES, FOREX_PAIRS, CRYPTO_PAIRS, OTC_PAIRS } from '../constants';
import { Signal, Timeframe, SignalDirection, MarketType, SignalType } from '../types';
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
  const [signalType, setSignalType] = useState<SignalType>(SignalType.BINARY);
  const [selectedPairSymbol, setSelectedPairSymbol] = useState<string>('');
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [pendingSignal, setPendingSignal] = useState<Signal | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [secondsToNextCandle, setSecondsToNextCandle] = useState(60);
  const [flashActive, setFlashActive] = useState(false);
  const [currentScanningPair, setCurrentScanningPair] = useState<{symbol: string, type: string} | null>(null);
  const [marketStatusMsg, setMarketStatusMsg] = useState<string | null>(null);
  
  const lastTriggeredCandleRef = useRef<string>("");

  const isForexOpenTime = () => {
    const day = currentTime.getDay(); 
    const month = currentTime.getMonth() + 1;
    const date = currentTime.getDate();
    
    // Sábado = 6, Domingo = 0
    const isWeekend = day === 0 || day === 6;
    const isHoliday = (month === 12 && date === 25) || (month === 1 && date === 1);

    if (isWeekend || isHoliday) return false;
    
    if (day === 5 && currentTime.getHours() >= 18) return false;
    if (day === 0 && currentTime.getHours() < 18) return false;

    return true;
  };

  useEffect(() => {
    // Bloqueio apenas para Forex Moedas
    if (signalType === SignalType.FOREX && assetCategory === 'MOEDAS' && !isForexOpenTime()) {
      setMarketStatusMsg("MERCADO FECHADO: O mercado de Forex (Moedas) não opera aos finais de semana ou feriados bancários.");
      setActiveSignal(null);
      setPendingSignal(null);
    } else {
      if (marketStatusMsg?.includes("MERCADO FECHADO")) {
        setMarketStatusMsg(null);
      }
    }
  }, [signalType, assetCategory, currentTime]);

  useEffect(() => {
    const currentValidTimeframes = signalType === SignalType.BINARY ? BINARY_TIMEFRAMES : FOREX_TIMEFRAMES;
    const isValidTF = currentValidTimeframes.some(tf => tf.value === selectedTimeframe);
    if (!isValidTF) {
      setSelectedTimeframe(Timeframe.M1);
    }

    const availablePairs = getAvailablePairs();
    if (availablePairs.length > 0 && (!selectedPairSymbol || !availablePairs.some(p => p.symbol === selectedPairSymbol))) {
      setSelectedPairSymbol(availablePairs[0].symbol);
    }
  }, [signalType, assetCategory]);

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

      if (tfSeconds >= 59 && signalType === SignalType.BINARY) {
        setActiveSignal(null);
        setPendingSignal(null);
        if (marketStatusMsg && !marketStatusMsg.includes("MERCADO FECHADO")) {
          setMarketStatusMsg(null);
        }
      }

      if (signalType === SignalType.BINARY) {
        const triggerId = `${selectedTimeframe}-${assetCategory}-${signalType}-${now.getHours()}-${now.getMinutes()}`;
        
        // Em binárias não bloqueamos moedas (usa OTC), então isBlocked é sempre false aqui.
        const isBlocked = false;

        if (!isBlocked && !isScanning && tfSeconds === 45) {
          if (lastTriggeredCandleRef.current !== triggerId) {
            lastTriggeredCandleRef.current = triggerId;
            handleScanAndBuffer();
          }
        }

        if (pendingSignal && tfSeconds === 30) {
          setActiveSignal(pendingSignal);
          setPendingSignal(null);
          setFlashActive(true);
          setTimeout(() => setFlashActive(false), 800);
        }
      }
      
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedTimeframe, assetCategory, signalType, isScanning, currentTime, pendingSignal, marketStatusMsg]);

  const getAvailablePairs = () => {
    const forexIsOpen = isForexOpenTime();
    if (assetCategory === 'CRYPTO') {
      return CRYPTO_PAIRS;
    } else {
      if (signalType === SignalType.FOREX) {
        return FOREX_PAIRS;
      } else {
        return forexIsOpen ? FOREX_PAIRS : OTC_PAIRS;
      }
    }
  };

  const handleScanAndBuffer = async (manualSymbol?: string) => {
    if (signalType === SignalType.FOREX && assetCategory === 'MOEDAS' && !isForexOpenTime()) {
      setMarketStatusMsg("MERCADO FECHADO: O mercado de Forex não opera aos finais de semana ou feriados bancários.");
      return;
    }

    setIsScanning(true);
    if (marketStatusMsg && !marketStatusMsg.includes("MERCADO FECHADO")) {
      setMarketStatusMsg(null);
    }
    
    try {
      const forexIsOpen = isForexOpenTime();
      let winnerPair = '';

      if (manualSymbol) {
        winnerPair = manualSymbol;
        setCurrentScanningPair({ symbol: manualSymbol, type: assetCategory });
        await new Promise(r => setTimeout(r, 1200)); 
      } else {
        const availablePairs = getAvailablePairs();
        const shuffledPairs = [...availablePairs].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < Math.min(3, shuffledPairs.length); i++) {
          setCurrentScanningPair({
            symbol: shuffledPairs[i].symbol,
            type: shuffledPairs[i].type
          });
          await new Promise(r => setTimeout(r, 450)); 
        }
        winnerPair = shuffledPairs[0]?.symbol || '';
      }

      if (winnerPair) {
        const isActuallyOTC = signalType === SignalType.BINARY && !forexIsOpen && assetCategory === 'MOEDAS';
        const newSignal = await generateSignal(
          winnerPair, 
          selectedTimeframe, 
          isActuallyOTC,
          signalType
        );
        
        if (signalType === SignalType.BINARY) {
          setPendingSignal(newSignal);
        } else {
          setActiveSignal(newSignal);
        }
      }
    } catch (err) {
      console.error("Erro no processamento:", err);
    } finally {
      setIsScanning(false);
      setCurrentScanningPair(null);
    }
  };

  const handleManualForexScan = () => {
    if (isScanning) return;
    setActiveSignal(null);
    handleScanAndBuffer(selectedPairSymbol);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const forexIsOpen = isForexOpenTime();
  const isActuallyRealMarket = assetCategory === 'CRYPTO' || (assetCategory === 'MOEDAS' && forexIsOpen);
  
  const currentMarketLabel = signalType === SignalType.FOREX
    ? (assetCategory === 'CRYPTO' ? 'MERCADO REAL (CRYPTO)' : (forexIsOpen ? 'MERCADO REAL (FOREX)' : 'MERCADO FECHADO'))
    : (assetCategory === 'CRYPTO' ? 'MERCADO REAL (CRYPTO)' : (forexIsOpen ? 'MERCADO REAL ABERTO' : 'MERCADO EM OTC'));

  const marketStatusColor = isActuallyRealMarket 
    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' 
    : (assetCategory === 'MOEDAS' && !forexIsOpen && signalType === SignalType.FOREX 
        ? 'text-rose-400 border-rose-500/30 bg-rose-500/5' 
        : 'text-amber-400 border-amber-500/30 bg-amber-500/5');
  
  const currentTimeframes = signalType === SignalType.BINARY ? BINARY_TIMEFRAMES : FOREX_TIMEFRAMES;
  const currentAvailablePairs = getAvailablePairs();

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col relative">
      <header className="glass sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo size="sm" />
            <div className="hidden md:flex flex-col border-l border-white/10 pl-6">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full animate-pulse ${isActuallyRealMarket ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`}></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  IA MULTI-TRADE VIP v12.1
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <div className="text-right hidden sm:block border-r border-white/10 pr-8">
              <p className="text-xl font-mono font-bold text-white tracking-tighter">
                {currentTime.toLocaleTimeString('pt-BR')}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Global Time</p>
            </div>
            <div className="text-right border-r border-white/10 pr-4 sm:pr-8">
              <p className={`text-2xl font-mono font-black ${secondsToNextCandle <= 30 ? 'text-blue-500 animate-pulse' : 'logo-gradient-text'}`}>
                {formatTime(secondsToNextCandle)}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Vela Atual</p>
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
          <div className={`p-5 rounded-2xl border ${marketStatusColor} transition-all duration-500`}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Status do Sistema</p>
            <h3 className="text-lg font-black uppercase tracking-tighter">{currentMarketLabel}</h3>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/5 shadow-2xl">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Configurações</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Operação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSignalType(SignalType.BINARY);
                      setActiveSignal(null);
                      setPendingSignal(null);
                    }}
                    className={`py-3 rounded-xl text-[10px] font-black transition-all border ${
                      signalType === SignalType.BINARY
                        ? 'logo-gradient-bg border-transparent text-slate-900 shadow-lg'
                        : 'bg-slate-900/80 border-slate-700/50 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    BINÁRIAS
                  </button>
                  <button
                    onClick={() => {
                      setSignalType(SignalType.FOREX);
                      setActiveSignal(null);
                      setPendingSignal(null);
                    }}
                    className={`py-3 rounded-xl text-[10px] font-black transition-all border ${
                      signalType === SignalType.FOREX
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-transparent text-white shadow-lg'
                        : 'bg-slate-900/80 border-slate-700/50 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    FOREX / CRIPTO
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Ativos</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setAssetCategory('MOEDAS');
                      setActiveSignal(null);
                      setPendingSignal(null);
                    }}
                    className={`py-3 rounded-xl text-[10px] font-black transition-all border ${
                      assetCategory === 'MOEDAS'
                        ? 'bg-slate-800 border-white/20 text-white shadow-lg'
                        : 'bg-slate-900/80 border-slate-700/50 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    MOEDAS
                  </button>
                  <button
                    onClick={() => {
                      setAssetCategory('CRYPTO');
                      setActiveSignal(null);
                      setPendingSignal(null);
                    }}
                    className={`py-3 rounded-xl text-[10px] font-black transition-all border ${
                      assetCategory === 'CRYPTO'
                        ? 'bg-orange-500/20 border-orange-500/40 text-orange-400 shadow-lg'
                        : 'bg-slate-900/80 border-slate-700/50 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    CRYPTO
                  </button>
                </div>
              </div>

              {signalType === SignalType.FOREX && (
                <div className="animate-in fade-in slide-in-from-left-4">
                  <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Escolher Ativo</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-hide">
                    {currentAvailablePairs.map(p => (
                      <button
                        key={p.symbol}
                        onClick={() => {
                            setSelectedPairSymbol(p.symbol);
                            setActiveSignal(null);
                        }}
                        className={`py-2 px-1 rounded-lg text-[9px] font-bold transition-all border truncate ${
                          selectedPairSymbol === p.symbol
                            ? 'border-blue-500 bg-blue-500/20 text-blue-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:border-slate-600'
                        }`}
                      >
                        {p.symbol}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Tempo Gráfico</label>
                <div className={`grid ${currentTimeframes.length > 3 ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
                  {currentTimeframes.map(tf => (
                    <button
                      key={tf.value}
                      onClick={() => {
                        setSelectedTimeframe(tf.value);
                        setActiveSignal(null);
                        setPendingSignal(null);
                      }}
                      className={`py-3 rounded-xl text-[9px] font-black transition-all border ${
                        selectedTimeframe === tf.value
                          ? 'border-white/40 text-white bg-white/10 shadow-md'
                          : 'bg-slate-900/80 border-slate-700/50 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3 flex flex-col">
          {signalType === SignalType.FOREX && (
             <div className="mb-4 animate-in fade-in slide-in-from-top-4 flex items-center justify-center">
                <button
                  onClick={handleManualForexScan}
                  disabled={isScanning || (assetCategory === 'MOEDAS' && !forexIsOpen)}
                  className="w-full sm:w-auto px-10 py-4 rounded-2xl border border-blue-500/30 bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-3 group shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:grayscale"
                >
                  {isScanning ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-black text-white uppercase tracking-widest">IA Escaneando {selectedPairSymbol}...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm font-black text-white uppercase tracking-widest">ANALISAR {selectedPairSymbol}</span>
                    </>
                  )}
                </button>
             </div>
          )}

          {!activeSignal ? (
            <div className="glass rounded-[40px] h-[550px] flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-white/5 relative overflow-hidden">
              {(isScanning || (pendingSignal && secondsToNextCandle > 30)) && <div className={`absolute inset-0 animate-pulse ${assetCategory === 'CRYPTO' ? 'bg-orange-500/10' : 'bg-blue-500/10'}`}></div>}
              <div className="relative z-10 flex flex-col items-center w-full">
                <div className={`mb-10 transition-all ${(isScanning || pendingSignal || marketStatusMsg) ? 'scale-110' : 'opacity-20'}`}>
                  {marketStatusMsg ? (
                    <div className="h-32 w-32 rounded-full border-2 border-amber-500 flex items-center justify-center bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-14 w-14 ${marketStatusMsg.includes("MERCADO FECHADO") ? 'text-rose-500' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  ) : (isScanning || (pendingSignal && secondsToNextCandle > 30)) ? (
                    <div className="relative h-32 w-32 flex items-center justify-center mx-auto">
                      <div className="absolute inset-0 border-4 rounded-full border-white/5"></div>
                      <div className={`absolute inset-0 border-4 rounded-full animate-spin ${signalType === SignalType.BINARY ? 'border-t-emerald-500' : 'border-t-blue-500'}`}></div>
                      <div className="flex flex-col items-center text-center px-4">
                        <span className={`text-[10px] font-black mb-1 ${signalType === SignalType.BINARY ? 'text-emerald-400' : 'text-blue-400'}`}>{currentScanningPair?.symbol || 'IA FLOW'}</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase">ANALISANDO...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-full border-2 border-slate-800 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="max-w-md w-full">
                  <h3 className="text-3xl font-black text-white mb-6 tracking-tighter uppercase">
                    {marketStatusMsg && marketStatusMsg.includes("MERCADO FECHADO")
                        ? 'MERCADO FECHADO' 
                        : (isScanning || (pendingSignal && secondsToNextCandle > 30)) 
                            ? `IA PROCESSANDO DADOS` 
                            : (signalType === SignalType.FOREX ? 'FOREX: AGUARDANDO COMANDO' : 'BINÁRIAS: AGUARDANDO GATILHO')
                    }
                  </h3>
                  
                  <div className={`p-6 rounded-3xl border mb-8 transition-all duration-700 ${marketStatusMsg ? (marketStatusMsg.includes("MERCADO FECHADO") ? 'bg-rose-500/10 border-rose-500/20' : 'bg-amber-500/10 border-amber-500/20') : 'bg-slate-900/40 border-white/5'}`}>
                    <p className={`text-sm font-medium leading-relaxed ${marketStatusMsg ? (marketStatusMsg.includes("MERCADO FECHADO") ? 'text-rose-200' : 'text-amber-200') : 'text-slate-300'}`}>
                      {marketStatusMsg || (signalType === SignalType.FOREX 
                        ? `Selecione o ativo ${selectedPairSymbol} ou outro da lista e clique em Analisar acima.`
                        : (secondsToNextCandle > 45 
                          ? 'Monitorando padrões estruturais Sniper. Sinais liberados nos últimos 15s de cada vela.'
                          : pendingSignal 
                            ? `OPORTUNIDADE DETECTADA! Confirmando em ${secondsToNextCandle - 30}s...`
                            : 'Buscando zonas de liquidez para opções binárias.'))
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`max-w-2xl mx-auto w-full transition-all duration-500 ${flashActive ? (activeSignal.direction === SignalDirection.CALL ? 'animate-flash-call' : 'animate-flash-put') : 'animate-in fade-in slide-in-from-bottom-6'}`}>
              <div className="mb-8 flex flex-col items-center gap-4 text-center">
                <div className={`flex items-center gap-3 py-2.5 px-8 border rounded-full ${signalType === SignalType.BINARY ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                  <span className={`animate-ping h-2.5 w-2.5 rounded-full ${signalType === SignalType.BINARY ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                  <span className={`text-sm font-black uppercase tracking-widest ${signalType === SignalType.BINARY ? 'text-emerald-400' : 'text-blue-400'}`}>
                    Análise Sniper Confirmada
                  </span>
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Protocolo de Entrada</h2>
              </div>

              <SignalCard signal={activeSignal} />
              
              <div className="mt-8 p-10 glass rounded-[40px] border border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
                {signalType === SignalType.BINARY && (
                  <div className="absolute top-0 right-0 p-6 pointer-events-none">
                    <span className={`text-6xl font-black tabular-nums transition-colors ${secondsToNextCandle <= 10 ? 'text-rose-500' : 'text-blue-500/20'}`}>{secondsToNextCandle}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-5 mb-8">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border shadow-lg ${signalType === SignalType.BINARY ? 'border-emerald-500/30 bg-emerald-500/20' : 'border-blue-500/30 bg-blue-500/20'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${signalType === SignalType.BINARY ? 'text-emerald-400' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white uppercase tracking-widest leading-none mb-1">Estratégia Sniper</h4>
                    <p className={`text-xs font-bold uppercase tracking-wider ${signalType === SignalType.BINARY ? 'text-emerald-400/80' : 'text-blue-400/80'}`}>Análise baseada em {activeSignal.timeframe}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-5 text-sm text-slate-300 items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                    <span className={`h-8 w-8 rounded-full text-slate-900 flex items-center justify-center font-black flex-shrink-0 shadow-md ${signalType === SignalType.BINARY ? 'bg-emerald-500' : 'bg-blue-500'}`}>1</span>
                    <p>Ative o par <span className="text-white font-bold">{activeSignal.pair}</span> na corretora.</p>
                  </div>
                  <div className={`flex gap-5 text-sm text-slate-200 items-center p-5 rounded-2xl border shadow-xl ${signalType === SignalType.BINARY ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-blue-500/20 border-blue-500/40'}`}>
                    <span className="h-8 w-8 rounded-full bg-white text-slate-900 flex items-center justify-center font-black flex-shrink-0 animate-bounce shadow-md">2</span>
                    <p className="font-bold uppercase text-[11px]">
                      {activeSignal.type === SignalType.FOREX 
                        ? `Entre como ${activeSignal.direction === 'CALL' ? 'BUY' : 'SELL'} e posicione os alvos de topo/fundo.` 
                        : `Clique em ${activeSignal.direction === 'CALL' ? 'COMPRAR' : 'VENDER'} no início da vela.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="glass border-t border-white/5 py-6 px-6 text-center">
        <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.5em]">
          ULTRA TRADE VIP © 2026 | TERMINAL SNIPER v12.1
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
