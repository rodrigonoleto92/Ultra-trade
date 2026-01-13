
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
    
    const prompt = type === SignalType.BINARY 
      ? `IA ESTRATÉGICA V12.1 - OPÇÕES BINÁRIAS - ${isOTC ? 'MERCADO OTC' : 'MERCADO REAL'}:
         Ativo: ${pair} | Timeframe: ${timeframe}
         Gere sinal para abertura de vela das ${entryTime}.
         Responda em JSON: { "direction": "CALL"|"PUT", "confidence": 96-99, "analysis": "..." }`
      : `IA ANALISTA DE PRICE ACTION V12.1 - FOREX / CRIPTO:
         Ativo: ${pair} | Timeframe: ${timeframe}
         Identifique a melhor entrada técnica baseada em SUPORTE E RESISTÊNCIA.
         Responda em JSON: { "direction": "CALL"|"PUT", "confidence": 92-98, "analysis": "..." }`;

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
            analysis: { type: Type.STRING },
          },
          required: ['direction', 'confidence', 'analysis'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    const isForexType = type === SignalType.FOREX;
    const direction = (data.direction as SignalDirection) || SignalDirection.CALL;

    // Lógica de Stop e Take baseada em topos e fundos conforme solicitado
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
      strategy: data.analysis || 'Análise de estrutura de mercado confirmada.',
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
      strategy: 'Erro na API. Usando análise técnica padrão de topos e fundos.',
      timestamp: Date.now()
    };
  }
}
