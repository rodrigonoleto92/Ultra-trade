
import React, { useState, useEffect, useRef } from 'react';
import { ALL_PAIRS, TIMEFRAMES } from '../constants';
import { Signal, Timeframe, SignalDirection } from '../types';
import { generateSignal } from '../services/geminiService';
import SignalCard from './SignalCard';
import Logo from './Logo';

const Dashboard: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState(ALL_PAIRS[0].symbol);
  const [selectedTimeframe, setSelectedTimeframe] = useState(Timeframe.M1);
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [secondsToNextCandle, setSecondsToNextCandle] = useState(60);
  const [flashActive, setFlashActive] = useState(false);
  
  const lastTriggeredCandleRef = useRef<string>("");

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

      // GATILHO AUTOMÁTICO: Dispara exatamente 5 segundos antes da vela fechar (segundo 55 no M1)
      if (!isGenerating && tfSeconds === 5) {
        // Criamos um ID único baseado no minuto e segundo para não disparar duas vezes na mesma janela
        const triggerId = `${selectedPair}-${selectedTimeframe}-${now.getHours()}-${now.getMinutes()}`;
        if (lastTriggeredCandleRef.current !== triggerId) {
          lastTriggeredCandleRef.current = triggerId;
          handleAutoGenerate();
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedTimeframe, isGenerating, selectedPair]);

  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    try {
      // O sinal é projetado para a próxima vela que iniciará em 5 segundos
      const newSignal = await generateSignal(selectedPair, selectedTimeframe);
      
      setActiveSignal(newSignal);
      
      // Efeito visual de piscada
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 800);
      
    } catch (err) {
      console.error("Erro no processamento automático:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col">
      <header className="glass sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo size="sm" />
            <div className="hidden md:flex flex-col border-l border-white/10 pl-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  ALGORITMO ATIVO: ESCANEANDO MERCADO
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block border-r border-white/10 pr-8">
              <p className="text-xl font-mono font-bold text-white tracking-tighter">
                {currentTime.toLocaleTimeString('pt-BR')}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Hora Atual</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-mono font-black ${secondsToNextCandle <= 5 ? 'text-green-400 animate-pulse' : secondsToNextCandle <= 10 ? 'text-rose-500' : 'logo-gradient-text'}`}>
                {formatTime(secondsToNextCandle)}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Próxima Vela</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-3xl border border-white/5 shadow-2xl">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Ativo & Timeframe</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Selecione o Par</label>
                <select
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/50 text-white rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:border-slate-500 transition-colors"
                >
                  {ALL_PAIRS.map(p => (
                    <option key={p.symbol} value={p.symbol}>{p.symbol} {p.type === 'OTC' ? ' (OTC)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Tempo de Operação</label>
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

              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-2xl">
                <p className="text-[10px] text-green-400 font-black uppercase tracking-widest text-center">
                  IA em Modo Automático
                </p>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-b from-transparent to-blue-500/5">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Monitor de Precisão</h2>
            <div className="space-y-4">
               <div className="flex justify-between text-[10px] font-bold">
                 <span className="text-slate-500">STATUS IA</span>
                 <span className="text-green-400">NORMAL</span>
               </div>
               <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-white/5">
                  <div className="h-full logo-gradient-bg w-full"></div>
               </div>
               <p className="text-[10px] text-slate-400 leading-relaxed font-medium uppercase tracking-tighter text-center">
                O sinal será exibido faltando 5 segundos para a virada.
               </p>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3">
          <div className="flex justify-between items-end mb-8">
            <div className="flex flex-col gap-1">
               <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Painel de Sinais</h2>
               <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Análise Institucional em Tempo Real</span>
            </div>
          </div>

          {!activeSignal ? (
            <div className="glass rounded-[40px] h-[550px] flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-white/5 relative overflow-hidden">
              {isGenerating && <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>}
              <div className="relative z-10">
                <div className={`mb-10 transition-all ${isGenerating ? 'scale-110' : 'opacity-10 grayscale'}`}>
                  <Logo size="lg" hideText className="justify-center" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase">
                  {isGenerating ? 'Calculando Próxima Vela' : 'Aguardando Gatilho de Entrada'}
                </h3>
                <p className="text-slate-500 text-base max-w-sm mx-auto leading-relaxed font-medium">
                  O sistema enviará o sinal assim que o cronômetro chegar em <span className="text-white font-bold">00:05</span>.
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
              <SignalCard signal={activeSignal} />
              
              <div className="mt-12 p-8 glass rounded-[32px] border border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">Guia de Operação</h4>
                </div>
                <ul className="space-y-4">
                  <li className="flex gap-4 text-xs text-slate-400 items-center">
                    <span className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-black flex-shrink-0 border border-white/5">1</span>
                    Abra o par <span className="text-white font-bold">{activeSignal.pair}</span> em sua corretora agora.
                  </li>
                  <li className="flex gap-4 text-xs text-slate-400 items-center">
                    <span className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-black flex-shrink-0 border border-white/5">2</span>
                    Ajuste o tempo para <span className="text-white font-bold">{activeSignal.timeframe}</span>.
                  </li>
                  <li className="flex gap-4 text-xs text-slate-400 items-center">
                    <span className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-black flex-shrink-0 border border-white/5">3</span>
                    Clique em {activeSignal.direction === 'CALL' ? 'COMPRA' : 'VENDA'} às <span className="text-white font-black">{activeSignal.entryTime}</span> (Vela de virada).
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="glass border-t border-white/5 py-4 px-6 text-center">
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">
          Ultra Trade Signal VIP - Terminal Autônomo v3.1
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
