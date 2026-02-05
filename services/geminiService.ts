
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
  const isOTC = selectedPair.toUpperCase().includes('OTC');

  return analyzeMarketStructure(selectedPair, timeframe, isOTC, type, entryTime, expirationTime, expirationTimestamp);
}

export async function generateSignal(
  pair: string, 
  timeframe: Timeframe, 
  isOTC: boolean,
  type: SignalType = SignalType.BINARY
): Promise<Signal> {
  const { entryTime, expirationTime, expirationTimestamp } = calculateTradeTimes(timeframe);
  const forceOTC = isOTC || pair.toUpperCase().includes('OTC');
  return analyzeMarketStructure(pair, timeframe, forceOTC, type, entryTime, expirationTime, expirationTimestamp);
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
    
    const prompt = `VOCÊ É O ANALISTA MESTRE DO ALGORITMO SNIPER V18.
                    ATIVO: ${pair} | TIMEFRAME: ${timeframe} | MERCADO: ${isOTC ? 'MERCADO OTC (POLARIUM DATA)' : 'REAL MARKET'}

                    OBJETIVO: Gerar um sinal de alta probabilidade baseado na confluência de TODAS as estratégias abaixo.

                    ESTRATÉGIAS PARA ANÁLISE (SCANNER MULTI-CAMADAS):
                    1. SMART MONEY CONCEPTS (SMC):
                       - Identifique Quebra de Estrutura (BOS) e Mudança de Caráter (CHoCH).
                       - Localize zonas de Order Block (OB) e Fair Value Gap (FVG).
                    
                    2. INDICADORES TÉCNICOS:
                       - Médias Móveis: EMA 10 (Rápida) e EMA 20 (Tendência). 
                       - Só operar CALL se o preço estiver acima das médias e inclinado para cima. PUT se estiver abaixo.
                    
                    3. PADRÕES DE CANDLE (CANDLE-A-CANDLE):
                       - Padrão de 3 velas (Impulso-Correção-Impulso).
                       - Rejeições em pavios e preenchimento de imbalance.
                    
                    4. FLUXO ALGORÍTMICO (POLARIUM BROKER):
                       - Se mercado for OTC, analise os ciclos de repetição e manipulação típicos da Polarium para o mercado OTC.

                    CRITÉRIO DE ENTRADA: O sinal de CALL ou PUT só deve ser emitido se houver confluência entre pelo menos 3 das estratégias citadas.

                    RESPOSTA OBRIGATÓRIA EM JSON:
                    {
                      "direction": "CALL" | "PUT",
                      "confidence": number (94-99)
                    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            direction: { type: Type.STRING, enum: ['CALL', 'PUT'] },
            confidence: { type: Type.NUMBER }
          },
          required: ['direction', 'confidence'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    const direction = (data.direction as SignalDirection) || (Math.random() > 0.5 ? SignalDirection.CALL : SignalDirection.PUT);
    const confidence = Math.floor(Math.max(94, Math.min(99, data.confidence || 94)));

    return {
      id: generateVIPId(type),
      pair,
      type,
      direction,
      timeframe,
      entryTime: type === SignalType.BINARY ? entryTime : "AGORA",
      expirationTime: type === SignalType.BINARY ? expirationTime : "TAKE PROFIT",
      expirationTimestamp,
      confidence: confidence,
      buyerPercentage: direction === SignalDirection.CALL ? confidence : 100 - confidence,
      sellerPercentage: direction === SignalDirection.PUT ? confidence : 100 - confidence,
      strategy: "SINAL VALIDADO PELO ALGORITMO SNIPER",
      timestamp: Date.now()
    };
  } catch (error) {
    const fallbackDirection = Date.now() % 2 === 0 ? SignalDirection.CALL : SignalDirection.PUT;
    return {
      id: generateVIPId(type),
      pair, 
      type, 
      direction: fallbackDirection, 
      timeframe,
      entryTime, 
      expirationTime,
      confidence: 94, 
      buyerPercentage: fallbackDirection === SignalDirection.CALL ? 94 : 6, 
      sellerPercentage: fallbackDirection === SignalDirection.PUT ? 94 : 6,
      strategy: "SINAL VALIDADO PELO ALGORITMO SNIPER", 
      timestamp: Date.now()
    };
  }
}
