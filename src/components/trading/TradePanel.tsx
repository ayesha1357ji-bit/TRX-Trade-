import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMarketData } from '../../context/MarketDataContext';
import { TradeDirection, TradeStatus, SettledTradeResult } from '../../types';
import { TradeResultModal } from './TradeResultModal';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ShieldAlert,
  Percent,
  Check,
  ShieldCheck,
} from 'lucide-react';

export interface DurationTier {
  label: string;
  name: string;
  seconds: number;
  profitPercent: number; // 15, 20, 30, 40, 50, 60
  profitRate: number;    // 0.15, 0.20, 0.30, 0.40, 0.50, 0.60
  minAmount: number;     // 500, 8000, 50000, 200000, 500000, 1000000
  formattedMin: string;
}

export const DURATION_TIERS: DurationTier[] = [
  {
    label: '30s',
    name: '30 Seconds',
    seconds: 30,
    profitPercent: 15,
    profitRate: 0.15,
    minAmount: 500,
    formattedMin: '$500',
  },
  {
    label: '60s',
    name: '60 Seconds (1m)',
    seconds: 60,
    profitPercent: 20,
    profitRate: 0.20,
    minAmount: 8000,
    formattedMin: '$8,000',
  },
  {
    label: '120s',
    name: '120 Seconds (2m)',
    seconds: 120,
    profitPercent: 30,
    profitRate: 0.30,
    minAmount: 50000,
    formattedMin: '$50,000',
  },
  {
    label: '3m',
    name: '3 Minutes',
    seconds: 180,
    profitPercent: 40,
    profitRate: 0.40,
    minAmount: 200000,
    formattedMin: '$200,000',
  },
  {
    label: '4m',
    name: '4 Minutes',
    seconds: 240,
    profitPercent: 50,
    profitRate: 0.50,
    minAmount: 500000,
    formattedMin: '$500,000',
  },
  {
    label: '5m',
    name: '5 Minutes',
    seconds: 300,
    profitPercent: 60,
    profitRate: 0.60,
    minAmount: 1000000,
    formattedMin: '$1,000,000',
  },
];

const PRESET_TIER_AMOUNTS = [500, 8000, 50000, 200000, 500000, 1000000];

interface TradePanelProps {
  openAuthModal: () => void;
  openDepositModal: () => void;
}

