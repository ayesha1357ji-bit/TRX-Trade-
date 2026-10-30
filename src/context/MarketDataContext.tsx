import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MarketAsset, Candle } from '../types';
import { INITIAL_ASSETS, generateHistoricalCandles, fetchLiveCryptoPrices } from '../services/marketData';
import { useAuth } from './AuthContext';

export interface OrderBookItem {
  price: number;
  amount: number;
  total: number;
}

export interface MarketTradePrint {
  id: string;
  price: number;
  amount: number;
  time: string;
  side: 'buy' | 'sell';
}

interface MarketDataContextType {
  assets: MarketAsset[];
  selectedAsset: MarketAsset;
  candles: Candle[];
  timeframe: '1m' | '5m' | '15m' | '1h' | '1D';
  chartType: 'candles' | 'line';
  indicators: {
    sma20: boolean;
    ema50: boolean;
    bollinger: boolean;
    volume: boolean;
  };
  orderBook: {
    bids: OrderBookItem[];
    asks: OrderBookItem[];
    spread: number;
  };
  recentTrades: MarketTradePrint[];
  setSelectedAsset: (asset: MarketAsset) => void;
  setTimeframe: (tf: '1m' | '5m' | '15m' | '1h' | '1D') => void;
  setChartType: (type: 'candles' | 'line') => void;
  toggleIndicator: (indicator: 'sma20' | 'ema50' | 'bollinger' | 'volume') => void;
}

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined);

