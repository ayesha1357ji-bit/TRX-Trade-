import React, { useState } from 'react';
import { useMarketData } from '../context/MarketDataContext';
import { useAuth } from '../context/AuthContext';
import { MarketAsset, AssetCategory } from '../types';
import { Search, Star, TrendingUp, TrendingDown, ArrowUpRight, Filter, Sparkles } from 'lucide-react';

interface MarketsViewProps {
  setCurrentTab: (tab: 'home' | 'markets' | 'trade' | 'wallet') => void;
}

export const MarketsView: React.FC<MarketsViewProps> = ({ setCurrentTab }) => {
  const { assets, setSelectedAsset } = useMarketData();
  const { userProfile, toggleFavorite } = useAuth();
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'change' | 'price' | 'name'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const favorites = userProfile?.favorites || [];

  const handleTradeAsset = (asset: MarketAsset) => {
    setSelectedAsset(asset);
    setCurrentTab('trade');
  };

  const filteredAssets = assets
    .filter((asset) => {
      const matchSearch =
        asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
        asset.name.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (activeCategory === 'all') return true;
      if (activeCategory === 'favorites') return favorites.includes(asset.symbol);
      return asset.category === activeCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'volume') comparison = b.volume24h - a.volume24h;
      if (sortBy === 'change') comparison = b.change24h - a.change24h;
      if (sortBy === 'price') comparison = b.price - a.price;
      if (sortBy === 'name') comparison = a.symbol.localeCompare(b.symbol);
      return sortOrder === 'desc' ? comparison : -comparison;
    });

  const CATEGORIES: { id: AssetCategory; label: string }[] = [
    { id: 'all', label: 'All Markets' },
    { id: 'favorites', label: 'Favourites' },
    { id: 'stocks', label: 'US Stocks' },
    { id: 'gold', label: 'Gold & Metals' },
    { id: 'crypto', label: 'Crypto Spot' },
    { id: 'crypto_futures', label: 'Crypto Futures' },
    { id: 'forex', label: 'Forex' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-12 animate-in fade-in duration-200">
      {/* Title & Stats Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Global Markets Screener
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
            Real-time live prices across 30+ US Equities, Precious Metals, Digital Assets and FX.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 uppercase block font-bold">Active Pairs</span>
            <span className="font-black text-slate-900 text-xs sm:text-sm">{filteredAssets.length} of {assets.length} Assets</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 uppercase block font-bold">Status</span>
            <span className="font-black text-blue-600 text-xs sm:text-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Live Feed
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white font-black shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300'
              }`}
            >
              {cat.label}
              {cat.id === 'favorites' && favorites.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-black">
                  {favorites.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ticker (e.g. NVDA, XAU, BTC, ETH)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:outline-none text-xs text-slate-900 placeholder-slate-400 transition-colors"
            />
          </div>

          <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200 text-xs flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-blue-600 ml-1.5 mr-1 hidden sm:inline" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none pr-1 cursor-pointer"
            >
              <option value="volume">Vol</option>
              <option value="change">% Chg</option>
              <option value="price">Price</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-1.5 py-0.5 rounded bg-white text-blue-700 font-mono text-[10px] font-black border border-slate-200 cursor-pointer shadow-2xs"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="md:hidden space-y-2.5">
        {filteredAssets.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs rounded-2xl bg-white border border-slate-200">
            No instruments found matching your search.
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const isFav = favorites.includes(asset.symbol);
            const isPositive = asset.change24h >= 0;
            return (
              <div
                key={asset.id}
                onClick={() => handleTradeAsset(asset)}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all space-y-2.5 active:bg-blue-50/40 cursor-pointer shadow-2xs"
              >
                {/* Header Row: Symbol, Name, Fav, Price, 24h Change */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(asset.symbol);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-base text-slate-950">{asset.symbol}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono font-bold">
                          {asset.category.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 truncate max-w-[140px] block font-medium">
                        {asset.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="font-black text-base text-slate-950">
                      ${asset.price.toFixed(asset.price < 5 ? 4 : 2)}
                    </div>
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Metrics & Trade Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-mono">
                  <div className="flex items-center gap-3 text-slate-500 font-medium">
                    <span>H: ${asset.high24h.toFixed(asset.price < 5 ? 4 : 2)}</span>
                    <span>L: ${asset.low24h.toFixed(asset.price < 5 ? 4 : 2)}</span>
                    <span className="text-blue-600 font-bold">+{(asset.payoutRate * 100).toFixed(0)}% Payout</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTradeAsset(asset);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Trade</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block rounded-3xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 font-bold">
                <th className="py-3 px-4 w-12 text-center">Fav</th>
                <th className="py-3 px-4">Instrument</th>
                <th className="py-3 px-4">Market Price</th>
                <th className="py-3 px-4">24h Change</th>
                <th className="py-3 px-4">24h High / Low</th>
                <th className="py-3 px-4">24h Volume</th>
                <th className="py-3 px-4">Trend (24h)</th>
                <th className="py-3 px-4 text-center">Contract Payout</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                    No financial instruments found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const isFav = favorites.includes(asset.symbol);
                  const isPositive = asset.change24h >= 0;
                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                      onClick={() => handleTradeAsset(asset)}
                    >
                      {/* Favorite Button */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleFavorite(asset.symbol)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isFav ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Instrument Symbol & Name */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                            {asset.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-black text-sm text-slate-950 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              <span>{asset.symbol}</span>
                              {asset.leverage && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono font-bold">
                                  {asset.leverage}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block truncate max-w-[140px]">
                              {asset.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-black text-slate-950 text-sm">
                        ${asset.price.toFixed(asset.price < 5 ? 4 : 2)}
                      </td>

                      {/* 24h Change */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>{isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%</span>
                        </span>
                      </td>

                      {/* 24h High / Low */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                        <div>H: ${asset.high24h.toFixed(asset.price < 5 ? 4 : 2)}</div>
                        <div className="text-slate-400 text-[10px]">L: ${asset.low24h.toFixed(asset.price < 5 ? 4 : 2)}</div>
                      </td>

                      {/* 24h Volume */}
                      <td className="py-3.5 px-4 text-slate-700 text-xs font-bold">
                        ${(asset.volume24h / 1e9).toFixed(2)}B
                      </td>

                      {/* Mini Sparkline SVG */}
                      <td className="py-3.5 px-4">
                        <svg className="w-24 h-7" viewBox="0 0 100 30">
                          {(() => {
                            const pts = asset.sparkline;
                            const min = Math.min(...pts);
                            const max = Math.max(...pts);
                            const range = max - min || 1;
                            const path = pts
                              .map((p, i) => {
                                const x = (i / (pts.length - 1)) * 100;
                                const y = 28 - ((p - min) / range) * 24;
                                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                              })
                              .join(' ');
                            return (
                              <path
                                d={path}
                                fill="none"
                                stroke={isPositive ? '#2563EB' : '#EF4444'}
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            );
                          })()}
                        </svg>
                      </td>

                      {/* Contract Payout */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-blue-700 text-xs px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                          +{(asset.payoutRate * 100).toFixed(0)}%
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleTradeAsset(asset)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs inline-flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                        >
                          <span>Trade</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
