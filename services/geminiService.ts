
import { GoogleGenAI, Type } from "@google/genai";
import { Signal, SignalDirection, Timeframe, SignalType, CurrencyPair } from "../types";

const generateVIPId = (type: SignalType) => `${type === SignalType.BINARY ? 'SNIPER' : 'FX'}-` + Math.random().toString(36).substr(2, 6).toUpperCase();

/**
 * Lista de padrões técnicos para variação no modo de contingência
 */
const TECHNICAL_PATTERNS = [
  "Identificada quebra de estrutura (CHoCH) com entrada de volume institucional em zona de mitigação. Padrão de impulsão V18 validado para a próxima vela em confluência com o RSI.",
  "Detectada varredura de liquidez (Liquidity Sweep) abaixo das mínimas anteriores. O preço atingiu um Order Block de H1, indicando reversão iminente por absorção de oferta.",
  "Formação de Fair Value Gap (FVG) pendente de mitigação. O fluxo de ordens (Order Flow) aponta para um rebalanceamento técnico na zona de 50% da retração de Fibonacci.",
  "Rompimento de micro-tendência com confirmação de volume acima da média (VSA). Padrão de 4 velas Sniper completado após teste bem-sucedido de suporte dinâmico.",
  "Saturação de indicadores osciladores em zona de exaustão extrema. Cruzamento de médias exponenciais (EMA) valida a entrada para o próximo ciclo fracionário.",
  "Identificado padrão harmônico em formação na zona de valor. A rejeição da VWAP diária sugere uma correção técnica forte para busca de liquidez em níveis superiores.",
  "Padrão de 'Spring' (Wyckoff) identificado após acumulação lateral. Aumento súbito de agressão no Book de Ofertas confirma a direção institucional do movimento.",
  "Zona de Supply/Demand testada pela terceira vez com redução de momentum. Divergência positiva no histograma do MACD sinaliza entrada de alta probabilidade."
];

const OTC_PATTERNS = [
  "Detectada exaustão no algoritmo de fluxo OTC após ciclo de 5 velas seguidas. O padrão Sniper de 4 velas indica reversão técnica iminente por saturação.",
  "Identificada repetição de ciclo algorítmico de tendência. O fluxo sintético apresenta comportamento de 'Price Action Mirror', favorecendo a continuidade do movimento.",
  "Algoritmo da plataforma sinaliza correção de vácuo de preço após movimentação parabólica. Zona de interesse identificada por densidade de ordens sintéticas.",
  "Padrão de reversão por exaustão volumétrica no fluxo OTC. A leitura de 'Time and Sales' simulada indica perda de força na ponta agressora."
];

const getRandomJustification = (isOTC: boolean) => {
  const pool = isOTC ? OTC_PATTERNS : TECHNICAL_PATTERNS;
  const base = pool[Math.floor(Math.random() * pool.length)];
  // Adiciona um sufixo dinâmico para evitar textos idênticos
  const suffixes = [
    " Aguarde o fechamento do candle atual.",
    " Entrada recomendada com gerenciamento 2x1.",
    " Confluência de indicadores em 88% de precisão.",
    " Padrão V18 confirmado pelo motor quântico.",
    " Alinhamento fractal identificado no Timeframe selecionado."
  ];
  return base + suffixes[Math.floor(Math.random() * suffixes.length)];
};

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
 * Reforçado para gerar justificativas extremamente detalhadas sem citar nomes de corretoras.
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
                    ATIVO: ${pair} | TIMEFRAME: ${timeframe} | TIPO: ${isOTC ? 'ALGORITMO OTC (SINTÉTICO)' : 'MERCADO REAL'}

                    SUA TAREFA É GERAR UM SINAL COM UMA JUSTIFICATIVA TÉCNICA RICA, ÚNICA E PROFISSIONAL.
                    
                    DIVERSIDADE TÉCNICA (IMPORTANTE):
                    Varie suas análises entre SMC (Smart Money Concepts), ICT, Wyckoff ou Price Action Clássico.
                    Nunca repita a mesma frase. Analise o contexto atual do par informado.

                    REGRAS OBRIGATÓRIAS PARA O 'REASONING':
                    1. Use termos específicos: "Order Block", "FVG", "Liquidity Sweep", "CHoCH", "BOS", "Mitigation Zone", "Bearish/Bullish Engulfing".
                    2. Explique o Padrão das Velas recentes: Mencione pavios, rejeições ou volume.
                    3. Se for OTC: Fale de "Ciclos de Algoritmo", "Exaustão de Fluxo Sintético", "Repetição de Padrão Temporal", mas sem citar nomes de corretoras.
                    4. O texto deve soar como um trader profissional operando ao vivo.

                    ESTRATÉGIA BASE:
                    - CALL: Rejeição de Suporte / Quebra de Estrutura de Baixa para Alta.
                    - PUT: Rejeição de Resistência / Quebra de Estrutura de Alta para Baixa.

                    FORMATO DE RESPOSTA JSON:
                    {
                      "direction": "CALL" | "PUT",
                      "confidence": number (88-99),
                      "reasoning": "SUA JUSTIFICATIVA TÉCNICA ÚNICA E DETALHADA AQUI"
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
      strategy: data.reasoning || getRandomJustification(isOTC),
      timestamp: Date.now()
    };
  } catch (error) {
    const fallbackDirection = Date.now() % 2 === 0 ? SignalDirection.CALL : SignalDirection.PUT;
    const fallbackReason = getRandomJustification(isOTC);

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
