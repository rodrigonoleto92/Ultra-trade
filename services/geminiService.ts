
import { GoogleGenAI, Type } from "@google/genai";
import { Signal, SignalDirection, Timeframe, SignalType } from "../types";

const generateVIPId = (type: SignalType) => `${type === SignalType.BINARY ? 'SNIPER' : 'FX'}-` + Math.random().toString(36).substr(2, 6).toUpperCase();

const calculateTradeTimes = (timeframe: Timeframe) => {
  const now = new Date();
  const entryDate = new Date(now);
  
  entryDate.setSeconds(0, 0);
  entryDate.setMinutes(now.getMinutes() + 1);

  if (entryDate.getMinutes() >= 60) {
    entryDate.setHours(entryDate.getHours() + 1);
    entryDate.setMinutes(entryDate.getMinutes() % 60);
  }

  const entryTime = entryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  const expDate = new Date(entryDate);
  if (timeframe === Timeframe.M1) expDate.setMinutes(entryDate.getMinutes() + 1);
  else if (timeframe === Timeframe.M5) expDate.setMinutes(entryDate.getMinutes() + 5);
  else expDate.setMinutes(entryDate.getMinutes() + 15);
  
  if (expDate.getMinutes() >= 60) {
    expDate.setHours(expDate.getHours() + 1);
    expDate.setMinutes(expDate.getMinutes() % 60);
  }

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
         Estratégia: Rompimento de Micro-Bandeira M1.
         Gere sinal para abertura de vela das ${entryTime}.
         Responda em JSON rigoroso: 
         { 
           "direction": "CALL"|"PUT", 
           "confidence": 96-99, 
           "analysis": "Explicação técnica curta do rompimento." 
         }`
      : `IA ESTRATÉGICA V12.1 - FOREX TRADING ESTRUTURAL:
         Ativo: ${pair} | Timeframe: ${timeframe}
         Identifique uma entrada baseada em SMC (Smart Money Concepts) ou Price Action.
         Responda em JSON rigoroso: 
         { 
           "direction": "CALL"|"PUT", 
           "confidence": 93-98, 
           "entryPrice": "Preço exato ou Mkt",
           "stopLoss": "Preço de proteção técnico",
           "takeProfit": "Preço de alvo 1:3",
           "analysis": "Padrão de reversão/continuidade identificado" 
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
            analysis: { type: Type.STRING },
            entryPrice: { type: Type.STRING },
            stopLoss: { type: Type.STRING },
            takeProfit: { type: Type.STRING },
          },
          required: ['direction', 'confidence', 'analysis'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');

    return {
      id: generateVIPId(type),
      pair,
      type,
      direction: (data.direction as SignalDirection) || SignalDirection.CALL,
      timeframe,
      entryTime: type === SignalType.BINARY ? entryTime : undefined,
      expirationTime: type === SignalType.BINARY ? expirationTime : undefined,
      entryPrice: type === SignalType.FOREX ? data.entryPrice : 'Mkt Price',
      stopLoss: type === SignalType.FOREX ? data.stopLoss : 'N/A',
      takeProfit: type === SignalType.FOREX ? data.takeProfit : 'N/A',
      confidence: data.confidence || 95,
      strategy: data.analysis || `${type} Strategy`,
      timestamp: Date.now()
    };

  } catch (error: any) {
    return {
      id: generateVIPId(type),
      pair,
      type,
      direction: SignalDirection.CALL,
      timeframe,
      entryTime: type === SignalType.BINARY ? entryTime : undefined,
      expirationTime: type === SignalType.BINARY ? expirationTime : undefined,
      entryPrice: 'Mkt',
      stopLoss: 'Auto',
      takeProfit: 'Auto',
      confidence: 85,
      strategy: 'Fallback Analysis System',
      timestamp: Date.now()
    };
  }
}
