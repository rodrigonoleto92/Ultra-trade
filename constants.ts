
import { CurrencyPair, MarketType, Timeframe } from './types';

// CONTROLE DE SEGURANÇA E SESSÃO GLOBAL
export const SECURITY_VERSION = 'v12.1.3'; 
export const SESSION_VERSION = '1.0.4'; // Incremente este número para deslogar todos os usuários

export const FOREX_PAIRS: CurrencyPair[] = [
  { symbol: 'XAU/USD', type: MarketType.FOREX },
  { symbol: 'EUR/USD', type: MarketType.FOREX },
  { symbol: 'GBP/USD', type: MarketType.FOREX },
  { symbol: 'USD/JPY', type: MarketType.FOREX },
  { symbol: 'NZD/CAD', type: MarketType.FOREX },
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
  { symbol: 'EUR/JPY (OTC)', type: MarketType.OTC },
  { symbol: 'AUD/CAD (OTC)', type: MarketType.OTC },
  { symbol: 'NZD/CAD (OTC)', type: MarketType.OTC },
  { symbol: 'EUR/AUD (OTC)', type: MarketType.OTC },
  { symbol: 'EUR/CAD (OTC)', type: MarketType.OTC },
  { symbol: 'AUD/JPY (OTC)', type: MarketType.OTC },
  { symbol: 'USD/BRL (OTC)', type: MarketType.OTC },
  { symbol: 'USD/COP (OTC)', type: MarketType.OTC },
  { symbol: 'XAU/USD (OTC)', type: MarketType.OTC },
  { symbol: 'Gás Natural (OTC)', type: MarketType.OTC },
  { symbol: 'Coca Cola (OTC)', type: MarketType.OTC },
  { symbol: 'AUS 200 (OTC)', type: MarketType.OTC },
  { symbol: 'GER 30 (OTC)', type: MarketType.OTC },
  { symbol: 'US 30 (OTC)', type: MarketType.OTC },
  { symbol: 'SUI (OTC)', type: MarketType.OTC },
  { symbol: 'ONDO (OTC)', type: MarketType.OTC },
  { symbol: 'US500 (OTC)', type: MarketType.OTC },
  { symbol: 'Tesla (OTC)', type: MarketType.OTC },
  { symbol: 'Apple (OTC)', type: MarketType.OTC },
  { symbol: 'Netflix (OTC)', type: MarketType.OTC },
  { symbol: 'Amazon (OTC)', type: MarketType.OTC },
  { symbol: 'Intel (OTC)', type: MarketType.OTC },
  { symbol: 'McDonald\'s (OTC)', type: MarketType.OTC },
  { symbol: 'Meta (OTC)', type: MarketType.OTC },
  { symbol: 'JP Morgan (OTC)', type: MarketType.OTC },
  { symbol: 'Nike (OTC)', type: MarketType.OTC },
  { symbol: 'Google (OTC)', type: MarketType.OTC },
  { symbol: 'Jp 225 (OTC)', type: MarketType.OTC },
  { symbol: 'Sandbox (OTC)', type: MarketType.OTC },
  { symbol: 'Bonk (OTC)', type: MarketType.OTC },
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

// vencimentos 01/02/2027
//Wallace, Eduardo, Tobias

export const REMOTE_PASSWORDS_URL = 'https://raw.githubusercontent.com/seu-usuario/seu-repositorio/main/senhas.txt';

export const APP_USERS = [
  { key: 'admin_92', name: 'Rodrigo' },
  { key: 'ruan_vitalicio', name: 'Ruan' },
  { key: 'duda2102', name: 'WALLACE' },
  { key: '03silva#', name: 'Eduardo' },
  { key: 'teste_150', name: 'teste' },
  { key: '92230241', name: 'Tobias' },
];

export const APP_PASSWORDS = APP_USERS.map(u => u.key);
