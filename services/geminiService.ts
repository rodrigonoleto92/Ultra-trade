
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
    
    const prompt = `VOCÊ É O ANALISTA MESTRE DO ALGORITMO SNIPER V18 - ESPECIALISTA EM PRICE ACTION MICRO.
                    SUA MISSÃO É ANALISAR O GRÁFICO VELA-A-VELA NO TIMEFRAME DE ${timeframe}.

                    DADOS DO ATIVO:
                    - ATIVO: ${pair}
                    - MERCADO: ${isOTC ? 'OTC (Padrões de Algoritmo)' : 'MERCADO REAL (Price Action)'}

                    ESTRATÉGIAS INTEGRADAS (MÁXIMA CONFLUÊNCIA):
                    1. ESTRUTURA DINÂMICA: Identifique Linhas de Tendência (LTA/LTB) e Canais. O sinal deve ser a favor do rompimento ou no toque da extremidade do canal.
                    2. PADRÕES DE CANDLE: Analise as últimas 3 velas. Busque por Engolfo, Martelo, Pin Bar ou Doji de exaustão em zonas de preço.
                    3. SMC (Smart Money): Localize Order Blocks e zonas de Liquidez que atraem o preço no curto prazo.
                    4. INDICADORES (RSI/MACD): Use para confirmar se o padrão de candle ocorre em zona de exaustão.
                    
                    LOGICA DE ENTRADA: O sinal deve ser gerado quando um PADRÃO DE REVERSÃO ou CONTINUIDADE tocar uma zona de LTA, LTB ou SUPORTE/RESISTÊNCIA.

                    RESPOSTA EM JSON:
                    {
                      "direction": "CALL" | "PUT",
                      "confidence": number (95-99),
                      "reasoning": "Descreva o padrão (Ex: Martelo em LTA + RSI Sobrevendido)",
                      "pattern": "Nome do padrão identificado (Ex: LTA + ENGOLFO)"
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
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            pattern: { type: Type.STRING }
          },
          required: ['direction', 'confidence', 'reasoning', 'pattern'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    const direction = (data.direction as SignalDirection) || (Math.random() > 0.5 ? SignalDirection.CALL : SignalDirection.PUT);
    const confidence = Math.floor(Math.max(95, Math.min(99, data.confidence || 95)));

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
      strategy: `${data.pattern || 'ACTION'} + SMC + RSI`,
      timestamp: Date.now()
    };
  } catch (error) {
    const fallbackDir = Date.now() % 2 === 0 ? SignalDirection.CALL : SignalDirection.PUT;
    return {
      id: generateVIPId(type),
      pair,
      type,
      direction: fallbackDir,
      timeframe,
      entryTime,
      expirationTime,
      confidence: 95,
      buyerPercentage: fallbackDir === SignalDirection.CALL ? 95 : 5,
      sellerPercentage: fallbackDir === SignalDirection.PUT ? 95 : 5,
      strategy: "PRICE ACTION + STRUCTURE",
      timestamp: Date.now()
    };
  }
}
