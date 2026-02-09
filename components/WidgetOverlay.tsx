
import React, { useEffect, useRef } from 'react';

type WidgetType = 'CALENDAR' | 'HEATMAP' | 'CHART';

interface WidgetOverlayProps {
  type: WidgetType | null;
  onClose: () => void;
}

const WidgetOverlay: React.FC<WidgetOverlayProps> = ({ type, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type && containerRef.current) {
      // Limpa o container antes de adicionar um novo widget
      containerRef.current.innerHTML = '<div class="tradingview-widget-container__widget h-full w-full"></div>';
      const widgetContainer = containerRef.current.querySelector('.tradingview-widget-container__widget');
      
      const script = document.createElement('script');
      script.async = true;
      script.src = type === 'CHART' 
        ? 'https://s3.tradingview.com/tv.js' 
        : type === 'CALENDAR' 
          ? 'https://s3.tradingview.com/external-embedding/embed-widget-events.js'
          : 'https://s3.tradingview.com/external-embedding/embed-widget-forex-heat-map.js';

      if (type === 'CALENDAR') {
        script.innerHTML = JSON.stringify({
          "colorTheme": "dark",
          "isTransparent": true,
          "width": "100%",
          "height": "100%",
          "locale": "pt",
          "importanceFilter": "-1,0,1",
          "currencyFilter": "USD,EUR,GBP,JPY,AUD,CAD,CHF,BRL"
        });
      } else if (type === 'HEATMAP') {
        script.innerHTML = JSON.stringify({
          "width": "100%",
          "height": "100%",
          "currencies": ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD", "CNY"],
          "isTransparent": true,
          "colorTheme": "dark",
          "locale": "pt"
        });
      } else if (type === 'CHART') {
        // Para o gráfico avançado, precisamos usar o objeto TV após o script carregar
        script.onload = () => {
          new (window as any).TradingView.widget({
            "width": "100%",
            "height": "100%",
            "symbol": "FX:EURUSD",
            "interval": "1",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "pt",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "allow_symbol_change": true,
            "container_id": "tv_chart_container"
          });
        };
        // Criamos um ID específico para o gráfico
        if (widgetContainer) widgetContainer.id = "tv_chart_container";
      }

      containerRef.current.appendChild(script);
    }
  }, [type]);

  if (!type) return null;

  const titles = {
    CALENDAR: 'Calendário Econômico',
    HEATMAP: 'Mapa de Calor (Forex)',
    CHART: 'Gráfico em Tempo Real'
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-4 md:py-10">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl h-full glass rounded-[32px] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/20">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
               </svg>
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-widest">{titles[type]}</h3>
              <p className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase mt-0.5">Terminal Ultra Trade Integrado</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center bg-white/5 hover:bg-rose-500/20 rounded-xl transition-all group border border-white/5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 group-hover:text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 p-2 md:p-4 overflow-hidden relative">
          <div className="tradingview-widget-container h-full w-full" ref={containerRef}>
            <div className="tradingview-widget-container__widget h-full w-full"></div>
          </div>
        </div>
        
        <div className="p-3 md:p-4 bg-black/40 border-t border-white/5 text-center flex items-center justify-center gap-4">
          <p className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest">Powered by TradingView API</p>
        </div>
      </div>
    </div>
  );
};

export default WidgetOverlay;
