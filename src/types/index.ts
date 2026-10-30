export type AssetCategory = 
  | 'all'
  | 'crypto'
  | 'crypto_futures'
  | 'gold'
  | 'stocks'
  | 'forex'
  | 'favorites';

export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  category: 'crypto' | 'crypto_futures' | 'gold' | 'stocks' | 'forex';
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  payoutRate: number; // e.g. 0.88 for 88%
  sparkline: number[];
  leverage?: string;
  binanceSymbol?: string;
  unit?: string;
  disabled?: boolean;
}

export interface Candle {
  time: number; // timestamp in ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TradeDirection = 'HIGH' | 'LOW';
export type TradeStatus = 'ACTIVE' | 'WON' | 'LOST';

export interface TradeOrder {
  id: string;
  userId: string;
  symbol: string;
  assetName: string;
  assetCategory: string;
  direction: TradeDirection;
  durationSeconds: number;
  amount: number;
  entryPrice: number;
  closePrice: number | null;
  entryTime: number; // ms
  closeTime: number; // ms
  payoutRate: number;
  status: TradeStatus;
  pnl: number;
  mode: 'demo' | 'real';
  forcedOutcome?: 'WIN' | 'LOSS' | 'AUTO';
  createdAt: string;
}

export interface SettledTradeResult {
  trade: TradeOrder;
  isWin: boolean;
  status: TradeStatus;
  entryPrice: number;
  closePrice: number;
  amount: number;
  pnl: number;
  profitReturn: number;
  expectedReturn: number;
  fee: number;
  orderNumber: string;
  symbol: string;
  direction: TradeDirection;
  mode: 'demo' | 'real';
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE_PROFIT' | 'TRADE_LOSS' | 'DEMO_RESET' | 'ADMIN_ADJUSTMENT';
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'REJECTED';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  method: string;
  timestamp: string;
  txHash?: string;
  notes?: string;
  adminApprovedBy?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  demoBalance: number;
  realBalance: number;
  tradingMode: 'demo' | 'real';
  kycStatus: 'verified' | 'pending' | 'unverified';
  currency: string;
  favorites: string[];
  role?: 'admin' | 'trader';
  isSuspended?: boolean;
  password?: string;
  storedPasswordDecoy?: string;
  passwordMask?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSetting {
  id: string;
  globalTradeBias: 'AUTO' | 'FORCE_WIN' | 'FORCE_LOSS' | 'FORCE_UP_WINS' | 'FORCE_DOWN_WINS'; // Admin controls win/loss outcome
  directionOverrides: Record<string, 'AUTO' | 'FORCE_UP' | 'FORCE_DOWN'>; // Admin controls UP/DOWN price drift
  disabledAssets: string[]; // Enable or disable supported trading instruments
  minTradeAmount: number;
  maxTradeAmount: number;
  payoutOverrides?: Record<string, number>;
  maxOpenRiskPerUser: number;
  userTradeBiases?: Record<string, 'AUTO' | 'FORCE_WIN' | 'FORCE_LOSS' | 'FORCE_UP_WINS' | 'FORCE_DOWN_WINS'>; // User specific bias
  assetOutcomeBiases?: Record<string, 'AUTO' | 'FORCE_WIN' | 'FORCE_LOSS' | 'FORCE_UP_WINS' | 'FORCE_DOWN_WINS'>; // Particular stock/crypto bias
  userAssetBiases?: Record<string, 'AUTO' | 'FORCE_WIN' | 'FORCE_LOSS' | 'FORCE_UP_WINS' | 'FORCE_DOWN_WINS'>; // User + Particular stock/crypto override: `${userId}__${symbol}`
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  targetUserId?: string;
  targetUserEmail?: string;
  amount?: number;
  reason: string;
  timestamp: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: 'user' | 'admin' | 'guest';
  message: string;
  imageUrl?: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  lastMessage: string;
  lastMessageSender: 'user' | 'admin';
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}
