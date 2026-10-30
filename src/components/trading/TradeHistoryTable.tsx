import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMarketData } from '../../context/MarketDataContext';
import { Clock, TrendingUp, TrendingDown, CheckCircle2, XCircle, History } from 'lucide-react';

export const TradeHistoryTable: React.FC = () => {
  const { activeTrades, completedTrades } = useAuth();
  const { selectedAsset } = useMarketData();
  const [historyTab, setHistoryTab] = useState<'active' | 'completed'>('active');
  const [filter, setFilter] = useState<'all' | 'won' | 'lost'>('all');

  const filteredCompleted = completedTrades.filter((t) => {
    if (filter === 'won') return t.status === 'WON';
    if (filter === 'lost') return t.status === 'LOST';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 text-slate-900">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          <h3 className="font-black text-sm text-slate-950">Contract Ledger</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Active / Completed Tabs */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setHistoryTab('active')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                historyTab === 'active'
                  ? 'bg-blue-600 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <span>Active Contracts</span>
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] flex items-center justify-center font-mono font-black">
                {activeTrades.length}
              </span>
            </button>

            <button
              onClick={() => setHistoryTab('completed')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                historyTab === 'completed'
                  ? 'bg-blue-600 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <span>Settled Trades</span>
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-mono font-bold">
                {completedTrades.length}
              </span>
            </button>
          </div>

          {historyTab === 'completed' && (
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[11px]">
              {(['all', 'won', 'lost'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 rounded capitalize cursor-pointer ${
                    filter === f ? 'bg-white text-slate-950 font-black shadow-2xs' : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {historyTab === 'active' ? (
        activeTrades.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No Open Contracts</p>
            <p className="text-[11px] mt-1 text-slate-500">Select a duration and choose High or Low to execute a trade.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100 font-bold">
                  <th className="pb-2">Asset</th>
                  <th className="pb-2">Direction</th>
                  <th className="pb-2">Investment</th>
                  <th className="pb-2">Strike Price</th>
                  <th className="pb-2">Current Price</th>
                  <th className="pb-2">Time Left</th>
                  <th className="pb-2 text-right">Potential Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTrades.map((t) => {
                  const remainingSec = Math.max(0, Math.ceil((t.closeTime - Date.now()) / 1000));
                  const isCurrentInMoney =
                    t.direction === 'HIGH'
                      ? selectedAsset.price > t.entryPrice
                      : selectedAsset.price < t.entryPrice;

                  return (
                    <tr key={t.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-2.5 font-black text-slate-950 font-sans">{t.symbol}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black ${
                            t.direction === 'HIGH'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {t.direction === 'HIGH' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{t.direction}</span>
                        </span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-900">${t.amount.toLocaleString()}</td>
                      <td className="py-2.5 text-slate-600">${t.entryPrice.toFixed(2)}</td>
                      <td className="py-2.5">
                        <span className={isCurrentInMoney ? 'text-blue-600 font-black' : 'text-rose-600 font-black'}>
                          ${selectedAsset.price.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="flex items-center gap-1 text-blue-600 font-black">
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>{remainingSec}s</span>
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-black text-blue-700">
                        +${(t.amount * t.payoutRate).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Completed Trades */
        filteredCompleted.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No Settled Contracts</p>
            <p className="text-[11px] mt-1 text-slate-500">Your closed trades and audited results will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100 font-bold">
                  <th className="pb-2">Outcome</th>
                  <th className="pb-2">Asset</th>
                  <th className="pb-2">Direction</th>
                  <th className="pb-2">Invested</th>
                  <th className="pb-2">Entry → Close</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2 text-right">Net PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCompleted.map((t) => {
                  const isWin = t.status === 'WON';
                  return (
                    <tr key={t.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                            isWin
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isWin ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{t.status}</span>
                        </span>
                      </td>
                      <td className="py-2.5 font-black text-slate-950 font-sans">{t.symbol}</td>
                      <td className="py-2.5 text-slate-600 font-bold">{t.direction}</td>
                      <td className="py-2.5 font-bold text-slate-900">${t.amount.toLocaleString()}</td>
                      <td className="py-2.5 text-slate-500">
                        ${t.entryPrice.toFixed(2)} → ${t.closePrice?.toFixed(2) || '—'}
                      </td>
                      <td className="py-2.5 text-slate-500">{t.durationSeconds}s</td>
                      <td className={`py-2.5 text-right font-black ${isWin ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isWin ? `+$${t.pnl.toFixed(2)}` : `-$${Math.abs(t.pnl).toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};
