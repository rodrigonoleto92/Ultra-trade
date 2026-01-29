
import { CurrencyPair, MarketType, Timeframe } from './types';

// CONTROLE DE SEGURANÇA GLOBAL
// Altere este valor para desconectar TODOS os usuários ativos instantaneamente
export const SECURITY_VERSION = 'v12.1.2'; 

export const FOREX_PAIRS: CurrencyPair[] = [
  { symbol: 'XAU/USD', type: MarketType.FOREX },
  { symbol: 'EUR/USD', type: MarketType.FOREX },
  { symbol: 'GBP/USD', type: MarketType.FOREX },
  { symbol: 'USD/JPY', type: MarketType.FOREX },
  { symbol: 'AUD/USD', type: MarketType.FOREX },
  { symbol: 'USD/CAD', type: MarketType.FOREX },
  { symbol: 'EUR/GBP', type: MarketType.FOREX },
  { symbol: 'EUR/JPY', type: MarketType.FOREX },
  { symbol: 'GBP/JPY', type: MarketType.FOREX },
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
  { symbol: 'IDX/USD', type: MarketType.CRYPTO },
  { symbol: 'MEMX/USD', type: MarketType.CRYPTO },
  { symbol: 'BNB/USD', type: MarketType.CRYPTO },
];

export const ALL_PAIRS = [...FOREX_PAIRS, ...OTC_PAIRS, ...CRYPTO_PAIRS];

export const BINARY_TIMEFRAMES = [
  { label: 'M1', value: Timeframe.M1 },
  { label: 'M5', value: Timeframe.M5 },
  { label: 'M15', value: Timeframe.M15 },
];

export const FOREX_TIMEFRAMES = [
  { label: 'M1', value: Timeframe.M1 },
  { label: 'M5', value: Timeframe.M5 },
  { label: 'M15', value: Timeframe.M15 },
  { label: 'M30', value: Timeframe.M30 },
  { label: '1H', value: Timeframe.H1 },
  { label: '4H', value: Timeframe.H4 },
  { label: '1D', value: Timeframe.D1 },
];

export const TIMEFRAMES = BINARY_TIMEFRAMES;

export const REMOTE_PASSWORDS_URL = 'https://raw.githubusercontent.com/seu-usuario/seu-repositorio/main/senhas.txt';

// Estrutura de chaves com nomes associados
// Se você remover alguém daqui, ele perde o acesso na hora.
export const APP_USERS = [
  { key: 'ruan_vitalicio', name: 'Ruan' },
  { key: 'teste_141', name: 'Usuário Teste' },
  { key: 'admin_1992', name: 'Rodrigo' },
  { key: 'duda2102', name: 'WALLACE' },
];

export const APP_PASSWORDS = APP_USERS.map(u => u.key);
