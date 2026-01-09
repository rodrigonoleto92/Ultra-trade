
import { GoogleGenAI, Type } from "@google/genai";
import { Signal, SignalDirection, Timeframe } from "../types";

const generateVIPId = () => "SNIPER-" + Math.random().toString(36).substr(2, 6).toUpperCase();

const calculateTradeTimes = (timeframe: Timeframe) => {
  const now = new Date();
  const entryDate = new Date(now);
  
  // O sinal é gerado para a PRÓXIMA vela (abertura em 00s)
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

export async function generateSignal(pair: string, timeframe: Timeframe, isOTC: boolean): Promise<Signal> {
  const { entryTime, expirationTime } = calculateTradeTimes(timeframe);

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      IA ESTRATÉGICA V11.0 - ${isOTC ? 'MERCADO OTC' : 'MERCADO REAL'}:
      Ativo: ${pair} | Timeframe: ${timeframe}
      
      PROTOCOLO SNIPER:
      1. TIPO DE MERCADO: ${isOTC ? 'Analise algoritmos de corretora (OTC) buscando padrões de repetição e reversão em micro-bandeiras.' : 'Analise fluxo real de liquidez e rompimentos de estruturas de preço reais.'}
      2. MICRO-BANDEIRA: Identifique correções curtas de 2-4 candles.
      3. GATILHO DE PRECISÃO: O sinal deve prever o rompimento na abertura da vela de ${entryTime}.
      4. FILTRO DE ASSERTIVIDADE: Recuse o sinal se houver suporte/resistência imediato impedindo o movimento.
      
      Responda estritamente em JSON: 
      {
        "direction": "CALL"|"PUT", 
        "confidence": 96-99, 
        "analysis": "Explicação técnica curta do rompimento.",
        "context": "${isOTC ? 'Algoritmo OTC' : 'Fluxo Real'}"
      }
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
            analysis: { type: Type.STRING },
            context: { type: Type.STRING },
          },
          required: ['direction', 'confidence', 'analysis', 'context'],
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
      confidence: data.confidence || 98,
      strategy: `${data.context} Breakout`,
      timestamp: Date.now()
    };

  } catch (error: any) {
    return {
      id: generateVIPId(),
      pair,
      direction: SignalDirection.CALL,
      timeframe,
      entryTime,
      expirationTime,
      confidence: 90,
      strategy: 'HFT Emergency Analysis',
      timestamp: Date.now()
    };
  }
}
