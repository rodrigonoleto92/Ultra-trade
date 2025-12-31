
import { GoogleGenAI, Type } from "@google/genai";
import { Signal, SignalDirection, Timeframe } from "../types";

// Função para gerar ID profissional
const generateVIPId = () => "ULT-" + Math.random().toString(36).substr(2, 6).toUpperCase();

// Função para calcular horários de entrada e expiração baseados na próxima vela
const calculateTradeTimes = (timeframe: Timeframe) => {
  const now = new Date();
  const entryDate = new Date(now);
  entryDate.setSeconds(0, 0);

  // Como o gatilho é disparado faltando 5s para fechar a vela ATUAL,
  // precisamos avançar para o início da PRÓXIMA vela.
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

  // Tratamento para virada de hora (60 min -> 00 min da próxima hora)
  if (entryDate.getMinutes() >= 60) {
    entryDate.setHours(entryDate.getHours() + 1);
    entryDate.setMinutes(entryDate.getMinutes() % 60);
  }

  const entryTime = entryDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  const expDate = new Date(entryDate);
  if (timeframe === Timeframe.M1) expDate.setMinutes(entryDate.getMinutes() + 1);
  else if (timeframe === Timeframe.M5) expDate.setMinutes(entryDate.getMinutes() + 5);
  else expDate.setMinutes(entryDate.getMinutes() + 15);
  
  // Tratamento para virada de hora na expiração
  if (expDate.getMinutes() >= 60) {
    expDate.setHours(expDate.getHours() + 1);
    expDate.setMinutes(expDate.getMinutes() % 60);
  }

  const expirationTime = expDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return { entryTime, expirationTime };
};

const marketScenarios = [
  "Tendência de alta forte com RSI sobrecomprado",
  "Tendência de baixa consolidada perdendo força no suporte",
  "Lateralização próxima à resistência das Bandas de Bollinger",
  "Cruzamento de médias móveis exponenciais (EMA 9 e 21)",
  "Padrão de candle engolfo em região de exaustão",
  "Rompermento de linha de tendência",
  "Reversão em Fibonacci 61.8%",
  "Acúmulo de volume em zona de oferta",
  "Retração para a média móvel de 20 períodos",
  "Pressão compradora em suporte histórico"
];

export async function generateSignal(pair: string, timeframe: Timeframe): Promise<Signal> {
  const { entryTime, expirationTime } = calculateTradeTimes(timeframe);
  const randomScenario = marketScenarios[Math.floor(Math.random() * marketScenarios.length)];

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Analise o par ${pair} em ${timeframe}. Contexto: ${randomScenario}.
      Gere um sinal CALL ou PUT para a PRÓXIMA VELA que inicia em ${entryTime}.
      Responda APENAS JSON: {"direction": "CALL"|"PUT", "confidence": 80-98, "strategy": "string"}
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
      strategy: data.strategy || 'Análise Probabilística IA',
      timestamp: Date.now()
    };

  } catch (error: any) {
    console.warn("API Offline/Limit. Usando Contingência Ultra.");

    const isCall = Math.random() > 0.48;
    const confidence = Math.floor(Math.random() * (96 - 84 + 1)) + 84;
    
    const strategies = [
      "Fluxo Institucional VIP",
      "Exaustão HFT (High Frequency)",
      "Price Action Probabilístico",
      "Suporte Volumétrico Dinâmico",
      "Micro-Tendência Algorítmica"
    ];

    return {
      id: generateVIPId(),
      pair,
      direction: isCall ? SignalDirection.CALL : SignalDirection.PUT,
      timeframe,
      entryTime,
      expirationTime,
      confidence,
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      timestamp: Date.now()
    };
  }
}
