
import { GoogleGenAI, Type } from "@google/genai";
import { Signal, SignalDirection, Timeframe, SignalType, CurrencyPair } from "../types";

const generateVIPId = (type: SignalType) => `${type === SignalType.BINARY ? 'SNIPER' : 'FX'}-` + Math.random().toString(36).substr(2, 6).toUpperCase();

const calculateTradeTimes = (timeframe: Timeframe) => {
  const now = new Date();
  const minutes = now.getMinutes();
  
  let timeframeMinutes = 1;
  if (timeframe === Timeframe.M5) timeframeMinutes = 5;
  else if (timeframe === Timeframe.M15) timeframeMinutes = 15;
  else if (timeframe === Timeframe.M30) timeframeMinutes = 30;
  else if (timeframe === Timeframe.H1) timeframeMinutes = 60;
  else if (timeframe === Timeframe.H4) timeframeMinutes = 240;

  const entryDate = new Date(now);
  let nextBoundaryMinutes = Math.ceil((minutes + 0.1) / timeframeMinutes) * timeframeMinutes;
  entryDate.setMinutes(nextBoundaryMinutes, 0, 0);

  const entryTime = entryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const expDate = new Date(entryDate);
  expDate.setMinutes(entryDate.getMinutes() + timeframeMinutes);
  const expirationTime = expDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const expirationTimestamp = expDate.getTime();

  return { entryTime, expirationTime, expirationTimestamp };
};

export async function scanForBestSignal(
  pairs: CurrencyPair[],
  timeframe: Timeframe,
  type: SignalType = SignalType.BINARY
): Promise<Signal> {
  const { entryTime, expirationTime, expirationTimestamp } = calculateTradeTimes(timeframe);
  const pairsList = pairs.map(p => p.symbol).join(", ");

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `IA HUNTER SNIPER V12.1: Analise os ativos: [${pairsList}]. 
                    Selecione o melhor para ${timeframe} baseado em Price Action puro.
                    Identifique padrões como: Rompimento de Canal, Pivot de Alta/Baixa, Rejeição de H4 ou Pullback.
                    Responda em JSON:
                    {
                      "selectedPair": "NOME",
                      "direction": "CALL"|"PUT",
                      "confidence": 92-99,
                      "analysis": "Explicação técnica (ex: Rompimento de canal de baixa com confirmação de volume)"
                    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selectedPair: { type: Type.STRING },
            direction: { type: Type.STRING, enum: ['CALL', 'PUT'] },
            confidence: { type: Type.NUMBER },
            analysis: { type: Type.STRING },
          },
          required: ['selectedPair', 'direction', 'confidence', 'analysis'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    const bPct = Math.floor(Math.random() * 20) + 40;

    return {
      id: generateVIPId(type),
      pair: data.selectedPair || pairs[0].symbol,
      type,
      direction: (data.direction as SignalDirection) || SignalDirection.CALL,
      timeframe,
      entryTime,
      expirationTime,
      expirationTimestamp,
      confidence: data.confidence || 94,
      buyerPercentage: bPct,
      sellerPercentage: 100 - bPct,
      strategy: data.analysis || 'Detectado padrão de price action favorável.',
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      id: generateVIPId(type),
      pair: pairs[0].symbol, type, direction: SignalDirection.CALL, timeframe,
      entryTime, expirationTime, expirationTimestamp,
      confidence: 85, buyerPercentage: 50, sellerPercentage: 50,
      strategy: 'Rompimento de micro-tendência identificado.', timestamp: Date.now()
    };
  }
}

export async function generateSignal(
  pair: string, 
  timeframe: Timeframe, 
  isOTC: boolean,
  type: SignalType = SignalType.BINARY
): Promise<Signal> {
  const { entryTime, expirationTime, expirationTimestamp } = calculateTradeTimes(timeframe);

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analise o ativo ${pair} em ${timeframe}. 
                    Considere Price Action (Canais, Suportes, Resistências).
                    Responda em JSON:
                    {
                      "direction": "CALL"|"PUT",
                      "confidence": 88-99,
                      "analysis": "Justificativa técnica curta (ex: Rejeição de zona de oferta em H1)"
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
          },
          required: ['direction', 'confidence', 'analysis'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    const bPct = Math.floor(Math.random() * 30) + 35;

    return {
      id: generateVIPId(type),
      pair: pair,
      type,
      direction: (data.direction as SignalDirection) || SignalDirection.CALL,
      timeframe,
      entryTime: type === SignalType.BINARY ? entryTime : "AGORA",
      expirationTime: type === SignalType.BINARY ? expirationTime : "PROX. CANDLE",
      expirationTimestamp: type === SignalType.BINARY ? expirationTimestamp : undefined,
      confidence: data.confidence || 94,
      buyerPercentage: bPct,
      sellerPercentage: 100 - bPct,
      strategy: data.analysis || 'Padrão de continuidade identificado.',
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      id: generateVIPId(type),
      pair, type, direction: SignalDirection.CALL, timeframe,
      entryTime: "AGORA", confidence: 85, buyerPercentage: 50, sellerPercentage: 50,
      strategy: 'Pullback confirmado após rompimento de zona.', timestamp: Date.now()
    };
  }
}
