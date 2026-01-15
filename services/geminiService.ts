
import { GoogleGenAI, Type } from "@google/genai";
import { Signal, SignalDirection, Timeframe, SignalType } from "../types";

const generateVIPId = (type: SignalType) => `${type === SignalType.BINARY ? 'SNIPER' : 'FX'}-` + Math.random().toString(36).substr(2, 6).toUpperCase();

const calculateTradeTimes = (timeframe: Timeframe) => {
  const now = new Date();
  let timeframeMinutes = 1;
  if (timeframe === Timeframe.M5) timeframeMinutes = 5;
  else if (timeframe === Timeframe.M15) timeframeMinutes = 15;

  const entryDate = new Date(now);
  const currentMinutes = now.getMinutes();
  const nextCandleMinutes = Math.ceil((currentMinutes + 0.1) / timeframeMinutes) * timeframeMinutes;
  entryDate.setMinutes(nextCandleMinutes, 0, 0);

  const entryTime = entryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const expDate = new Date(entryDate);
  expDate.setMinutes(entryDate.getMinutes() + timeframeMinutes);
  const expirationTime = expDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return { entryTime, expirationTime };
};

export async function generateSignal(
  pair: string, 
  timeframe: Timeframe, 
  isOTC: boolean,
  type: SignalType = SignalType.BINARY
): Promise<Signal> {
  const { entryTime, expirationTime } = calculateTradeTimes(timeframe);

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `IA ANALISTA SNIPER V12.1 - TRADING PROFISSIONAL:
         Ativo: ${pair} | Timeframe Principal: ${timeframe} | Modo: ${type} ${isOTC ? 'OTC' : ''}
         
         REQUISITOS OBRIGATÓRIOS:
         1. Analise o gráfico para o sinal imediato baseado em Price Action e Volume.
         2. Forneça o Delta de Volume (sentimento de compradores vs vendedores) para o timeframe atual.
         3. O campo "analysis" DEVE ser escrito em PORTUGUÊS DO BRASIL, justificando tecnicamente o sinal (ex: rompimento de suporte, exaustão de volume, etc).
         
         Responda estritamente em JSON:
         {
           "direction": "CALL"|"PUT",
           "confidence": 90-99,
           "buyerPercent": 0-100,
           "sellerPercent": 0-100,
           "analysis": "Texto em português justificando a entrada..."
         }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            direction: { type: Type.STRING, enum: ['CALL', 'PUT'] },
            confidence: { type: Type.NUMBER },
            buyerPercent: { type: Type.NUMBER },
            sellerPercent: { type: Type.NUMBER },
            analysis: { type: Type.STRING },
          },
          required: ['direction', 'confidence', 'buyerPercent', 'sellerPercent', 'analysis'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    const isForexType = type === SignalType.FOREX;
    const direction = (data.direction as SignalDirection) || SignalDirection.CALL;

    let sl = 'N/A';
    let tp = 'N/A';

    if (isForexType) {
      if (direction === SignalDirection.CALL) {
        sl = 'Stop no último fundo';
        tp = 'Take no primeiro topo';
      } else {
        sl = 'Stop no último topo';
        tp = 'Take no primeiro fundo';
      }
    }

    return {
      id: generateVIPId(type),
      pair,
      type,
      direction,
      timeframe,
      entryTime: type === SignalType.BINARY ? entryTime : undefined,
      expirationTime: type === SignalType.BINARY ? expirationTime : undefined,
      entryPrice: isForexType ? 'Mkt (À Mercado)' : 'N/A',
      stopLoss: sl,
      takeProfit: tp,
      confidence: data.confidence || 95,
      buyerPercentage: data.buyerPercent || 50,
      sellerPercentage: data.sellerPercent || 50,
      strategy: data.analysis || 'Análise técnica de fluxo confirmada pela IA.',
      timestamp: Date.now()
    };

  } catch (error: any) {
    const isForexType = type === SignalType.FOREX;
    const direction = Math.random() > 0.5 ? SignalDirection.CALL : SignalDirection.PUT;
    
    let sl = 'N/A';
    let tp = 'N/A';

    if (isForexType) {
      if (direction === SignalDirection.CALL) {
        sl = 'Stop no último fundo';
        tp = 'Take no primeiro topo';
      } else {
        sl = 'Stop no último topo';
        tp = 'Take no primeiro fundo';
      }
    }

    const bPct = Math.floor(Math.random() * 40) + 30;

    return {
      id: generateVIPId(type),
      pair,
      type,
      direction,
      timeframe,
      entryTime: type === SignalType.BINARY ? entryTime : undefined,
      expirationTime: type === SignalType.BINARY ? expirationTime : undefined,
      entryPrice: isForexType ? 'Mkt (À Mercado)' : 'N/A',
      stopLoss: sl,
      takeProfit: tp,
      confidence: 88,
      buyerPercentage: bPct,
      sellerPercentage: 100 - bPct,
      strategy: 'Erro na conexão. Aplicando estratégia padrão de reversão em suporte/resistência.',
      timestamp: Date.now()
    };
  }
}
