import React, { useState } from 'react';
import { useMarketData } from '../../context/MarketDataContext';
import { Layers, Activity } from 'lucide-react';

export const OrderBookAndTrades: React.FC = () => {
  const { selectedAsset, orderBook, recentTrades } = useMarketData();
  const [activeTab, setActiveTab] = useState<'book' | 'trades'>('book');

  const maxTotal = Math.max(
    ...orderBook.asks.map((a) => a.total),
    ...orderBook.bids.map((b) => b.total),
    1
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-4 text-slate-900 text-xs">
      {/* Header Tabs */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5 border border-slate-200">
          <button
            onClick={() => setActiveTab('book')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'book'
                ? 'bg-blue-600 text-white shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Order Book</span>
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'trades'
                ? 'bg-blue-600 text-white shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Market Ticks</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline font-bold">
          Live Depth (USD)
        </span>
      </div>

      {/* Content */}
      {activeTab === 'book' ? (
        <div className="flex flex-col flex-1 font-mono">
          {/* Table Headers */}
          <div className="grid grid-cols-3 text-[10px] text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-100 font-bold">
            <span>Price ({selectedAsset.unit || 'USD'})</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>

          {/* Asks (Sell Orders) */}
          <div className="flex flex-col justify-end space-y-1 py-1.5 overflow-hidden">
            {orderBook.asks.map((ask, i) => {
              const depthPct = Math.min(100, (ask.total / maxTotal) * 100);
              return (
                <div key={i} className="relative grid grid-cols-3 py-0.5 text-[11px] items-center">
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none rounded"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="text-rose-600 font-bold z-10">{ask.price.toFixed(selectedAsset.price < 5 ? 4 : 2)}</span>
                  <span className="text-right text-slate-700 z-10">{ask.amount.toFixed(2)}</span>
                  <span className="text-right text-slate-400 z-10">{ask.total.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          {/* Current Spread Bar */}
          <div className="py-2 my-1 px-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-black text-slate-950 font-sans flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>${selectedAsset.price.toFixed(selectedAsset.price < 5 ? 4 : 2)}</span>
            </span>
            <span className="text-[10px] text-slate-500 font-bold">Spread: ${orderBook.spread.toFixed(selectedAsset.price < 5 ? 4 : 2)}</span>
          </div>

          {/* Bids (Buy Orders) */}
          <div className="flex flex-col space-y-1 py-1.5 overflow-hidden">
            {orderBook.bids.map((bid, i) => {
              const depthPct = Math.min(100, (bid.total / maxTotal) * 100);
              return (
                <div key={i} className="relative grid grid-cols-3 py-0.5 text-[11px] items-center">
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-blue-500/10 pointer-events-none rounded"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="text-blue-600 font-bold z-10">{bid.price.toFixed(selectedAsset.price < 5 ? 4 : 2)}</span>
                  <span className="text-right text-slate-700 z-10">{bid.amount.toFixed(2)}</span>
                  <span className="text-right text-slate-400 z-10">{bid.total.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Recent Trades Stream */
        <div className="flex flex-col flex-1 font-mono">
          <div className="grid grid-cols-3 text-[10px] text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-100 font-bold">
            <span>Price</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Time</span>
          </div>
          <div className="space-y-1.5 py-1.5 overflow-y-auto max-h-[300px]">
            {recentTrades.map((t) => (
              <div key={t.id} className="grid grid-cols-3 py-0.5 text-[11px]">
                <span className={t.side === 'buy' ? 'text-blue-600 font-bold' : 'text-rose-600 font-bold'}>
                  {t.price.toFixed(selectedAsset.price < 5 ? 4 : 2)}
                </span>
                <span className="text-right text-slate-700 font-semibold">{t.amount}</span>
                <span className="text-right text-slate-400 text-[10px]">{t.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
