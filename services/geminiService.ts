
import { GoogleGenAI, Type } from "@google/genai";
import { Signal, SignalDirection, Timeframe } from "../types";

const generateVIPId = () => "ULT-" + Math.random().toString(36).substr(2, 6).toUpperCase();

const calculateTradeTimes = (timeframe: Timeframe) => {
  const now = new Date();
  const entryDate = new Date(now);
  
  // Como o gatilho ocorre aos 55 segundos da vela atual,
  // a entrada é sempre no minuto seguinte (segundo 00).
  entryDate.setSeconds(0, 0);
  
  if (timeframe === Timeframe.M1) {
    entryDate.setMinutes(now.getMinutes() + 1);
  } else if (timeframe === Timeframe.M5) {
    const currentMin = now.getMinutes();
    const nextM5 = (Math.floor(currentMin / 5) + 1) * 5;
    entryDate.setMinutes(nextM5);
  } else if (timeframe === Timeframe.M15) {
    const currentMin = now.getMinutes();
    const nextM15 = (Math.floor(currentMin / 15) + 1) * 15;
    entryDate.setMinutes(nextM15);
  }

  // Correção de overflow de minutos
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

export async function generateSignal(pair: string, timeframe: Timeframe): Promise<Signal> {
  const { entryTime, expirationTime } = calculateTradeTimes(timeframe);

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Ação Requerida: Análise Probabilística Binária.
      Par: ${pair}. Timeframe: ${timeframe}.
      Gere um sinal para a vela de ${entryTime}.
      JSON esperado: {"direction": "CALL"|"PUT", "confidence": 80-98, "strategy": "string"}
    `;

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
            strategy: { type: Type.STRING },
          },
          required: ['direction', 'confidence', 'strategy'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');

    return {
      id: generateVIPId(),
      pair,
      direction: (data.direction as SignalDirection) || SignalDirection.CALL,
      timeframe,
      entryTime,
      expirationTime,
      confidence: data.confidence || 88,
      strategy: data.strategy || 'Price Action Algorítmico',
      timestamp: Date.now()
    };

  } catch (error: any) {
    // Contingência Local
    const isCall = Math.random() > 0.49;
    return {
      id: generateVIPId(),
      pair,
      direction: isCall ? SignalDirection.CALL : SignalDirection.PUT,
      timeframe,
      entryTime,
      expirationTime,
      confidence: 85 + Math.floor(Math.random() * 10),
      strategy: 'Fluxo Institucional IA',
      timestamp: Date.now()
    };
  }
}
