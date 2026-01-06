
export enum MarketType {
  FOREX = 'Forex',
  OTC = 'OTC',
  CRYPTO_OTC = 'Crypto OTC'
}

export enum SignalDirection {
  CALL = 'CALL',
  PUT = 'PUT'
}

export enum Timeframe {
  M1 = '1 Minuto',
  M5 = '5 Minutos',
  M15 = '15 Minutos'
}

export interface Signal {
  id: string;
  pair: string;
  direction: SignalDirection;
  timeframe: Timeframe;
  entryTime: string;
  expirationTime: string;
  confidence: number;
  strategy: string;
  timestamp: number;
}

export interface CurrencyPair {
  symbol: string;
  type: MarketType;
}
