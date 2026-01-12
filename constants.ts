
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

export const CRYPTO_PAIRS: CurrencyPair[] = [
  { symbol: 'BTC/USD', type: MarketType.CRYPTO },
  { symbol: 'ETH/USD', type: MarketType.CRYPTO },
  { symbol: 'SOL/USD', type: MarketType.CRYPTO },
  { symbol: 'XRP/USD', type: MarketType.CRYPTO },
  { symbol: 'ADA/USD', type: MarketType.CRYPTO },
];

export const ALL_PAIRS = [...FOREX_PAIRS, ...OTC_PAIRS, ...CRYPTO_PAIRS];

export const TIMEFRAMES = [
  { label: 'M1', value: Timeframe.M1 },
  { label: 'M5', value: Timeframe.M5 },
  { label: 'M15', value: Timeframe.M15 },
];

// Configuração de verificação de licença externa
export const REMOTE_PASSWORDS_URL = 'https://raw.githubusercontent.com/seu-usuario/seu-repositorio/main/senhas.txt';

// Senhas administrativas permanentes
export const APP_PASSWORDS = [
  'ruan_vitalicio', 
  'suporte_vip',
  'admin_1992'
];
