
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface GlobalChatProps {
  currentUserId: string;
}

const HEARTBEAT_KEY = 'ultra_active_sessions';
const SESSION_TIMEOUT = 15000; // 15 segundos de inatividade remove a sessão
const TAB_ID = Math.random().toString(36).substring(2, 9);

const GlobalChat: React.FC<GlobalChatProps> = ({ currentUserId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [onlineCount, setOnlineCount] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lógica de Usuários Reais (Heartbeat + Histórico)
  useEffect(() => {
    const updatePresence = () => {
      // 1. Registrar batimento desta aba
      const now = Date.now();
      const rawSessions = localStorage.getItem(HEARTBEAT_KEY);
      let sessions: Record<string, number> = rawSessions ? JSON.parse(rawSessions) : {};
      
      sessions[TAB_ID] = now;

      // 2. Limpar sessões expiradas
      const activeSessions = Object.fromEntries(
        Object.entries(sessions).filter(([_, timestamp]) => now - (timestamp as number) < SESSION_TIMEOUT)
      );

      localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(activeSessions));

      // 3. Contar sessões únicas (abas/janelas abertas neste PC)
      const sessionsCount = Object.keys(activeSessions).length;

      // 4. (Opcional) Adicionar "Traders Recentes" baseados em mensagens reais
      // Isso faz com que usuários de outros PCs (se houvesse backend) fossem contados.
      // Aqui simula a detecção de atividade real no histórico.
      const savedMessages: ChatMessage[] = JSON.parse(localStorage.getItem('ultra_chat_history') || '[]');
      const recentChatters = new Set(
        savedMessages
          .filter(m => now - m.timestamp < 10 * 60 * 1000) // Ativos nos últimos 10 min
          .map(m => m.userId)
      );

      // O total é a soma de abas abertas + outros usuários únicos que falaram recentemente
      const totalRealUsers = Math.max(sessionsCount, recentChatters.size);
      setOnlineCount(totalRealUsers);
    };

    updatePresence();
    const interval = setInterval(updatePresence, 5000); // Atualiza a cada 5s

    return () => {
      clearInterval(interval);
      // Remove este tabId ao fechar
      const rawSessions = localStorage.getItem(HEARTBEAT_KEY);
      if (rawSessions) {
        const sessions = JSON.parse(rawSessions);
        delete sessions[TAB_ID];
        localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(sessions));
      }
    };
  }, []);

  // Carregar Histórico
  useEffect(() => {
    const saved = localStorage.getItem('ultra_chat_history');
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        {
          id: '1',
          userId: 'SYSTEM',
          userName: 'MODERADOR',
          text: 'Bem-vindos ao Chat Global Ultra Trade! Compartilhem seus estudos reais.',
          timestamp: Date.now() - 100000,
          isStaff: true
        }
      ]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
    if (messages.length > 0) {
      localStorage.setItem('ultra_chat_history', JSON.stringify(messages.slice(-50)));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e?: React.FormEvent, image?: string) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !image) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUserId,
      userName: `Trader_${currentUserId.substring(0, 4)}`,
      text: inputText,
      image,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSendMessage(undefined, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex flex-col transition-all duration-500 ${isExpanded ? 'w-[350px] h-[500px]' : 'w-16 h-16'}`}>
      {isExpanded ? (
        <div className="flex flex-col h-full glass rounded-[32px] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Chat VIP</h4>
                <p className="text-[8px] text-emerald-500 font-bold uppercase">
                  {onlineCount} {onlineCount === 1 ? 'Usuário Ativo' : 'Usuários Ativos'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsExpanded(false)} className="text-slate-500 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.userId === currentUserId ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                   <span className={`text-[8px] font-black uppercase ${msg.isStaff ? 'text-amber-400' : 'text-slate-500'}`}>
                    {msg.userName}
                  </span>
                  <span className="text-[7px] text-slate-600">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                  msg.userId === currentUserId 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : (msg.isStaff ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-tl-none' : 'bg-slate-800 text-slate-200 rounded-tl-none')
                }`}>
                  {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                  {msg.image && (
                    <img 
                      src={msg.image} 
                      alt="Estudo Gráfico" 
                      className="mt-2 rounded-lg cursor-pointer border border-white/10 hover:opacity-90 transition-opacity"
                      onClick={() => window.open(msg.image)}
                    />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-black/40 border-t border-white/5 flex items-center gap-2">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-blue-400 transition-colors"
              title="Anexar Estudo Gráfico"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload}
            />
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-slate-900 border border-white/5 text-[11px] px-3 py-2 rounded-xl outline-none focus:border-blue-500/50"
            />
            <button type="submit" className="p-2 text-blue-500 hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsExpanded(true)}
          className="w-16 h-16 rounded-full logo-gradient-bg shadow-[0_0_20px_rgba(96,165,250,0.5)] flex items-center justify-center hover:scale-110 transition-transform group relative"
        >
          {onlineCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-emerald-500 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-[#0a0a0c]">
              {onlineCount}
            </div>
          )}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default GlobalChat;
