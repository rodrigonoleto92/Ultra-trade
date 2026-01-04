
import { CurrencyPair, MarketType, Timeframe } from './types';

export const FOREX_PAIRS: CurrencyPair[] = [
  { symbol: 'EUR/USD', type: MarketType.FOREX },
  { symbol: 'GBP/USD', type: MarketType.FOREX },
  { symbol: 'USD/JPY', type: MarketType.FOREX },
  { symbol: 'AUD/USD', type: MarketType.FOREX },
  { symbol: 'USD/CAD', type: MarketType.FOREX },
  { symbol: 'EUR/GBP', type: MarketType.FOREX },
  { symbol: 'EUR/JPY', type: MarketType.FOREX },
  { symbol: 'GBP/JPY', type: MarketType.FOREX },
  { symbol: 'NZD/USD', type: MarketType.FOREX },
];

export const OTC_PAIRS: CurrencyPair[] = [
  { symbol: 'EUR/USD (OTC)', type: MarketType.OTC },
  { symbol: 'GBP/USD (OTC)', type: MarketType.OTC },
  { symbol: 'USD/JPY (OTC)', type: MarketType.OTC },
  { symbol: 'AUD/USD (OTC)', type: MarketType.OTC },
  { symbol: 'USD/CHF (OTC)', type: MarketType.OTC },
  { symbol: 'EUR/GBP (OTC)', type: MarketType.OTC },
];

export const ALL_PAIRS = [...FOREX_PAIRS, ...OTC_PAIRS];

export const TIMEFRAMES = [
  { label: 'M1', value: Timeframe.M1 },
  { label: 'M5', value: Timeframe.M5 },
  { label: 'M15', value: Timeframe.M15 },
];

/**
 * Para adicionar novas senhas, basta colocar uma vírgula dentro dos colchetes
 * e adicionar a nova senha entre aspas. 
 * Exemplo: ['usuario2026', 'acesso_temporario', 'vip_premium']
 */
export const APP_PASSWORDS = [
  'usuario2026', 
  'temp123', 
  'trade99'
];
