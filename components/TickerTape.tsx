
import React, { useEffect, useRef } from 'react';

const TickerTape: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Evita duplicidade do script em re-renders
    if (containerRef.current && !containerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "symbols": [
          { "proName": "FOREXCOM:SPX500", "title": "S&P 500" },
          { "proName": "FX_IDC:XAUUSD", "title": "Ouro (XAU/USD)" },
          { "proName": "NASDAQ:TSLA", "title": "Tesla" },
          { "proName": "NASDAQ:AAPL", "title": "Apple" },
          { "proName": "NASDAQ:NFLX", "title": "Netflix" },
          { "proName": "NASDAQ:AMZN", "title": "Amazon" },
          { "proName": "NASDAQ:INTC", "title": "Intel" },
          { "proName": "NYSE:MCD", "title": "McDonald's" },
          { "proName": "NASDAQ:META", "title": "Meta" },
          { "proName": "NYSE:JPM", "title": "JP Morgan" },
          { "proName": "NYSE:NKE", "title": "Nike" },
          { "proName": "NASDAQ:GOOGL", "title": "Google" }
        ],
        "showSymbolLogo": true,
        "colorTheme": "dark",
        "isTransparent": true,
        "displayMode": "adaptive",
        "locale": "pt"
      });
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="tradingview-widget-container w-full border-b border-white/5 bg-[#050507] overflow-hidden">
      <div className="tradingview-widget-container__widget" ref={containerRef}></div>
    </div>
  );
};

export default TickerTape;
