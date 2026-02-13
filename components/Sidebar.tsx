
import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: 'CALENDAR' | 'HEATMAP' | 'CHART') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onSelectOption
}) => {
  const options = [
    { 
      id: 'CALENDAR' as const, 
      label: 'Calendário Econômico', 
      desc: 'Notícias de Alto Impacto',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002-2z" />
        </svg>
      )
    },
    { 
      id: 'HEATMAP' as const, 
      label: 'Mapa de Calor', 
      desc: 'Força das Moedas em Tempo Real',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      id: 'CHART' as const, 
      label: 'Gráfico Avançado', 
      desc: 'Análise Técnica Profissional',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    }
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <aside 
        className={`fixed top-0 left-0 h-full w-[280px] md:w-[320px] glass border-r border-white/10 z-[101] transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Menu</span>
              <span className="text-lg font-black logo-gradient-text uppercase">Terminal VIP</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-hide">
            <div>
              <h3 className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Análise & Ferramentas</h3>
              <div className="space-y-1">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onSelectOption(opt.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left border border-transparent hover:border-white/10"
                  >
                    <div className="p-3 bg-white/5 rounded-xl text-slate-400 group-hover:text-blue-400 transition-colors">
                      {opt.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">{opt.label}</h4>
                      <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <div className="p-8 border-t border-white/5 bg-black/20">
            <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
              <p className="text-[8px] text-blue-400 font-black uppercase tracking-widest text-center">Ultra Trade Sniper v18</p>
              <p className="text-[7px] text-slate-500 font-bold uppercase text-center mt-1">SMC & Algotrading Terminal</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
