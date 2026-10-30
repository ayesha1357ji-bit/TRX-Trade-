import React, { useState } from 'react';
import { useMarketData } from '../../context/MarketDataContext';
import { MarketAsset } from '../../types';
import { Search, TrendingUp, TrendingDown, ChevronDown, Star, Sparkles } from 'lucide-react';

export const AssetHeader: React.FC = () => {
  const {
    selectedAsset,
    setSelectedAsset,
    assets,
  } = useMarketData();

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('trx_favorites');
      return stored ? JSON.parse(stored) : ['BTC/USD', 'ETH/USD', 'XAU/USD'];
    } catch {
      return ['BTC/USD', 'ETH/USD', 'XAU/USD'];
    }
  });

  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) => {
      const next = prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol];
      try {
        localStorage.setItem('trx_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const isFav = favorites.includes(selectedAsset.symbol);

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.symbol.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'favorites') return favorites.includes(a.symbol);
    return a.category === categoryFilter;
  });

  const handleSelect = (asset: MarketAsset) => {
    setSelectedAsset(asset);
    setDropdownOpen(false);
  };

  const isPositive = selectedAsset.change24h >= 0;

  return (
    <div className="relative z-20 flex flex-col gap-2 p-3 sm:px-4 sm:py-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs text-slate-900">
      {/* Top Primary Bar */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Asset Selector Button & Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-xs">
              {selectedAsset.symbol.slice(0, 3)}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-base text-slate-950 tracking-wide">
                  {selectedAsset.symbol}
                </span>
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <span className="text-[10px] text-slate-500 truncate max-w-[100px] sm:max-w-[140px] block font-medium">
                {selectedAsset.name}
              </span>
            </div>
          </button>

          {/* Favorite Star */}
          <button
            onClick={() => toggleFavorite(selectedAsset.symbol)}
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
              isFav
                ? 'text-amber-500 bg-amber-50 border border-amber-200'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFav ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Category Pill */}
          <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200/60 text-[10px] uppercase font-mono text-blue-700 font-bold hidden md:inline-block">
            {selectedAsset.category.replace('_', ' ')}
          </span>
        </div>

        {/* Right: Price & 24h Change */}
        <div className="text-right font-mono">
          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            <span className="font-black text-base sm:text-xl text-slate-950">
              ${selectedAsset.price.toFixed(selectedAsset.price < 5 ? 4 : 2)}
            </span>
            <span
              className={`flex items-center gap-0.5 text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-md ${
                isPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{isPositive ? '+' : ''}{selectedAsset.change24h.toFixed(2)}%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-6 pt-2 border-t border-slate-100 font-mono text-[10px] sm:text-xs text-slate-500 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1">
          <span className="text-slate-400 uppercase font-bold">24h H:</span>
          <span className="text-slate-800 font-bold">${selectedAsset.high24h.toFixed(selectedAsset.price < 5 ? 4 : 2)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-400 uppercase font-bold">24h L:</span>
          <span className="text-slate-800 font-bold">${selectedAsset.low24h.toFixed(selectedAsset.price < 5 ? 4 : 2)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-400 uppercase font-bold">Vol:</span>
          <span className="text-slate-800 font-bold">${(selectedAsset.volume24h / 1e9).toFixed(2)}B</span>
        </div>
        <div className="flex items-center gap-1 ml-auto sm:ml-0 text-blue-600 font-bold">
          <span className="text-slate-400 uppercase font-bold">Payout:</span>
          <span>+{(selectedAsset.payoutRate * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Asset Switcher Popover Modal */}
      {dropdownOpen && (
        <div className="absolute top-14 left-2 right-2 sm:right-auto sm:left-4 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-w-full">
          {/* Search */}
          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search US stocks, gold, crypto, forex..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:outline-none text-xs text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 border-b border-slate-100 scrollbar-none text-[11px]">
            {['all', 'favorites', 'stocks', 'gold', 'crypto', 'forex'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white font-black shadow-xs'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
                }`}
              >
                {cat === 'gold' ? 'Gold & Metals' : cat === 'stocks' ? 'US Stocks' : cat}
              </button>
            ))}
          </div>

          {/* Asset List */}
          <div className="max-h-72 overflow-y-auto space-y-1">
            {filteredAssets.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No assets match your search</div>
            ) : (
              filteredAssets.map((asset) => {
                const positive = asset.change24h >= 0;
                return (
                  <button
                    key={asset.id}
                    onClick={() => handleSelect(asset)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-blue-50/70 transition-all text-left group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                          {asset.symbol}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {asset.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-slate-900">
                        ${asset.price.toFixed(asset.price < 5 ? 4 : 2)}
                      </div>
                      <div className={`text-[10px] font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {positive ? '+' : ''}{asset.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
