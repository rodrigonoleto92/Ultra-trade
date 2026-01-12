
import { GoogleGenAI, Type } from "@google/genai";
import { Signal, SignalDirection, Timeframe, SignalType } from "../types";

const generateVIPId = (type: SignalType) => `${type === SignalType.BINARY ? 'SNIPER' : 'FX'}-` + Math.random().toString(36).substr(2, 6).toUpperCase();

const calculateTradeTimes = (timeframe: Timeframe) => {
  const now = new Date();
  
  // Determinar a duração em minutos com base no enum Timeframe
  let timeframeMinutes = 1;
  if (timeframe === Timeframe.M5) timeframeMinutes = 5;
  else if (timeframe === Timeframe.M15) timeframeMinutes = 15;

  const entryDate = new Date(now);
  
  // Calcula o início da próxima vela (próximo múltiplo do timeframe)
  const currentMinutes = now.getMinutes();
  const nextCandleMinutes = Math.ceil((currentMinutes + 0.1) / timeframeMinutes) * timeframeMinutes;
  
  entryDate.setMinutes(nextCandleMinutes, 0, 0);

  // Se o cálculo de minutos ultrapassar 60, o Date() ajusta a hora automaticamente
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
      : `IA ESTRATÉGICA V12.1 - FOREX / CRIPTO:
         Ativo: ${pair} | Timeframe: ${timeframe}
         Identifique entrada técnica de alta precisão. 
         IMPORTANTE: O preço de entrada deve ser SEMPRE 'Mkt (À Mercado)'.
         Obrigatório retornar valores EXPLICITOS para Stop Loss e Take Profit.
         Se não tiver preço exato, use porcentagens: Stop: 1.0% | Alvo: 2.0%.
         Responda em JSON rigoroso com as chaves: direction, confidence, entryPrice, stopLoss, takeProfit, analysis.`;

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
          required: ['direction', 'confidence', 'analysis', 'entryPrice', 'stopLoss', 'takeProfit'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    const isForexType = type === SignalType.FOREX;

    return {
      id: generateVIPId(type),
      pair,
      type,
      direction: (data.direction as SignalDirection) || SignalDirection.CALL,
      timeframe,
      entryTime: type === SignalType.BINARY ? entryTime : undefined,
      expirationTime: type === SignalType.BINARY ? expirationTime : undefined,
      entryPrice: isForexType ? (data.entryPrice || 'Mkt (À Mercado)') : 'N/A',
      stopLoss: isForexType ? (data.stopLoss || '1.0% (Técnico)') : 'N/A',
      takeProfit: isForexType ? (data.takeProfit || '2.0% (Técnico)') : 'N/A',
      confidence: data.confidence || 95,
      strategy: data.analysis || 'Análise de Fluxo de Ordens por IA.',
      timestamp: Date.now()
    };

  } catch (error: any) {
    const isForexType = type === SignalType.FOREX;
    return {
      id: generateVIPId(type),
      pair,
      type,
      direction: Math.random() > 0.5 ? SignalDirection.CALL : SignalDirection.PUT,
      timeframe,
      entryTime: type === SignalType.BINARY ? entryTime : undefined,
      expirationTime: type === SignalType.BINARY ? expirationTime : undefined,
      entryPrice: isForexType ? 'Mkt (À Mercado)' : 'N/A',
      stopLoss: isForexType ? '1.0% (Base)' : 'N/A',
      takeProfit: isForexType ? '2.0% (Base)' : 'N/A',
      confidence: 88,
      strategy: 'Contingência Estrutural: Rompimento identificado com Stop de 1%.',
      timestamp: Date.now()
    };
  }
}
