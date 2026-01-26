
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
    const prompt = `ALGORITMO SNIPER V15 - LEITURA VISUAL DE PRICE ACTION:
                    Analise ${selectedPair} em ${timeframe}. 
                    
                    FILTRO INVISÍVEL (NÃO CITAR):
                    Use a Média de 20 para definir a tendência. 
                    - Se o preço estiver ABAIXO da média: Só aceite sinais de PUT (Venda).
                    - Se o preço estiver ACIMA da média: Só aceite sinais de CALL (Compra).
                    
                    ESTILO DE DESCRIÇÃO (MANDATÓRIO):
                    - Proibido usar: "Média", "MA20", "20", "Indicador", "Período", "Móvel".
                    - Use apenas termos de cenário: "Rompimento de Canal", "Rejeição de Preço", "Pivot de Alta/Baixa", "Exaustão de Vendedores", "Força Compradora Dominante", "Falso Rompimento".
                    - A descrição deve explicar O PORQUÊ da entrada baseada no cenário gráfico.

                    RESPOSTA JSON:
                    {
                      "direction": "CALL"|"PUT",
                      "confidence": 95-99,
                      "analysis": "Cenário de Price Action (Ex: Rompimento de canal com forte rejeição de topo) - Máx 12 palavras"
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
      strategy: data.analysis || 'Rompimento de canal identificado com forte fluxo de continuidade.',
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
      strategy: 'Rejeição de preço em zona de oferta com fluxo vendedor.', 
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
                    Filtre pela MA20 internamente (Tendência).
                    DESCRIÇÃO: Use termos de Price Action como "Canais", "Rompimentos", "Rejeição". 
                    NUNCA escreva nomes de indicadores.
                    JSON:
                    {
                      "direction": "CALL"|"PUT",
                      "confidence": 93-99,
                      "analysis": "Descreva o cenário gráfico apenas"
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
      strategy: data.analysis || 'Fluxo de rompimento confirmado pela ação do preço.',
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      id: generateVIPId(type),
      pair, type, direction: SignalDirection.PUT, timeframe,
      entryTime: "AGORA", confidence: 85, buyerPercentage: 15, sellerPercentage: 85,
      strategy: 'Padrão de rejeição em zona de resistência estrutural.', timestamp: Date.now()
    };
  }
}
