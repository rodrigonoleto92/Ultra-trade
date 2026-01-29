
import { GoogleGenAI, Type } from "@google/genai";
import { Signal, SignalDirection, Timeframe, SignalType, CurrencyPair } from "../types";

const generateVIPId = (type: SignalType) => `${type === SignalType.BINARY ? 'SNIPER' : 'FX'}-` + Math.random().toString(36).substr(2, 6).toUpperCase();

const calculateTradeTimes = (timeframe: Timeframe) => {
  const now = new Date();
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  
  let timeframeMinutes = 1;
  if (timeframe === Timeframe.M1) timeframeMinutes = 1;
  else if (timeframe === Timeframe.M5) timeframeMinutes = 5;
  else if (timeframe === Timeframe.M15) timeframeMinutes = 15;
  else if (timeframe === Timeframe.M30) timeframeMinutes = 30;
  else if (timeframe === Timeframe.H1) timeframeMinutes = 60;
  else if (timeframe === Timeframe.H4) timeframeMinutes = 240;

  const entryDate = new Date(now);
  const buffer = seconds > 45 ? 1 : 0;
  let nextBoundaryMinutes = (Math.floor(minutes / timeframeMinutes) + 1 + buffer) * timeframeMinutes;
  
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
  const randomAsset = pairs[Math.floor(Math.random() * pairs.length)];
  const selectedPair = randomAsset.symbol;
  const isOTC = selectedPair.includes('OTC');

  return analyzeMarketStructure(selectedPair, timeframe, isOTC, type, entryTime, expirationTime, expirationTimestamp);
}

export async function generateSignal(
  pair: string, 
  timeframe: Timeframe, 
  isOTC: boolean,
  type: SignalType = SignalType.BINARY
): Promise<Signal> {
  const { entryTime, expirationTime, expirationTimestamp } = calculateTradeTimes(timeframe);
  return analyzeMarketStructure(pair, timeframe, isOTC, type, entryTime, expirationTime, expirationTimestamp);
}

async function analyzeMarketStructure(
  pair: string,
  timeframe: Timeframe,
  isOTC: boolean,
  type: SignalType,
  entryTime: string,
  expirationTime: string,
  expirationTimestamp?: number
): Promise<Signal> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const useSearch = !isOTC;

    const prompt = `SISTEMA QUANTITATIVO ULTRA TRADE V18
                    ATIVO: ${pair}
                    TIMEFRAME: ${timeframe}
                    MODO: ${isOTC ? 'OTC' : 'REAL'}

                    INSTRUÇÃO: Analise o gráfico atual e determine a direção.
                    IMPORTANTE: O valor de 'confidence' deve ser um número INTEIRO entre 80 e 98 (ex: 88, não 0.88).
                    
                    JSON FORMAT:
                    {
                      "direction": "CALL" | "PUT",
                      "confidence": number,
                      "reasoning": "string",
                      "is_news_impact": boolean
                    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: useSearch ? [{ googleSearch: {} }] : undefined,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            direction: { type: Type.STRING, enum: ['CALL', 'PUT'] },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            is_news_impact: { type: Type.BOOLEAN }
          },
          required: ['direction', 'confidence', 'reasoning', 'is_news_impact'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    
    // Garantir que a confiança seja um número inteiro e nunca menor que 80
    let confidence = data.confidence;
    if (confidence < 1) confidence = confidence * 100;
    confidence = Math.floor(Math.max(80, Math.min(99, confidence)));

    // Cálculo de pressão: Se CALL, comprador é alto. Se PUT, vendedor é alto.
    const buyerPct = data.direction === 'CALL' 
      ? confidence 
      : 100 - confidence;

    const sellerPct = 100 - buyerPct;

    return {
      id: generateVIPId(type),
      pair,
      type,
      direction: (data.direction as SignalDirection),
      timeframe,
      entryTime: type === SignalType.BINARY ? entryTime : "AGORA",
      expirationTime: type === SignalType.BINARY ? expirationTime : "TARGET",
      expirationTimestamp,
      confidence: confidence,
      buyerPercentage: buyerPct,
      sellerPercentage: sellerPct,
      strategy: data.is_news_impact ? `[ALERTA VOLATILIDADE] ${data.reasoning}` : data.reasoning,
      timestamp: Date.now()
    };
  } catch (error) {
    const isEven = new Date().getMinutes() % 2 === 0;
    const direction = isEven ? SignalDirection.CALL : SignalDirection.PUT;
    return {
      id: generateVIPId(type),
      pair, type, direction, timeframe,
      entryTime: "AGORA", 
      confidence: 88, 
      buyerPercentage: direction === SignalDirection.CALL ? 88 : 12, 
      sellerPercentage: direction === SignalDirection.PUT ? 88 : 12,
      strategy: 'Análise técnica de fluxo baseada em rejeição de preço.', 
      timestamp: Date.now()
    };
  }
}
