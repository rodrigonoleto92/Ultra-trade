
export enum MarketType {
  FOREX = 'Forex',
  OTC = 'OTC',
  CRYPTO = 'Crypto'
}

export enum SignalType {
  BINARY = 'OB',
  FOREX = 'FOREX / CRIPTO'
}

export enum SignalDirection {
  CALL = 'CALL',
  PUT = 'PUT'
}

export enum Timeframe {
  M1 = '1 Minuto',
  M5 = '5 Minutos',
  M15 = '15 Minutos',
  M30 = '30 Minutos',
  H1 = '1 Hora',
  H4 = '4 Horas',
  D1 = '1 Dia'
}

export interface Signal {
  id: string;
  pair: string;
  direction: SignalDirection;
  timeframe: Timeframe;
  type: SignalType;
  entryTime?: string;
  expirationTime?: string;
  entryPrice?: string;
  stopLoss?: string;
  takeProfit?: string;
  confidence: number;
  strategy: string;
  timestamp: number;
}

export interface CurrencyPair {
  symbol: string;
  type: MarketType;
}

// Added ChatMessage interface to fix the import error in components/GlobalChat.tsx
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text?: string;
  image?: string;
  timestamp: number;
  isStaff?: boolean;
}
