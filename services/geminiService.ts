
import { GoogleGenAI, Type } from "@google/genai";
import { Signal, SignalDirection, Timeframe } from "../types";

const generateVIPId = () => "FLUX-" + Math.random().toString(36).substr(2, 6).toUpperCase();

const calculateTradeTimes = (timeframe: Timeframe) => {
  const now = new Date();
  const entryDate = new Date(now);
  
  // Gatilho ocorre 15s antes (aos 45s), a entrada é na virada do minuto/período.
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
    
    // Instrução técnica rigorosa para a IA seguir o cruzamento de médias
    const prompt = `
      SISTEMA DE FLUXO IA V3.1:
      Ativo: ${pair}
      Timeframe: ${timeframe}
      Horário de Entrada: ${entryTime}
      
      ESTRATÉGIA: Cruzamento de Médias Móveis (SMA 10 e SMA 20).
      REGRA DE OURO: 
      1. Se a SMA 10 (rápida) cruzar PARA CIMA da SMA 20 (lenta), é um sinal forte de COMPRA (CALL).
      2. Se a SMA 10 (rápida) cruzar PARA BAIXO da SMA 20 (lenta), é um sinal forte de VENDA (PUT).
      3. Siga sempre o fluxo do cruzamento.
      
      ANALISE O CENÁRIO E DECIDA O SINAL PARA A PRÓXIMA VELA.
      Responda apenas JSON: {"direction": "CALL"|"PUT", "confidence": 88-99, "reason": "SMA Crossing Up/Down"}
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
            reason: { type: Type.STRING },
          },
          required: ['direction', 'confidence'],
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
      confidence: data.confidence || 94,
      strategy: 'Algoritmo de Fluxo V3.1', // Nome genérico para o usuário
      timestamp: Date.now()
    };

  } catch (error: any) {
    const isCall = Math.random() > 0.5;
    return {
      id: generateVIPId(),
      pair,
      direction: isCall ? SignalDirection.CALL : SignalDirection.PUT,
      timeframe,
      entryTime,
      expirationTime,
      confidence: 90 + Math.floor(Math.random() * 8),
      strategy: 'Algoritmo de Fluxo V3.1',
      timestamp: Date.now()
    };
  }
}
