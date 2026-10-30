import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarketData } from '../context/MarketDataContext';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  ArrowRight,
  RotateCcw,
  PlusCircle,
  Coins,
  Building2,
  DollarSign,
  Award,
  Zap,
  Sparkles,
} from 'lucide-react';

interface HomeViewProps {
  setCurrentTab: (tab: 'home' | 'markets' | 'trade' | 'wallet') => void;
  openDepositModal: () => void;
  openAuthModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  setCurrentTab,
  openDepositModal,
}) => {
  const { userProfile, tradingMode, resetDemoBalance, completedTrades, transactions } = useAuth();
  const { assets, setSelectedAsset } = useMarketData();

  const balance =
    tradingMode === 'demo' ? (userProfile?.demoBalance ?? 50000) : (userProfile?.realBalance ?? 0);

  // Calculate Net PnL from completed trades
  const totalPnL = completedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const winCount = completedTrades.filter((t) => t.status === 'WON').length;
  const winRate = completedTrades.length > 0 ? (winCount / completedTrades.length) * 100 : 78.5;

  // Filter specific featured assets
  const goldAsset = assets.find((a) => a.symbol === 'XAU/USD') || assets[9];
  const cryptoAssets = assets.filter((a) => a.category === 'crypto').slice(0, 4);
  const stockAssets = assets.filter((a) => a.category === 'stocks').slice(0, 6);
  const favorites = assets.filter((a) => userProfile?.favorites?.includes(a.symbol));

  const handleStartTrading = (assetSymbol?: string) => {
    if (assetSymbol) {
      const match = assets.find((a) => a.symbol === assetSymbol);
      if (match) setSelectedAsset(match);
    }
    setCurrentTab('trade');
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Hero Financial Banner & Portfolio Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/60 border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Account Overview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold shadow-2xs">
              <div className="w-4 h-4 rounded overflow-hidden shadow-xs flex-shrink-0 bg-[#002D74]">
                <img src="/assets/aistudio/image_648bde8c.png" alt="Crypto.com" className="w-full h-full object-cover" />
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>Official Strategic Merger with Crypto.com • Deep Liquidity</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              Trade Cryptocurrencies, Gold & US Equities with <span className="text-blue-600">Precision</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl font-medium">
              High-frequency binary contracts with 30s to 5m expirations (15% to 60% yields), official Crypto.com strategic clearing, and execution up to $1,000,000 USD.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => handleStartTrading('BTC/USD')}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center gap-2 shadow-[0_4px_16px_rgba(37,99,235,0.3)] transition-all hover:scale-102 cursor-pointer"
              >
                <span>Launch Trade Terminal</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              {tradingMode === 'real' ? (
                <button
                  onClick={openDepositModal}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm flex items-center gap-2 transition-all hover:border-blue-400 cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>Deposit USDT / Crypto</span>
                </button>
              ) : (
                <button
                  onClick={resetDemoBalance}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-950 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span>Reset Demo ($1M)</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Live Portfolio Dashboard Box */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                  {tradingMode === 'demo' ? 'Virtual Demo Balance' : 'Real Account Balance'}
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-950 mt-0.5">
                  ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Today's PnL</span>
                <div className={`text-base font-black font-mono ${totalPnL >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-bold">Win Rate</span>
                <span className="font-black text-blue-600 text-sm">{winRate.toFixed(1)}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-bold">Settled Trades</span>
                <span className="font-black text-slate-900 text-sm">{completedTrades.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-bold">Currency</span>
                <span className="font-black text-blue-600 text-sm">USD</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1 font-medium">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Tier-1 US Banking Custody</span>
              </span>
              <span
                className="text-blue-600 font-black cursor-pointer hover:underline"
                onClick={() => setCurrentTab('wallet')}
              >
                View Wallet Details &rarr;
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Crypto.com Strategic Tie-Up Showcase Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#002D74] via-[#0B3A82] to-[#1D4ED8] p-5 sm:p-7 text-white shadow-md border border-blue-800/80">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/40 ring-4 ring-white/10 bg-[#002D74] flex-shrink-0">
              <img
                src="/assets/aistudio/image_648bde8c.png"
                alt="Crypto.com Partnership"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono uppercase tracking-wider font-bold">
                  Official Strategic Tie-Up
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                TRXTRADE × Crypto.com Deep Liquidity & Clearing
              </h3>
              <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl font-medium mt-1">
                All platform binary contract nodes clear directly against tier-1 Crypto.com liquidity pools, guaranteeing zero slippage and instant settlement up to $1,000,000 USD.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => handleStartTrading('BTC/USD')}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-[#002D74] font-black text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Trade On Institutional Engine
            </button>
          </div>
        </div>
      </div>

      {/* Gold & Metals Spotlight Card */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-200/90 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs shadow-xs">
                Au
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-950">Physical Gold Spot (XAU/USD) & Metals</h3>
                <p className="text-xs text-blue-700 font-bold">London Bullion Market Association (LBMA) Benchmark</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 max-w-xl font-medium">
              Hedge against inflation with real-time precious metals trading. 92% contract payout with ultra-tight spread and instant execution.
            </p>

            {/* Quick Metals Switcher Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono text-xs">
              <span className="text-[10px] text-slate-500 uppercase font-sans mr-1 font-bold">Other Metals:</span>
              {[
                { symbol: 'XAG/USD', label: 'Silver $33.74' },
                { symbol: 'XPT/USD', label: 'Platinum $1,024' },
                { symbol: 'COPPER', label: 'Copper $4.38' },
                { symbol: 'GLD', label: 'SPDR Gold ETF' },
              ].map((m) => (
                <button
                  key={m.symbol}
                  onClick={() => handleStartTrading(m.symbol)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] text-slate-700 hover:text-blue-700 transition-colors cursor-pointer shadow-2xs font-bold"
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-blue-200/60">
            <div className="font-mono text-left sm:text-right">
              <div className="text-xl sm:text-2xl font-black text-slate-950">${goldAsset.price.toFixed(2)}</div>
              <div className="text-xs font-bold text-emerald-600">+{goldAsset.change24h}% (24h)</div>
            </div>

            <button
              onClick={() => handleStartTrading('XAU/USD')}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_4px_12px_rgba(37,99,235,0.3)] flex-shrink-0 cursor-pointer"
            >
              <span>Trade Gold</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Favourites Row (if any) */}
      {favorites.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Starred Favourites</span>
            </h3>
            <button
              onClick={() => setCurrentTab('markets')}
              className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
            >
              Explore All Markets &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {favorites.map((asset) => {
              const positive = asset.change24h >= 0;
              return (
                <div
                  key={asset.id}
                  onClick={() => handleStartTrading(asset.symbol)}
                  className="p-4 rounded-2xl bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-slate-950 text-sm group-hover:text-blue-600 transition-colors">
                      {asset.symbol}
                    </span>
                    <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{positive ? '+' : ''}{asset.change24h.toFixed(2)}%</span>
                    </span>
                  </div>

                  <div className="text-base font-black font-mono text-slate-950 mb-1">
                    ${asset.price.toFixed(asset.price < 5 ? 4 : 2)}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
                    <span>{asset.name}</span>
                    <span className="text-blue-600 font-bold">Payout {(asset.payoutRate * 100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two Column Grid: Trending Cryptos & US Heavyweight Equities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trending Cryptocurrencies */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-600" />
              <h3 className="font-black text-slate-950 text-base">Top Digital Assets (Crypto)</h3>
            </div>
            <button
              onClick={() => setCurrentTab('markets')}
              className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
            >
              See All &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {cryptoAssets.map((asset) => {
              const positive = asset.change24h >= 0;
              return (
                <div
                  key={asset.id}
                  onClick={() => handleStartTrading(asset.symbol)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                      {asset.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-black text-slate-950 text-sm group-hover:text-blue-600 transition-colors">
                        {asset.symbol}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">{asset.name}</div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="font-black text-sm text-slate-950">
                      ${asset.price.toFixed(asset.price < 5 ? 4 : 2)}
                    </div>
                    <div className={`text-xs font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {positive ? '+' : ''}{asset.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* US Blue-Chip Stocks */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-black text-slate-950 text-base">US Blue-Chip Equities</h3>
            </div>
            <button
              onClick={() => setCurrentTab('markets')}
              className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
            >
              See All &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {stockAssets.map((asset) => {
              const positive = asset.change24h >= 0;
              return (
                <div
                  key={asset.id}
                  onClick={() => handleStartTrading(asset.symbol)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                      {asset.symbol.slice(0, 4)}
                    </div>
                    <div>
                      <div className="font-black text-slate-950 text-sm group-hover:text-blue-600 transition-colors">
                        {asset.symbol}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">{asset.name}</div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="font-black text-sm text-slate-950">
                      ${asset.price.toFixed(2)}
                    </div>
                    <div className={`text-xs font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {positive ? '+' : ''}{asset.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Platform Executions & Transactions */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <h3 className="font-black text-slate-950 text-base">Recent Platform Activity</h3>
          </div>
          <button
            onClick={() => setCurrentTab('wallet')}
            className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
          >
            Transaction History &rarr;
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No recent transactions yet. Place a trade or deposit to view live updates.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100 font-bold">
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Method / Description</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="hover:bg-blue-50/40">
                    <td className="py-2.5 font-black text-slate-950">{tx.type}</td>
                    <td className="py-2.5 text-blue-600 font-black">${tx.amount.toLocaleString()}</td>
                    <td className="py-2.5 text-slate-600 font-sans font-medium">{tx.method}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-slate-500 text-[11px]">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