export const TradePanel: React.FC<TradePanelProps> = ({
  openAuthModal,
  openDepositModal,
}) => {
  const { currentUser, userProfile, tradingMode, placeTrade, settleTrade, activeTrades } = useAuth();
  const { selectedAsset } = useMarketData();

  // Selected duration defaults to 30s
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [tradeAmountInput, setTradeAmountInput] = useState<string>('500');
  const tradeAmount = Number(tradeAmountInput) || 0;
  const [executing, setExecuting] = useState(false);
  const [settledModalResult, setSettledModalResult] = useState<SettledTradeResult | null>(null);
  const [lastResult, setLastResult] = useState<{
    status: TradeStatus;
    pnl: number;
    symbol: string;
    direction: string;
    entryPrice: number;
    closePrice: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const balance =
    tradingMode === 'demo' ? (userProfile?.demoBalance ?? 1000000) : (userProfile?.realBalance ?? 0);

  // Active duration tier details
  const currentTier = useMemo(() => {
    return DURATION_TIERS.find((t) => t.seconds === selectedDuration) || DURATION_TIERS[0];
  }, [selectedDuration]);

  const payoutRate = currentTier.profitRate;
  const estimatedProfit = tradeAmount * payoutRate;
  const totalPayout = tradeAmount + estimatedProfit;

  // Amount input handler ensuring backspacing clears completely and typing never prefixes 0
  const handleAmountInputChange = (val: string) => {
    if (val === '') {
      setTradeAmountInput('');
      setErrorMsg(null);
      return;
    }
    // Only allow numbers and at most one decimal point
    let clean = val.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) {
      clean = parts[0] + '.' + parts.slice(1).join('');
    }
    // If user enters digits after a zero (e.g. "05"), strip the leading zero so it starts cleanly
    if (/^0\d+/.test(clean)) {
      clean = clean.replace(/^0+/, '');
    }
    setTradeAmountInput(clean);
    setErrorMsg(null);
  };

  // When clicking a duration node, also automatically ensure the trade amount meets the new tier's minimum
  const handleSelectDuration = (tier: DurationTier) => {
    setSelectedDuration(tier.seconds);
    setErrorMsg(null);
    if (tradeAmount < tier.minAmount) {
      setTradeAmountInput(String(tier.minAmount));
    }
  };

  // Active trades monitor for automatic settlement upon expiry
  useEffect(() => {
    let isCancelled = false;
    const timer = setInterval(async () => {
      const now = Date.now();
      for (const trade of activeTrades) {
        if (now >= trade.closeTime && trade.status === 'ACTIVE') {
          const result = await settleTrade(trade.id, selectedAsset.price);
          if (result && !isCancelled) {
            setSettledModalResult(result);
            setLastResult({
              status: result.status,
              pnl: result.pnl,
              symbol: result.symbol,
              direction: result.direction,
              entryPrice: result.entryPrice,
              closePrice: result.closePrice,
            });
            setTimeout(() => {
              if (!isCancelled) setLastResult(null);
            }, 7000);
          }
        }
      }
    }, 500);

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [activeTrades, selectedAsset.price, settleTrade]);

  const handlePlaceOrder = async (direction: TradeDirection) => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    // Enforce tier minimum requirement
    if (tradeAmount < currentTier.minAmount) {
      setErrorMsg(
        `Minimum investment for ${currentTier.label} contract is $${currentTier.minAmount.toLocaleString()} USD.`
      );
      return;
    }

    if (tradeAmount > balance) {
      setErrorMsg(
        tradingMode === 'demo'
          ? 'Demo balance depleted. Click the reset arrow in the navigation bar to replenish.'
          : 'Insufficient live balance. Please fund your account with USDT or cryptocurrency to execute this order.'
      );
      if (tradingMode === 'real') {
        openDepositModal();
      }
      return;
    }

    try {
      setExecuting(true);
      setErrorMsg(null);
      await placeTrade({
        symbol: selectedAsset.symbol,
        assetName: selectedAsset.name,
        assetCategory: selectedAsset.category,
        direction,
        durationSeconds: currentTier.seconds,
        amount: tradeAmount,
        entryPrice: selectedAsset.price,
        payoutRate: currentTier.profitRate,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to execute order');
    } finally {
      setExecuting(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setTradeAmountInput(String(amount));
    setErrorMsg(null);
  };

  const setAmountPercent = (percent: number) => {
    const val = Math.floor((balance * percent) / 100);
    setTradeAmountInput(String(Math.max(currentTier.minAmount, val)));
    setErrorMsg(null);
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-5 text-slate-900">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Order Terminal</span>
          <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
            <span>High / Low Contract</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-mono border border-blue-200 font-black">
              +{currentTier.profitPercent}% Return
            </span>
          </h3>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-500 block font-mono">
            {!currentUser ? 'ACCOUNT REQUIRED' : tradingMode === 'demo' ? 'DEMO CAPITAL' : 'LIVE CAPITAL'}
          </span>
          <span className="text-sm font-black font-mono text-blue-600">
            {!currentUser ? '$0.00 USD' : `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </span>
        </div>
      </div>

      {/* Trade Result Toast */}
      {lastResult && (
        <div
          className={`mb-3 p-3 rounded-xl border text-xs animate-in zoom-in-95 duration-200 ${
            lastResult.status === 'WON'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center justify-between font-bold mb-1">
            <span className="flex items-center gap-1.5">
              {lastResult.status === 'WON' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>Contract Settled: {lastResult.status}</span>
            </span>
            <span className="font-mono text-sm font-black">
              {lastResult.status === 'WON' ? `+$${lastResult.pnl.toFixed(2)}` : `-$${Math.abs(lastResult.pnl).toFixed(2)}`}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>
              {lastResult.symbol} ({lastResult.direction})
            </span>
            <span>
              Entry: ${lastResult.entryPrice.toFixed(2)} → Exit: ${lastResult.closePrice.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Contract Duration Selection (30s, 60s, 120s, 3m, 4m, 5m Nodes) */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Contract Duration Nodes</span>
          </label>
          <span className="text-[11px] font-mono text-blue-600 font-bold">
            {currentTier.label} • +{currentTier.profitPercent}% Profit
          </span>
        </div>

        {/* 6 Grid Nodes: 30s, 60s, 120s, 3m, 4m, 5m */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {DURATION_TIERS.map((tier) => {
            const isSelected = selectedDuration === tier.seconds;
            return (
              <button
                key={tier.seconds}
                type="button"
                onClick={() => handleSelectDuration(tier)}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <span className="text-xs font-black font-mono leading-tight">{tier.label}</span>
                <span
                  className={`text-[10px] font-black font-mono leading-tight ${
                    isSelected ? 'text-blue-100' : 'text-blue-600'
                  }`}
                >
                  +{tier.profitPercent}%
                </span>
                <span
                  className={`text-[9px] font-mono leading-tight ${
                    isSelected ? 'text-blue-200' : 'text-slate-500'
                  }`}
                >
                  Min {tier.formattedMin}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Tier Specification Card (Shows exact Min Amount & Profit Rate for selected sec) */}
      <div className="mb-3 p-2.5 sm:p-3 rounded-xl bg-blue-50/90 border border-blue-200/90 flex flex-col gap-1.5 text-xs font-sans">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Selected Node: <strong className="text-blue-700">{currentTier.name}</strong></span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-black">
            +{currentTier.profitPercent}% Profit
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/60 font-mono text-[11px]">
          <div>
            <span className="text-slate-500 block text-[10px]">Tier Minimum Required:</span>
            <span className="font-black text-slate-900">{currentTier.formattedMin} USD</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[10px]">Guaranteed Return Rate:</span>
            <span className="font-black text-blue-700">+{currentTier.profitPercent}% Payout</span>
          </div>
        </div>

        {tradeAmount < currentTier.minAmount && (
          <div className="mt-1 flex items-center justify-between p-1.5 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-900 text-[11px] font-sans">
            <span>Amount is below tier minimum ({currentTier.formattedMin}).</span>
            <button
              type="button"
              onClick={() => {
                setTradeAmountInput(String(currentTier.minAmount));
                setErrorMsg(null);
              }}
              className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black hover:bg-blue-700 cursor-pointer"
            >
              Set to {currentTier.formattedMin}
            </button>
          </div>
        )}
      </div>

      {/* 3. Investment Capital Input */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            <span>Investment Capital (USD)</span>
          </label>
          <span className="text-[11px] text-slate-500 font-mono">
            Min for {currentTier.label}: <strong className="text-blue-700">{currentTier.formattedMin}</strong>
          </span>
        </div>

        {/* Input Field */}
        <div className="relative mb-2">
          <span className="absolute left-3.5 top-3 text-slate-400 font-bold">$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Enter amount"
            value={tradeAmountInput}
            onChange={(e) => handleAmountInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && (tradeAmountInput === '0' || tradeAmountInput === '0.00')) {
                e.preventDefault();
                setTradeAmountInput('');
              }
            }}
            onFocus={() => {
              if (tradeAmountInput === '0') {
                setTradeAmountInput('');
              }
            }}
            className={`w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 border focus:bg-white focus:outline-none text-base font-black font-mono text-slate-950 transition-colors ${
              tradeAmount < currentTier.minAmount
                ? 'border-amber-400 focus:border-amber-500'
                : 'border-slate-200 focus:border-blue-600'
            }`}
          />
        </div>

        {/* Tier Presets (500, 8k, 50k, 200k, 500k, 1M) */}
        <div className="grid grid-cols-6 gap-1 mb-2">
          {PRESET_TIER_AMOUNTS.map((amt) => {
            const label =
              amt >= 1000000 ? '$1M' : amt >= 1000 ? `$${amt / 1000}k` : `$${amt}`;
            const isActive = tradeAmount === amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAmount(amt)}
                className={`py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer text-center ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Balance Percentage Shortcuts */}
        <div className="flex items-center gap-1.5">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setAmountPercent(pct)}
              className="flex-1 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-mono font-bold text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer"
            >
              {pct === 100 ? 'MAX' : `${pct}%`}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Payout & Expected Return Box */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-200/80 mb-4 space-y-1.5 text-xs font-mono shadow-2xs">
        <div className="flex items-center justify-between text-slate-600">
          <span>Contract Node & Profit Rate:</span>
          <span className="text-blue-700 font-black">{currentTier.label} Node (+{currentTier.profitPercent}%)</span>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Potential Net Profit:</span>
          <span className="text-blue-700 font-black">
            +${estimatedProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-900 pt-1.5 border-t border-blue-200/60 font-bold">
          <span>Total Payout (Capital + Return):</span>
          <span className="text-blue-900 font-black text-sm">
            ${totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </span>
        </div>
      </div>

      {/* 5. Execution Buttons: UP / HIGH and DOWN / LOW */}
      <div className="grid grid-cols-2 gap-3 mb-2.5">
        {/* UP / HIGH BUTTON */}
        <button
          type="button"
          onClick={() => handlePlaceOrder('HIGH')}
          disabled={executing}
          className="group relative flex flex-col items-center justify-center py-3.5 px-3 rounded-2xl bg-gradient-to-b from-blue-600 via-[#1D4ED8] to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white shadow-[0_4px_16px_rgba(29,78,216,0.35)] active:scale-98 transition-all disabled:opacity-50 font-black cursor-pointer"
        >
          <div className="flex items-center gap-1.5 font-black text-base tracking-wide">
            <TrendingUp className="w-5 h-5 text-white group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-white">UP / HIGH</span>
          </div>
          <span className="text-[11px] font-mono text-blue-100 font-bold">
            Payout +{currentTier.profitPercent}% ({currentTier.label})
          </span>
        </button>

        {/* DOWN / LOW BUTTON */}
        <button
          type="button"
          onClick={() => handlePlaceOrder('LOW')}
          disabled={executing}
          className="group relative flex flex-col items-center justify-center py-3.5 px-3 rounded-2xl bg-gradient-to-b from-rose-600 via-[#DC2626] to-red-800 hover:from-rose-500 hover:to-red-700 text-white shadow-[0_4px_16px_rgba(220,38,38,0.35)] active:scale-98 transition-all disabled:opacity-50 font-black cursor-pointer"
        >
          <div className="flex items-center gap-1.5 font-black text-base tracking-wide">
            <TrendingDown className="w-5 h-5 text-white group-hover:translate-y-0.5 transition-transform" />
            <span className="text-white">DOWN / LOW</span>
          </div>
          <span className="text-[11px] font-mono text-red-100 font-bold">
            Payout +{currentTier.profitPercent}% ({currentTier.label})
          </span>
        </button>
      </div>

      {/* 6. Mode & Crypto.com Merger Clearance Footer */}
      <div className="text-center pt-1.5">
        {tradingMode === 'demo' ? (
          <p className="text-[11px] text-blue-700 flex items-center justify-center gap-1 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Active in Risk-Free Demo Sandbox ($1,000,000 Practice Balance)</span>
          </p>
        ) : (
          <p className="text-[11px] text-slate-600 flex items-center justify-center gap-1.5 font-semibold">
            <span className="w-3.5 h-3.5 rounded overflow-hidden shadow-2xs inline-flex flex-shrink-0 bg-[#002D74]">
              <img src="/assets/aistudio/image_648bde8c.png" alt="Crypto.com" className="w-full h-full object-cover" />
            </span>
            <span>Crypto.com Strategic Clearing • $1M+ Guaranteed Settlement</span>
          </p>
        )}
      </div>

      {/* Royal Blue Profit / Result Celebration Modal */}
      <TradeResultModal
        result={settledModalResult}
        onClose={() => setSettledModalResult(null)}
      />
    </div>
  );
};
