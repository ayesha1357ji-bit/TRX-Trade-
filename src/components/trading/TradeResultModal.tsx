import React from 'react';
import { X } from 'lucide-react';
import { SettledTradeResult } from '../../types';

interface TradeResultModalProps {
  result: SettledTradeResult | null;
  onClose: () => void;
}

export const TradeResultModal: React.FC<TradeResultModalProps> = ({ result, onClose }) => {
  if (!result) return null;

  const isWin = result.isWin;
  const cleanSymbol = result.symbol.split('/')[0] || result.symbol;
  const isUp = result.direction === 'HIGH';
  const displayAmount = result.amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const displayOpen = result.entryPrice.toLocaleString('en-US', {
    minimumFractionDigits: result.entryPrice < 5 ? 4 : 2,
    maximumFractionDigits: result.entryPrice < 5 ? 4 : 2,
  });
  const displayLast = result.closePrice.toLocaleString('en-US', {
    minimumFractionDigits: result.closePrice < 5 ? 4 : 2,
    maximumFractionDigits: result.closePrice < 5 ? 4 : 2,
  });
  const pnlAmount = Math.abs(result.pnl).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[360px] sm:max-w-[380px] flex flex-col items-center">
        {/* Top Close Button (matches top-right 'X' from user reference screenshot) */}
        <button
          onClick={onClose}
          className="self-end mb-2 p-1 text-slate-300 hover:text-white transition-colors cursor-pointer focus:outline-none"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main Royal Blue Radial Card (Exactly matches shared screenshot) */}
        <div className="w-full relative overflow-hidden rounded-[30px] bg-gradient-to-b from-[#2563EB] via-[#1D4ED8] to-[#1E40AF] p-6 sm:p-7 text-white shadow-[0_20px_50px_rgba(37,99,235,0.4)] border border-white/20">
          {/* Subtle Ambient Radial Light Orbs */}
          <div className="absolute -top-16 -left-16 w-44 h-44 bg-[#60A5FA]/35 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#3B82F6]/40 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Asset Symbol Header */}
            <h2 className="text-xl sm:text-2xl font-black tracking-wider text-white uppercase drop-shadow-sm">
              {cleanSymbol}
            </h2>

            {/* Big Net Profit Display */}
            <div className="mt-2 mb-6">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight drop-shadow-md ${
                  isWin ? 'text-[#5EF2C1]' : 'text-[#FFA4A4]'
                }`}
              >
                {isWin ? `+${pnlAmount} USD` : `-${pnlAmount} USD`}
              </span>
            </div>

            {/* Details Table */}
            <div className="w-full space-y-3.5 text-xs sm:text-sm font-sans text-left">
              <div className="flex items-center justify-between text-blue-100/90">
                <span className="font-medium">Open price</span>
                <span className="font-bold text-white font-mono">{displayOpen} USD</span>
              </div>

              <div className="flex items-center justify-between text-blue-100/90">
                <span className="font-medium">Last price:</span>
                <span className="font-bold text-white font-mono">{displayLast} USD</span>
              </div>

              <div className="flex items-center justify-between text-blue-100/90">
                <span className="font-medium">{isUp ? 'Up:' : 'Down:'}</span>
                <span className="font-bold text-white font-mono">{displayAmount} USD</span>
              </div>

              <div className="flex items-center justify-between text-blue-100/90">
                <span className="font-medium">Fee:</span>
                <span className="font-bold text-white font-mono">
                  {result.fee ? `${result.fee.toFixed(2)} USD` : '0.00 USD'}
                </span>
              </div>

              <div className="flex items-center justify-between text-blue-100/90 pt-1 border-t border-white/15">
                <span className="font-medium">Expected return:</span>
                <span
                  className={`font-black font-mono ${
                    isWin ? 'text-[#5EF2C1]' : 'text-[#FFA4A4]'
                  }`}
                >
                  {isWin ? `+${pnlAmount} USD` : `-${pnlAmount} USD`}
                </span>
              </div>
            </div>

            {/* Order Number & Mode Badge */}
            <div className="mt-7 flex flex-col items-center">
              <span className="text-[11px] text-blue-200/80 font-mono tracking-tight">Order number:</span>
              <span className="text-xs font-mono font-bold text-white tracking-wide mt-0.5 mb-2.5">
                {result.orderNumber}
              </span>

              <div className="inline-flex items-center px-4 py-1 rounded-full bg-white/15 border border-white/20 text-white text-[11px] font-semibold backdrop-blur-md shadow-xs">
                <span>{result.mode === 'demo' ? 'Demo Mode' : 'Live Mode'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 'Order again' Action Pill Button (exactly matches shared screenshot below card) */}
        <div className="mt-5 w-full flex justify-center">
          <button
            onClick={onClose}
            className="w-full max-w-[280px] py-3.5 px-8 rounded-full bg-[#EAF2FF] hover:bg-white text-[#1D4ED8] font-black text-base shadow-[0_12px_28px_rgba(0,0,0,0.45)] hover:shadow-[0_16px_35px_rgba(29,78,216,0.5)] active:scale-95 transition-all text-center cursor-pointer tracking-wide"
          >
            Order again
          </button>
        </div>
      </div>
    </div>
  );
};
