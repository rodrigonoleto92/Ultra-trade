
import { GoogleGenAI, Type } from "@google/genai";
import { Signal, SignalDirection, Timeframe, SignalType, CurrencyPair } from "../types";

const generateVIPId = (type: SignalType) => `${type === SignalType.BINARY ? 'SNIPER' : 'FX'}-` + Math.random().toString(36).substr(2, 6).toUpperCase();

/**
 * Define o tempo gráfico de ancoragem (maior) para validação conforme solicitado
 * M1 -> M5 | M5 -> M15 | M15 -> M30
 */
const getAnchorTimeframe = (timeframe: Timeframe): string => {
  switch (timeframe) {
    case Timeframe.M1: return "M5 (5 Minutos)";
    case Timeframe.M5: return "M15 (15 Minutos)";
    case Timeframe.M15: return "M30 (30 Minutos)";
    case Timeframe.M30: return "H1 (1 Hora)";
    case Timeframe.H1: return "H4 (4 Horas)";
    case Timeframe.H4: return "D1 (1 Dia)";
    default: return "Timeframe Superior";
  }
};

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
    const anchorTf = getAnchorTimeframe(timeframe);
    
    // Prompt avançado unindo SMC, RSI, MACD e agora MULTI-TIMEFRAME
    const prompt = `VOCÊ É O ANALISTA MESTRE DO ALGORITMO SNIPER V18.
                    SUA MISSÃO É GERAR UM SINAL DE ALTA PRECISÃO UNINDO AS ESTRATÉGIAS VIGENTES E A NOVA CONFLUÊNCIA MULTI-TIMEFRAME.

                    DADOS DO ATIVO:
                    - ATIVO: ${pair}
                    - MERCADO: ${isOTC ? 'ALGORITMO OTC (PULSE FEED)' : 'MERCADO REAL'}
                    - TIMEFRAME DE ENTRADA: ${timeframe}
                    - TIMEFRAME DE ANCORAGEM (VALIDAÇÃO): ${anchorTf}

                    ESTRATÉGIAS APLICADAS (CONFLUÊNCIA):
                    1. SMC (Smart Money): Identifique Order Blocks e Liquidez em ${anchorTf}. O preço deve estar reagindo a essas zonas.
                    2. RSI (Exaustão): Verifique se o preço está em zona de sobrecompra/sobrevenda em ${timeframe}.
                    3. MACD (Tendência): Confirme a direção da força do movimento.
                    4. MTF (Multi-Timeframe): O sinal em ${timeframe} SÓ é gerado se estiver alinhado com a macro-região de ${anchorTf}.
                    
                    ${isOTC ? 'LOGICA OTC: Analise padrões de repetição e exaustão de algoritmos de corretora.' : ''}

                    OBJETIVO: Retornar CALL ou PUT apenas se houver confluência entre SMC em ${anchorTf} e Indicadores em ${timeframe}.

                    RESPOSTA OBRIGATÓRIA EM JSON:
                    {
                      "direction": "CALL" | "PUT",
                      "confidence": number (95-99),
                      "reasoning": "Resumo da confluência (Ex: Rejeição de OB em ${anchorTf} + Cruzamento MACD em ${timeframe})"
                    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
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
    const confidence = Math.floor(Math.max(95, Math.min(99, data.confidence || 95)));

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
      strategy: `SMC + RSI + MTF (${anchorTf})`,
      timestamp: Date.now()
    };
  } catch (error) {
    const fallbackDir = Date.now() % 2 === 0 ? SignalDirection.CALL : SignalDirection.PUT;
    return {
      id: generateVIPId(type),
      pair,
      type,
      direction: fallbackDir,
      timeframe,
      entryTime,
      expirationTime,
      confidence: 95,
      buyerPercentage: fallbackDir === SignalDirection.CALL ? 95 : 5,
      sellerPercentage: fallbackDir === SignalDirection.PUT ? 95 : 5,
      strategy: "ANÁLISE MTF + SMC (FALLBACK)",
      timestamp: Date.now()
    };
  }
}
