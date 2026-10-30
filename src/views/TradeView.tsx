import React, { useState } from 'react';
import { AssetHeader } from '../components/trading/AssetHeader';
import { TradingChart } from '../components/trading/TradingChart';
import { TradePanel } from '../components/trading/TradePanel';
import { OrderBookAndTrades } from '../components/trading/OrderBookAndTrades';
import { TradeHistoryTable } from '../components/trading/TradeHistoryTable';
import { useAuth } from '../context/AuthContext';
import { LineChart, Layers, History, ShieldCheck, Zap } from 'lucide-react';

interface TradeViewProps {
  openAuthModal: () => void;
  openDepositModal: () => void;
}

export const TradeView: React.FC<TradeViewProps> = ({
  openAuthModal,
  openDepositModal,
}) => {
  const { activeTrades } = useAuth();
  const [mobileTab, setMobileTab] = useState<'terminal' | 'orderbook' | 'history'>('terminal');

  return (
    <div className="space-y-3 sm:space-y-4 pb-20 sm:pb-12 animate-in fade-in duration-200">
      {/* 1. Header with Asset Selector & 24h Metrics */}
      <AssetHeader />

      {/* 2. Front & Center: Official Crypto.com Strategic Merger Clearance Banner (Always visible on phone & desktop) */}
      <div className="p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#002D74] via-[#0B3A82] to-blue-700 text-white shadow-xs flex items-center justify-between gap-2.5 border border-blue-800/60">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-white/30 shadow-md flex-shrink-0 bg-[#002D74]">
            <img
              src="/assets/aistudio/image_648bde8c.png"
              alt="Crypto.com"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-xs sm:text-sm tracking-tight text-white">
                TRXTRADE × Crypto.com Merger
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-[#002D74] text-[9px] font-mono font-black uppercase">
                Active Node
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-blue-100/90 truncate font-medium">
              30s–5m Nodes • 15%–60% Return • $1M Execution Gateway
            </p>
          </div>
        </div>

        <button
          onClick={openDepositModal}
          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-[#002D74] text-[10px] sm:text-xs font-black shadow-xs flex-shrink-0 transition-transform active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1"
        >
          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>Deposit Funds</span>
        </button>
      </div>

      {/* Mobile Tab Switcher (Visible only on < lg screens) */}
      <div className="flex lg:hidden items-center bg-white p-1 rounded-2xl border border-slate-200 text-xs font-semibold shadow-2xs">
        <button
          onClick={() => setMobileTab('terminal')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
            mobileTab === 'terminal'
              ? 'bg-blue-600 text-white font-black shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LineChart className="w-3.5 h-3.5" />
          <span>Terminal</span>
        </button>
        <button
          onClick={() => setMobileTab('orderbook')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer ${
            mobileTab === 'orderbook'
              ? 'bg-blue-600 text-white font-black shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Depth Book</span>
        </button>
        <button
          onClick={() => setMobileTab('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all relative cursor-pointer ${
            mobileTab === 'history'
              ? 'bg-blue-600 text-white font-black shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Trades</span>
          {activeTrades.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black flex items-center justify-center font-mono">
              {activeTrades.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. Main Terminal Grid for Desktop */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Chart (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="h-[540px]">
            <TradingChart />
          </div>
          {/* Execution History */}
          <TradeHistoryTable />
        </div>

        {/* Right Column: Execution & Depth (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <TradePanel
            openAuthModal={openAuthModal}
            openDepositModal={openDepositModal}
          />
          <div className="h-[360px]">
            <OrderBookAndTrades />
          </div>
        </div>
      </div>

      {/* 4. Mobile View Content (Dynamically renders based on mobile tab so nothing is crammed or hidden) */}
      <div className="lg:hidden space-y-3">
        {mobileTab === 'terminal' && (
          <>
            <div className="h-[300px] sm:h-[400px]">
              <TradingChart />
            </div>
            <TradePanel
              openAuthModal={openAuthModal}
              openDepositModal={openDepositModal}
            />
          </>
        )}

        {mobileTab === 'orderbook' && (
          <div className="h-[480px]">
            <OrderBookAndTrades />
          </div>
        )}

        {mobileTab === 'history' && (
          <TradeHistoryTable />
        )}
      </div>
    </div>
  );
};