export const MarketDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { systemSettings } = useAuth();
  const [assets, setAssets] = useState<MarketAsset[]>(INITIAL_ASSETS);
  const [selectedAsset, setSelectedAssetState] = useState<MarketAsset>(INITIAL_ASSETS[0]);
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1D'>('1m');
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const [indicators, setIndicators] = useState({
    sma20: true,
    ema50: false,
    bollinger: true,
    volume: true,
  });

  const [candles, setCandles] = useState<Candle[]>([]);
  const [recentTrades, setRecentTrades] = useState<MarketTradePrint[]>([]);
  const selectedAssetRef = useRef(selectedAsset);
  selectedAssetRef.current = selectedAsset;

  // Generate candles whenever selected asset or timeframe changes
  useEffect(() => {
    const tfMinutes = timeframe === '1m' ? 1 : timeframe === '5m' ? 5 : timeframe === '15m' ? 15 : timeframe === '1h' ? 60 : 1440;
    const generated = generateHistoricalCandles(selectedAsset.price, 240, tfMinutes);
    setCandles(generated);

    // Generate initial recent trades
    const trades: MarketTradePrint[] = [];
    const now = Date.now();
    for (let i = 0; i < 15; i++) {
      const delta = (Math.random() - 0.5) * (selectedAsset.price * 0.0006);
      const price = selectedAsset.price + delta;
      const amount = Number((Math.random() * 2.5 + 0.05).toFixed(3));
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      const timeStr = new Date(now - i * 1400).toLocaleTimeString('en-US', { hour12: false });
      trades.push({
        id: 'trade_' + (now - i * 1400),
        price: Number(price.toFixed(selectedAsset.price < 5 ? 4 : 2)),
        amount,
        time: timeStr,
        side,
      });
    }
    setRecentTrades(trades);
  }, [selectedAsset.id, timeframe]);

  // Periodic real crypto price sync from Binance
  useEffect(() => {
    const syncRealCrypto = async () => {
      const prices = await fetchLiveCryptoPrices();
      if (!prices || Object.keys(prices).length === 0) return;

      setAssets((prev) =>
        prev.map((asset) => {
          if (asset.binanceSymbol && prices[asset.binanceSymbol]) {
            const livePrice = prices[asset.binanceSymbol];
            return {
              ...asset,
              price: livePrice,
            };
          }
          return asset;
        })
      );
    };

    syncRealCrypto();
    const interval = setInterval(syncRealCrypto, 8000);
    return () => clearInterval(interval);
  }, []);

  // High-frequency live tick generator (real-time price pulsation & candle updating with direction overrides)
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setAssets((prevAssets) => {
        return prevAssets.map((asset) => {
          // Micro tick with natural drift or admin direction overrides
          const volatility = asset.price * 0.00025;
          const bias = systemSettings?.directionOverrides?.[asset.symbol] || 'AUTO';
          let delta = (Math.random() - 0.495) * volatility;
          if (bias === 'FORCE_UP') {
            delta = (Math.random() * 0.65 + 0.1) * volatility;
          } else if (bias === 'FORCE_DOWN') {
            delta = -(Math.random() * 0.65 + 0.1) * volatility;
          }
          const newPrice = Number((asset.price + delta).toFixed(asset.price < 5 ? 4 : 2));

          const newHigh = Math.max(asset.high24h, newPrice);
          const newLow = Math.min(asset.low24h, newPrice);

          return {
            ...asset,
            price: newPrice,
            high24h: newHigh,
            low24h: newLow,
          };
        });
      });

      // Update current selected asset price and current candle
      const curr = selectedAssetRef.current;
      const volatility = curr.price * 0.0003;
      const currBias = systemSettings?.directionOverrides?.[curr.symbol] || 'AUTO';
      let tickDelta = (Math.random() - 0.49) * volatility;
      if (currBias === 'FORCE_UP') {
        tickDelta = (Math.random() * 0.7 + 0.15) * volatility;
      } else if (currBias === 'FORCE_DOWN') {
        tickDelta = -(Math.random() * 0.7 + 0.15) * volatility;
      }
      const tickPrice = Number((curr.price + tickDelta).toFixed(curr.price < 5 ? 4 : 2));

      setSelectedAssetState((prev) => ({
        ...prev,
        price: tickPrice,
      }));

      // Update the active candle in real-time
      setCandles((prevCandles) => {
        if (prevCandles.length === 0) return prevCandles;
        const lastIndex = prevCandles.length - 1;
        const lastCandle = prevCandles[lastIndex];

        const updatedLast: Candle = {
          ...lastCandle,
          close: tickPrice,
          high: Math.max(lastCandle.high, tickPrice),
          low: Math.min(lastCandle.low, tickPrice),
          volume: lastCandle.volume + Math.floor(Math.random() * 20),
        };

        const copy = [...prevCandles];
        copy[lastIndex] = updatedLast;
        return copy;
      });

      // Inject new trade print
      const side: 'buy' | 'sell' = tickDelta >= 0 ? 'buy' : 'sell';
      const newTradePrint: MarketTradePrint = {
        id: 'tick_' + Date.now(),
        price: tickPrice,
        amount: Number((Math.random() * 1.5 + 0.02).toFixed(3)),
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        side,
      };

      setRecentTrades((prev) => [newTradePrint, ...prev.slice(0, 19)]);
    }, 1200);

    return () => clearInterval(tickInterval);
  }, []);

  const setSelectedAsset = (asset: MarketAsset) => {
    setSelectedAssetState(asset);
  };

  const toggleIndicator = (key: 'sma20' | 'ema50' | 'bollinger' | 'volume') => {
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Compute live synthetic order book with realistic depth
  const currentPrice = selectedAsset.price;
  const spreadFraction = currentPrice < 5 ? 0.0004 : 0.0002;
  const spread = Number((currentPrice * spreadFraction).toFixed(currentPrice < 5 ? 4 : 2));

  const asks: OrderBookItem[] = [];
  const bids: OrderBookItem[] = [];
  let askTotal = 0;
  let bidTotal = 0;

  for (let i = 1; i <= 6; i++) {
    const askP = Number((currentPrice + spread * i).toFixed(currentPrice < 5 ? 4 : 2));
    const askAmt = Number((Math.random() * 1.8 + 0.1).toFixed(2));
    askTotal += askAmt;
    asks.push({ price: askP, amount: askAmt, total: Number(askTotal.toFixed(2)) });

    const bidP = Number((currentPrice - spread * i).toFixed(currentPrice < 5 ? 4 : 2));
    const bidAmt = Number((Math.random() * 2.2 + 0.15).toFixed(2));
    bidTotal += bidAmt;
    bids.push({ price: bidP, amount: bidAmt, total: Number(bidTotal.toFixed(2)) });
  }

  const orderBook = {
    asks: asks.reverse(), // Top to bottom (higher asks first)
    bids,
    spread,
  };

  return (
    <MarketDataContext.Provider
      value={{
        assets,
        selectedAsset,
        candles,
        timeframe,
        chartType,
        indicators,
        orderBook,
        recentTrades,
        setSelectedAsset,
        setTimeframe,
        setChartType,
        toggleIndicator,
      }}
    >
      {children}
    </MarketDataContext.Provider>
  );
};

export const useMarketData = () => {
  const context = useContext(MarketDataContext);
  if (!context) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  return context;
};
