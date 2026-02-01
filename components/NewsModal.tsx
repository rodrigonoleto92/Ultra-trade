
import React, { useEffect, useRef } from 'react';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewsModal: React.FC<NewsModalProps> = ({ isOpen, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && containerRef.current && !containerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "colorTheme": "dark",
        "isTransparent": true,
        "width": "100%",
        "height": "100%",
        "locale": "pt",
        "importanceFilter": "-1,0,1",
        "currencyFilter": "USD,EUR,GBP,JPY,AUD,CAD,CHF,BRL"
      });
      containerRef.current.appendChild(script);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-2xl h-[80vh] glass rounded-[32px] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Calendário Econômico</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Eventos de Alto Impacto (Touros)</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 p-2 overflow-hidden">
          <div className="tradingview-widget-container h-full w-full" ref={containerRef}>
            <div className="tradingview-widget-container__widget h-full w-full"></div>
          </div>
        </div>
        
        <div className="p-4 bg-black/40 border-t border-white/5 text-center">
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Fonte: TradingView Economic Calendar</p>
        </div>
      </div>
    </div>
  );
};

export default NewsModal;
