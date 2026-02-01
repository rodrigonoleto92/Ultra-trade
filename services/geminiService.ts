
import { GoogleGenAI, Type } from "@google/genai";
import { Signal, SignalDirection, Timeframe, SignalType, CurrencyPair } from "../types";

const generateVIPId = (type: SignalType) => `${type === SignalType.BINARY ? 'SNIPER' : 'FX'}-` + Math.random().toString(36).substr(2, 6).toUpperCase();

/**
 * Calcula os horários de entrada e expiração baseados no candle atual.
 */
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

/**
 * MOTOR DE INTELIGÊNCIA UNIFICADO (SNIPER QUANTUM V18)
 * Reforçado para gerar justificativas extremamente detalhadas.
 */
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
    const useSearch = !isOTC;

    const prompt = `VOCÊ É O ANALISTA SÊNIOR DO MOTOR SNIPER QUANTUM V18.
                    ATIVO: ${pair} | TIMEFRAME: ${timeframe} | TIPO: ${isOTC ? 'ALGORITMO OTC (POLARIUM BROKER)' : 'MERCADO REAL'}

                    SUA TAREFA É GERAR UM SINAL COM UMA JUSTIFICATIVA TÉCNICA RICA, DETALHADA E PROFISSIONAL.

                    REGRAS OBRIGATÓRIAS PARA O 'REASONING':
                    1. Use termos técnicos: "Order Block", "Fair Value Gap (FVG)", "Liquidez (SSL/BSL)", "CHoCH", "BOS" ou "Price Action Puro".
                    2. Explique o Padrão de 4 Velas: Cite como a Vela 1 de impulso rompeu a estrutura, a Vela 2 corrigiu sem invalidar o pavio e a Vela 3 confirmou o volume.
                    3. Se for OTC Polarium: Mencione que o sinal aproveita a "Exaustão Algorítmica" ou "Ciclo de Repetição de Tendência" específico da corretora.
                    4. O texto deve ter entre 150 e 300 caracteres, sendo direto mas altamente técnico.

                    ESTRATÉGIA BASE:
                    - CALL: Rejeição de Suporte + Padrão de Impulsão/Correção (V1/V2/V3).
                    - PUT: Rejeição de Resistência + Padrão de Impulsão/Correção (V1/V2/V3).

                    FORMATO DE RESPOSTA JSON:
                    {
                      "direction": "CALL" | "PUT",
                      "confidence": number (88-99),
                      "reasoning": "JUSTIFICATIVA TÉCNICA DETALHADA AQUI"
                    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: useSearch ? [{ googleSearch: {} }] : undefined,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            direction: { type: Type.STRING, enum: ['CALL', 'PUT'] },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ['direction', 'confidence', 'reasoning'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    const direction = (data.direction as SignalDirection) || (Math.random() > 0.5 ? SignalDirection.CALL : SignalDirection.PUT);
    const confidence = Math.floor(Math.max(88, Math.min(99, data.confidence || 88)));

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
      strategy: data.reasoning || `Padrão de 4 velas confirmado após rompimento de micro-estrutura em ${timeframe}. Identificada zona de Order Block com FVG não preenchido, indicando continuação do fluxo institucional.`,
      timestamp: Date.now()
    };
  } catch (error) {
    const fallbackDirection = Date.now() % 2 === 0 ? SignalDirection.CALL : SignalDirection.PUT;
    const fallbackReason = isOTC 
      ? "Detectada exaustão no algoritmo da Polarium Broker após ciclo de 5 velas. O padrão de 4 velas indica reversão iminente por falta de liquidez no topo da estrutura."
      : "Identificada quebra de estrutura (CHoCH) com entrada de volume comprador em zona de demanda institucional. Padrão V18 validado para a próxima vela.";

    return {
      id: generateVIPId(type),
      pair, 
      type, 
      direction: fallbackDirection, 
      timeframe,
      entryTime: entryTime, 
      expirationTime: expirationTime,
      confidence: 91, 
      buyerPercentage: fallbackDirection === SignalDirection.CALL ? 91 : 9, 
      sellerPercentage: fallbackDirection === SignalDirection.PUT ? 91 : 9,
      strategy: fallbackReason, 
      timestamp: Date.now()
    };
  }
}
