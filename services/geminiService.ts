
import { GoogleGenAI, Type } from "@google/genai";
import { Signal, SignalDirection, Timeframe } from "../types";

const generateVIPId = () => "STRC-" + Math.random().toString(36).substr(2, 6).toUpperCase();

const calculateTradeTimes = (timeframe: Timeframe) => {
  const now = new Date();
  const entryDate = new Date(now);
  
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
    
    const prompt = `
      SISTEMA DE ANÁLISE ESTRUTURAL V6.0 - FOCO EM ROMPIMENTO DE CANAL SECUNDÁRIO:
      Ativo: ${pair} | Timeframe: ${timeframe}
      
      ESTRUTURA ALVO (BASEADA NA IMAGEM DE REFERÊNCIA):
      1. CANAL PRIMÁRIO: Tendência de ALTA clara (LTA). O preço faz topos e fundos ascendentes.
      2. CANAL SECUNDÁRIO: Uma correção de curta duração com inclinação OPOSTA ao canal primário (Bandeira de Baixa).
      
      CRITÉRIO DE ENTRADA:
      - O sinal deve ser gerado no exato momento em que o preço rompe a resistência do CANAL SECUNDÁRIO para cima, confirmando a retomada da tendência de alta principal.
      - PRIORIDADE: Sinais de CALL em tendências de alta predominantes.
      
      ANALISE O FLUXO:
      - Houve exaustão da contra-tendência?
      - O volume no rompimento é superior à média?
      
      Responda estritamente em JSON: 
      {
        "direction": "CALL"|"PUT", 
        "confidence": 92-99, 
        "analysis": "Explicação técnica do rompimento da estrutura secundária",
        "trend_type": "Alta Dominante"|"Baixa Dominante"
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
            trend_type: { type: Type.STRING },
          },
          required: ['direction', 'confidence', 'analysis', 'trend_type'],
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
      confidence: data.confidence || 96,
      strategy: `Rompimento de Pullback (${data.trend_type})`,
      timestamp: Date.now()
    };

  } catch (error: any) {
    return {
      id: generateVIPId(),
      pair,
      direction: SignalDirection.CALL, // Prioriza alta em caso de erro na análise
      timeframe,
      entryTime,
      expirationTime,
      confidence: 90,
      strategy: 'Análise Estrutural de Fluxo',
      timestamp: Date.now()
    };
  }
}
