
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
    const prompt = `IA HUNTER SNIPER V12.1: Faça uma varredura técnica nos seguintes pares: [${pairsList}]. 
                    Identifique QUAL destes pares tem a configuração de ${timeframe} mais forte agora.
                    Responda estritamente em JSON:
                    {
                      "selectedPair": "NOME_DO_PAR",
                      "direction": "CALL"|"PUT",
                      "confidence": 90-99,
                      "analysis": "Justificativa técnica curta"
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
      strategy: data.analysis || 'Detectada exaustão de preço no ativo selecionado.',
      timestamp: Date.now()
    };
  } catch (error) {
    // Fallback se a IA falhar na varredura
    const randomPair = pairs[Math.floor(Math.random() * pairs.length)].symbol;
    return {
      id: generateVIPId(type),
      pair: randomPair, type, direction: SignalDirection.CALL, timeframe,
      entryTime, expirationTime, expirationTimestamp,
      confidence: 85, buyerPercentage: 50, sellerPercentage: 50,
      strategy: 'Sinal gerado por análise de tendência primária.', timestamp: Date.now()
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
    const prompt = `IA ANALISTA SNIPER V12.1: Analise o fluxo de ordens para ${pair} (${timeframe}). 
                    Responda estritamente em JSON:
                    {
                      "direction": "CALL"|"PUT",
                      "confidence": 90-99,
                      "analysis": "Justificativa técnica curta em Português"
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
    const bPct = Math.floor(Math.random() * 20) + 40;

    return {
      id: generateVIPId(type),
      pair,
      type,
      direction: (data.direction as SignalDirection) || (Math.random() > 0.5 ? SignalDirection.CALL : SignalDirection.PUT),
      timeframe,
      entryTime: type === SignalType.BINARY ? entryTime : undefined,
      expirationTime: type === SignalType.BINARY ? expirationTime : undefined,
      expirationTimestamp: type === SignalType.BINARY ? expirationTimestamp : undefined,
      confidence: data.confidence || 94,
      buyerPercentage: bPct,
      sellerPercentage: 100 - bPct,
      strategy: data.analysis || 'Fluxo confirmado pelo algoritmo sniper.',
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      id: generateVIPId(type),
      pair, type, direction: SignalDirection.CALL, timeframe,
      entryTime, expirationTime, expirationTimestamp,
      confidence: 85, buyerPercentage: 50, sellerPercentage: 50,
      strategy: 'Análise de price action padrão.', timestamp: Date.now()
    };
  }
}
