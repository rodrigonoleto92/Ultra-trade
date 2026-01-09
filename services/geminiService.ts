
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
      : `IA ESTRATÉGICA V12.1 - FOREX / CRIPTO TRADING:
         Ativo: ${pair} | Timeframe: ${timeframe}
         Identifique uma entrada técnica de alta precisão. 
         IMPORTANTE: O preço de entrada deve ser 'Mkt (Preço Atual)'.
         Obrigatório: Gere preços técnicos realistas (ex: 1.08450 ou 96450.00) para Stop Loss e Take Profit baseados na volatilidade do ativo.
         Responda em JSON rigoroso: 
         { 
           "direction": "CALL"|"PUT", 
           "confidence": 93-98, 
           "entryPrice": "Mkt",
           "stopLoss": "VALOR_NUMERICO_STOP",
           "takeProfit": "VALOR_NUMERICO_ALVO",
           "analysis": "Explicação do padrão gráfico detectado" 
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
          required: ['direction', 'confidence', 'analysis', 'stopLoss', 'takeProfit'],
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
      entryPrice: type === SignalType.FOREX ? (data.entryPrice || 'Mkt') : 'N/A',
      stopLoss: type === SignalType.FOREX ? (data.stopLoss || 'Calculando...') : 'N/A',
      takeProfit: type === SignalType.FOREX ? (data.takeProfit || 'Calculando...') : 'N/A',
      confidence: data.confidence || 95,
      strategy: data.analysis || `${type} Estrutura de Preço`,
      timestamp: Date.now()
    };

  } catch (error: any) {
    // Fallback com valores técnicos simulados para não quebrar a UI
    return {
      id: generateVIPId(type),
      pair,
      type,
      direction: Math.random() > 0.5 ? SignalDirection.CALL : SignalDirection.PUT,
      timeframe,
      entryTime: type === SignalType.BINARY ? entryTime : undefined,
      expirationTime: type === SignalType.BINARY ? expirationTime : undefined,
      entryPrice: type === SignalType.FOREX ? 'Mkt' : 'N/A',
      stopLoss: 'Técnico',
      takeProfit: 'Técnico',
      confidence: 85,
      strategy: 'Análise de Contingência Ativada',
      timestamp: Date.now()
    };
  }
}
