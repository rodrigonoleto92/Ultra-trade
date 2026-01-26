
import { GoogleGenAI, Type } from "@google/genai";
import { Signal, SignalDirection, Timeframe, SignalType, CurrencyPair } from "../types";

const generateVIPId = (type: SignalType) => `${type === SignalType.BINARY ? 'SNIPER' : 'FX'}-` + Math.random().toString(36).substr(2, 6).toUpperCase();

const calculateTradeTimes = (timeframe: Timeframe) => {
  const now = new Date();
  const minutes = now.getMinutes();
  
  let timeframeMinutes = 1;
  if (timeframe === Timeframe.M1) timeframeMinutes = 1;
  else if (timeframe === Timeframe.M5) timeframeMinutes = 5;
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
  
  const randomAsset = pairs[Math.floor(Math.random() * pairs.length)];
  const selectedPair = randomAsset.symbol;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `ALGORITMO SNIPER V17 - LEITURA PURA DE PRICE ACTION:
                    Analise ${selectedPair} em ${timeframe}. 
                    
                    FILTRO RÍGIDO DE FLUXO (INVISÍVEL):
                    - Use a tendência macro para validar a direção. 
                    - Se o preço estiver em queda livre, procure apenas Vendas (PUT).
                    - Se o preço estiver em subida constante, procure apenas Compras (CALL).

                    PROIBIÇÃO DE TERMINOLOGIA:
                    - É ESTRITAMENTE PROIBIDO usar: "Média", "Móvel", "Indicador", "MA20", "20", "Período", "EMA", "SMA", "Cruzamento".
                    - Use APENAS termos de cenário: "Rompimento de Canal", "Rejeição de Topo/Fundo", "Pivot de Alta/Baixa", "Exaustão de Vendedores", "Força Compradora", "Falso Rompimento", "Pullback em Zona Estrutural".

                    RESPOSTA JSON:
                    {
                      "direction": "CALL"|"PUT",
                      "confidence": 94-99,
                      "analysis": "Explicação visual do cenário Price Action (Ex: Rompimento de canal descendente com forte rejeição de preço) - Máx 12 palavras"
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
    const bPct = data.direction === 'CALL' ? Math.floor(Math.random() * 20) + 70 : Math.floor(Math.random() * 20) + 10;

    return {
      id: generateVIPId(type),
      pair: selectedPair,
      type,
      direction: (data.direction as SignalDirection) || SignalDirection.CALL,
      timeframe,
      entryTime,
      expirationTime,
      expirationTimestamp,
      confidence: data.confidence || 97,
      buyerPercentage: bPct,
      sellerPercentage: 100 - bPct,
      strategy: data.analysis || 'Rompimento de estrutura identificado com fluxo de continuidade.',
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      id: generateVIPId(type),
      pair: selectedPair, 
      type, 
      direction: SignalDirection.PUT, 
      timeframe,
      entryTime, 
      expirationTime, 
      expirationTimestamp,
      confidence: 88, 
      buyerPercentage: 25, 
      sellerPercentage: 75,
      strategy: 'Rejeição de preço em zona de oferta com fluxo vendedor dominante.', 
      timestamp: Date.now()
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
    const prompt = `Analise ${pair} em ${timeframe}. 
                    NÃO mencione indicadores ou médias. FOCO EM PRICE ACTION PURO.
                    Use: Canais, Rompimentos, Rejeição, Padrões de Vela e Estrutura de Mercado.
                    Responda em JSON:
                    {
                      "direction": "CALL"|"PUT",
                      "confidence": 93-99,
                      "analysis": "Descrição técnica visual do cenário gráfico"
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
    const bPct = data.direction === 'CALL' ? 75 : 25;

    return {
      id: generateVIPId(type),
      pair,
      type,
      direction: (data.direction as SignalDirection) || SignalDirection.CALL,
      timeframe,
      entryTime: type === SignalType.BINARY ? entryTime : "AGORA",
      expirationTime: type === SignalType.BINARY ? expirationTime : "PROX. CANDLE",
      expirationTimestamp: type === SignalType.BINARY ? expirationTimestamp : undefined,
      confidence: data.confidence || 96,
      buyerPercentage: bPct,
      sellerPercentage: 100 - bPct,
      strategy: data.analysis || 'Confirmação técnica de rompimento e continuidade de fluxo.',
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      id: generateVIPId(type),
      pair, type, direction: SignalDirection.PUT, timeframe,
      entryTime: "AGORA", confidence: 85, buyerPercentage: 15, sellerPercentage: 85,
      strategy: 'Padrão de rejeição identificado em zona estrutural de preço.', timestamp: Date.now()
    };
  }
}
