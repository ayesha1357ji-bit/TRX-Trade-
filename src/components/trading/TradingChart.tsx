import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useMarketData } from '../../context/MarketDataContext';
import { useAuth } from '../../context/AuthContext';
import { Candle } from '../../types';
import {
  BarChart3,
  LineChart,
  Layers,
  Clock,
  TrendingUp,
  TrendingDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  History,
  MoveHorizontal,
} from 'lucide-react';

export const TradingChart: React.FC = () => {
  const {
    selectedAsset,
    candles,
    timeframe,
    setTimeframe,
    chartType,
    setChartType,
    indicators,
    toggleIndicator,
  } = useMarketData();

  const { activeTrades } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan and Zoom Navigation State
  const [panOffset, setPanOffset] = useState<number>(0); // 0 = at live edge, > 0 = panned back into history
  const [visibleCandleCount, setVisibleCandleCount] = useState<number>(55); // Zoom level: number of visible candles
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartPanOffset, setDragStartPanOffset] = useState<number>(0);
  const [hasDragged, setHasDragged] = useState<boolean>(false);

  // Touch Pinch-to-zoom state
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);
  const [touchStartCount, setTouchStartCount] = useState<number>(55);

  // Mouse Crosshair State
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState<boolean>(false);

  // Filter active trades for currently selected asset
  const assetActiveTrades = useMemo(() => {
    return activeTrades.filter((t) => t.symbol === selectedAsset.symbol);
  }, [activeTrades, selectedAsset.symbol]);

  // Compute Moving Average (SMA 20) on entire dataset
  const sma20 = useMemo(() => {
    const period = 20;
    const values: (number | null)[] = [];
    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        values.push(null);
      } else {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += candles[i - j].close;
        }
        values.push(sum / period);
      }
    }
    return values;
  }, [candles]);

  // Compute Bollinger Bands (20, 2) on entire dataset
  const bollingerBands = useMemo(() => {
    const period = 20;
    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];
    const middle: (number | null)[] = [];

    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        upper.push(null);
        lower.push(null);
        middle.push(null);
      } else {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += candles[i - j].close;
        }
        const mean = sum / period;
        middle.push(mean);

        let varianceSum = 0;
        for (let j = 0; j < period; j++) {
          varianceSum += Math.pow(candles[i - j].close - mean, 2);
        }
        const stdDev = Math.sqrt(varianceSum / period);
        upper.push(mean + stdDev * 2);
        lower.push(mean - stdDev * 2);
      }
    }
    return { upper, lower, middle };
  }, [candles]);

  // Calculate visible window of candles based on panOffset and visibleCandleCount
  const totalCandles = candles.length;
  const maxPanOffset = Math.max(0, totalCandles - Math.min(totalCandles, visibleCandleCount));
  const clampedPanOffset = Math.min(maxPanOffset, Math.max(0, panOffset));

  const endIndex = Math.min(totalCandles, Math.max(visibleCandleCount, totalCandles - clampedPanOffset));
  const startIndex = Math.max(0, endIndex - visibleCandleCount);

  const visibleCandles = useMemo(() => {
    return candles.slice(startIndex, endIndex);
  }, [candles, startIndex, endIndex]);

  const visibleSma20 = useMemo(() => {
    return sma20.slice(startIndex, endIndex);
  }, [sma20, startIndex, endIndex]);

  const visibleBollinger = useMemo(() => {
    return {
      upper: bollingerBands.upper.slice(startIndex, endIndex),
      lower: bollingerBands.lower.slice(startIndex, endIndex),
      middle: bollingerBands.middle.slice(startIndex, endIndex),
    };
  }, [bollingerBands, startIndex, endIndex]);

  // Reset pan offset if asset or timeframe changes
  useEffect(() => {
    setPanOffset(0);
  }, [selectedAsset.id, timeframe]);

  // Zoom handlers
  const handleZoomIn = () => {
    setVisibleCandleCount((prev) => Math.max(15, prev - 8));
  };

  const handleZoomOut = () => {
    setVisibleCandleCount((prev) => Math.min(Math.min(candles.length, 160), prev + 8));
  };

  const handlePanStep = (direction: 'left' | 'right') => {
    const step = Math.max(5, Math.round(visibleCandleCount * 0.25));
    if (direction === 'left') {
      // Pan into earlier history
      setPanOffset((prev) => Math.min(maxPanOffset, prev + step));
    } else {
      // Pan forward toward live price
      setPanOffset((prev) => Math.max(0, prev - step));
    }
  };

  const handleResetToLive = () => {
    setPanOffset(0);
  };

  // Main Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return;

    // Clear background with crisp White
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    if (visibleCandles.length === 0) return;

    const paddingRight = 72; // Price axis space
    const paddingBottom = 26; // Time axis space
    const chartWidth = width - paddingRight;
    const chartHeight = height - paddingBottom;
    const volumeHeight = chartHeight * 0.16;

    // Determine min/max price range dynamically from visible candles
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    visibleCandles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    });

    // If at live edge, include current asset price in range
    if (clampedPanOffset === 0) {
      if (selectedAsset.price < minPrice) minPrice = selectedAsset.price;
      if (selectedAsset.price > maxPrice) maxPrice = selectedAsset.price;
    }

    // Also include active trades entry price if visible
    assetActiveTrades.forEach((t) => {
      if (t.entryPrice < minPrice && clampedPanOffset === 0) minPrice = t.entryPrice;
      if (t.entryPrice > maxPrice && clampedPanOffset === 0) maxPrice = t.entryPrice;
    });

    const priceBuffer = (maxPrice - minPrice) * 0.09 || 1;
    minPrice -= priceBuffer;
    maxPrice += priceBuffer;

    const priceRange = maxPrice - minPrice;

    const getY = (price: number) => {
      return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };

    const candleCount = visibleCandles.length;
    const stepX = chartWidth / candleCount;
    const candleWidth = Math.max(3, Math.min(26, stepX * 0.72));

    // Draw Subtle Grid Lines
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.9)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const gridSteps = 6;
    for (let i = 0; i <= gridSteps; i++) {
      const p = minPrice + (priceRange / gridSteps) * i;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Price labels on right
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p.toFixed(selectedAsset.price < 5 ? 4 : 2), chartWidth + 6, y + 4);
    }
    ctx.setLineDash([]);

    // Draw Volume Bars
    if (indicators.volume && maxVolume > 0) {
      visibleCandles.forEach((c, i) => {
        const x = i * stepX + stepX / 2;
        const volBarH = (c.volume / maxVolume) * volumeHeight;
        const isUp = c.close >= c.open;
        ctx.fillStyle = isUp ? 'rgba(37, 99, 235, 0.16)' : 'rgba(239, 68, 68, 0.16)';
        ctx.fillRect(x - candleWidth / 2, chartHeight - volBarH, candleWidth, volBarH);
      });
    }

    // Draw Bollinger Bands (fill + lines)
    if (indicators.bollinger) {
      // Shaded area
      ctx.fillStyle = 'rgba(37, 99, 235, 0.04)';
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < visibleCandles.length; i++) {
        const u = visibleBollinger.upper[i];
        if (u !== null && u !== undefined) {
          const x = i * stepX + stepX / 2;
          const y = getY(u);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      for (let i = visibleCandles.length - 1; i >= 0; i--) {
        const l = visibleBollinger.lower[i];
        if (l !== null && l !== undefined) {
          const x = i * stepX + stepX / 2;
          const y = getY(l);
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      // Band lines
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      let upperStarted = false;
      visibleCandles.forEach((_, i) => {
        const u = visibleBollinger.upper[i];
        if (u !== null && u !== undefined) {
          const x = i * stepX + stepX / 2;
          const y = getY(u);
          if (!upperStarted) {
            ctx.moveTo(x, y);
            upperStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();

      ctx.beginPath();
      let lowerStarted = false;
      visibleCandles.forEach((_, i) => {
        const l = visibleBollinger.lower[i];
        if (l !== null && l !== undefined) {
          const x = i * stepX + stepX / 2;
          const y = getY(l);
          if (!lowerStarted) {
            ctx.moveTo(x, y);
            lowerStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    }

    // Draw SMA 20 line
    if (indicators.sma20) {
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      visibleCandles.forEach((_, i) => {
        const val = visibleSma20[i];
        if (val !== null && val !== undefined) {
          const x = i * stepX + stepX / 2;
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    }

    // Draw Candlesticks or Area Chart
    if (chartType === 'candles') {
      visibleCandles.forEach((c, i) => {
        const x = i * stepX + stepX / 2;
        const isUp = c.close >= c.open;
        const candleColor = isUp ? '#2563EB' : '#EF4444';

        // Draw Wick
        ctx.strokeStyle = candleColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, getY(c.high));
        ctx.lineTo(x, getY(c.low));
        ctx.stroke();

        // Draw Body
        const topY = getY(Math.max(c.open, c.close));
        const bottomY = getY(Math.min(c.open, c.close));
        const bodyHeight = Math.max(1.5, bottomY - topY);

        ctx.fillStyle = candleColor;
        ctx.fillRect(x - candleWidth / 2, topY, candleWidth, bodyHeight);
      });
    } else {
      // Area / Line Chart
      const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.28)');
      gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

      ctx.beginPath();
      visibleCandles.forEach((c, i) => {
        const x = i * stepX + stepX / 2;
        const y = getY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      // Close path for gradient
      ctx.lineTo(chartWidth, chartHeight);
      ctx.lineTo(0, chartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Line stroke
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 2;
      ctx.beginPath();
      visibleCandles.forEach((c, i) => {
        const x = i * stepX + stepX / 2;
        const y = getY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Draw Current Market Price Horizontal Line & Badge (if live edge is in view)
    const currentPriceY = getY(selectedAsset.price);
    if (currentPriceY >= 0 && currentPriceY <= chartHeight) {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = clampedPanOffset === 0 ? '#2563EB' : 'rgba(37, 99, 235, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, currentPriceY);
      ctx.lineTo(chartWidth, currentPriceY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Right-hand Current Price Badge
      ctx.fillStyle = clampedPanOffset === 0 ? '#1D4ED8' : '#64748B';
      ctx.beginPath();
      ctx.roundRect(chartWidth + 2, currentPriceY - 10, paddingRight - 4, 20, 5);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        selectedAsset.price.toFixed(selectedAsset.price < 5 ? 4 : 2),
        chartWidth + paddingRight / 2,
        currentPriceY + 4
      );
    }

    // Draw Active Trades overlay lines
    assetActiveTrades.forEach((trade) => {
      const tradeY = getY(trade.entryPrice);
      if (tradeY >= 0 && tradeY <= chartHeight) {
        const isUp = trade.direction === 'HIGH';
        const color = isUp ? '#2563EB' : '#EF4444';

        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, tradeY);
        ctx.lineTo(chartWidth, tradeY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Badge on left
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(4, tradeY - 9, 64, 18, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${trade.direction} $${trade.amount}`, 36, tradeY + 4);
      }
    });

    // Time labels on bottom axis
    ctx.fillStyle = '#64748B';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const timeStepCount = Math.min(7, Math.floor(candleCount / 7));
    if (timeStepCount > 0) {
      const stepInterval = Math.max(1, Math.floor(candleCount / timeStepCount));
      for (let i = 0; i < candleCount; i += stepInterval) {
        const c = visibleCandles[i];
        if (c) {
          const x = i * stepX + stepX / 2;
          const timeStr = new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          ctx.fillText(timeStr, x, height - 8);
        }
      }
    }

    // Crosshair on hover (only when not dragging)
    if (!isDragging && mousePos && mousePos.x < chartWidth && mousePos.y < chartHeight) {
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, chartHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(chartWidth, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Hover Price Badge
      const hoverPrice = maxPrice - (mousePos.y / chartHeight) * priceRange;
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.roundRect(chartWidth + 2, mousePos.y - 9, paddingRight - 4, 18, 4);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        hoverPrice.toFixed(selectedAsset.price < 5 ? 4 : 2),
        chartWidth + paddingRight / 2,
        mousePos.y + 4
      );
    }
  }, [
    visibleCandles,
    chartType,
    indicators,
    selectedAsset.price,
    visibleSma20,
    visibleBollinger,
    assetActiveTrades,
    mousePos,
    isDragging,
    clampedPanOffset,
  ]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // MOUSE INTERACTION HANDLERS FOR DRAG-TO-PAN
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartPanOffset(panOffset);
    setHasDragged(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || visibleCandles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      const deltaPx = e.clientX - dragStartX;
      if (Math.abs(deltaPx) > 3) {
        setHasDragged(true);
      }
      // Dragging to right (deltaPx > 0) pulls historical candles in, increasing panOffset
      const chartWidth = canvas.width - 72;
      const stepX = chartWidth / visibleCandleCount;
      const deltaCandles = Math.round(deltaPx / stepX);
      const newPan = Math.min(maxPanOffset, Math.max(0, dragStartPanOffset + deltaCandles));
      setPanOffset(newPan);
      setMousePos(null);
      setHoveredCandle(null);
    } else {
      setMousePos({ x, y });
      const chartWidth = canvas.width - 72;
      if (x >= 0 && x <= chartWidth && visibleCandles.length > 0) {
        const stepX = chartWidth / visibleCandles.length;
        const index = Math.floor(x / stepX);
        if (index >= 0 && index < visibleCandles.length) {
          setHoveredCandle(visibleCandles[index]);
        }
      } else {
        setHoveredCandle(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setMousePos(null);
    setHoveredCandle(null);
  };

  // MOUSE WHEEL ZOOM
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 5 : -5;
    setVisibleCandleCount((prev) => {
      return Math.max(15, Math.min(Math.min(candles.length, 160), prev + zoomDelta));
    });
  };

  // TOUCH INTERACTION HANDLERS (MOBILE DRAG & PINCH-TO-ZOOM)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStartX(e.touches[0].clientX);
      setDragStartPanOffset(panOffset);
      setHasDragged(false);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
      setTouchStartCount(visibleCandleCount);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDragging) {
      const deltaPx = e.touches[0].clientX - dragStartX;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const chartWidth = canvas.width - 72;
      const stepX = chartWidth / visibleCandleCount;
      const deltaCandles = Math.round(deltaPx / stepX);
      const newPan = Math.min(maxPanOffset, Math.max(0, dragStartPanOffset + deltaCandles));
      setPanOffset(newPan);
    } else if (e.touches.length === 2 && touchStartDist) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = touchStartDist / dist;
      const next = Math.max(15, Math.min(160, Math.round(touchStartCount * factor)));
      setVisibleCandleCount(next);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStartDist(null);
  };

  const activeCandle = hoveredCandle || visibleCandles[visibleCandles.length - 1] || candles[candles.length - 1];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs select-none">
      {/* Chart Top Header / Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-slate-50 border-b border-slate-200">
        {/* Left: Active OHLC Tooltip */}
        <div className="flex items-center gap-2.5 sm:gap-4 font-mono text-[11px] overflow-x-auto scrollbar-none py-0.5">
          {activeCandle && (
            <>
              <span className="text-slate-500">
                O: <strong className="text-slate-900">{activeCandle.open.toFixed(selectedAsset.price < 5 ? 4 : 2)}</strong>
              </span>
              <span className="text-slate-500">
                H: <strong className="text-blue-600">{activeCandle.high.toFixed(selectedAsset.price < 5 ? 4 : 2)}</strong>
              </span>
              <span className="text-slate-500">
                L: <strong className="text-rose-600">{activeCandle.low.toFixed(selectedAsset.price < 5 ? 4 : 2)}</strong>
              </span>
              <span className="text-slate-500">
                C: <strong className={activeCandle.close >= activeCandle.open ? 'text-blue-600' : 'text-rose-600'}>
                  {activeCandle.close.toFixed(selectedAsset.price < 5 ? 4 : 2)}
                </strong>
              </span>
              <span className="text-slate-500 hidden lg:inline">
                Vol: <strong className="text-slate-700">{(activeCandle.volume / 1000).toFixed(1)}k</strong>
              </span>
            </>
          )}
        </div>

        {/* Right: Controls (Navigation, Zoom, Timeframe, Chart Style, Indicators) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Pan Navigation Buttons (Move Left into History, Move Right toward Live) */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            <button
              onClick={() => handlePanStep('left')}
              title="Pan Left (View Previous Chart History)"
              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePanStep('right')}
              disabled={clampedPanOffset === 0}
              title="Pan Right (Move Forward Toward Live Price)"
              className={`p-1.5 rounded-lg transition-all ${
                clampedPanOffset === 0
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-white cursor-pointer'
              }`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Buttons (+ / -) */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white transition-all cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white transition-all cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Timeframe pills */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            {(['1m', '5m', '15m', '1h', '1D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            <button
              onClick={() => setChartType('candles')}
              title="Candlestick View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'candles' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('line')}
              title="Area Line View"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'line' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Technical Indicators Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-bold transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Indicators</span>
            </button>

            {showIndicatorsMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in duration-100">
                <p className="px-2.5 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">
                  Overlays & Signals
                </p>
                <button
                  onClick={() => toggleIndicator('bollinger')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <span className="text-slate-700 font-bold">Bollinger Bands (20,2)</span>
                  <span className={`w-2 h-2 rounded-full ${indicators.bollinger ? 'bg-blue-600' : 'bg-slate-300'}`} />
                </button>
                <button
                  onClick={() => toggleIndicator('sma20')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <span className="text-slate-700 font-bold">SMA 20 Period</span>
                  <span className={`w-2 h-2 rounded-full ${indicators.sma20 ? 'bg-blue-600' : 'bg-slate-300'}`} />
                </button>
                <button
                  onClick={() => toggleIndicator('volume')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <span className="text-slate-700 font-bold">Volume Histogram</span>
                  <span className={`w-2 h-2 rounded-full ${indicators.volume ? 'bg-blue-600' : 'bg-slate-300'}`} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Canvas Area with Drag Navigation */}
      <div ref={containerRef} className="relative flex-1 w-full min-h-[240px] sm:min-h-[380px] bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`absolute inset-0 w-full h-full block ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        />

        {/* Historical Mode Alert Pill (when user is scrolled back into the past) */}
        {clampedPanOffset > 0 && (
          <div className="absolute top-3 left-4 z-10 flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-50/95 border border-amber-300 text-amber-900 text-xs font-mono font-bold shadow-xs backdrop-blur-md">
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span>Viewing Previous History ({clampedPanOffset} candles back)</span>
          </div>
        )}

        {/* Drag Helper Notice in corner */}
        <div className="absolute bottom-2 left-3 z-10 pointer-events-none hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-white/80 px-2 py-0.5 rounded-md border border-slate-100">
          <MoveHorizontal className="w-3 h-3 text-slate-400" />
          <span>Click & drag chart horizontally to view previous history • Scroll to zoom</span>
        </div>

        {/* Floating "Jump to Live" Button when panned back into history */}
        {clampedPanOffset > 0 && (
          <button
            onClick={handleResetToLive}
            className="absolute bottom-8 right-24 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-[0_6px_20px_rgba(37,99,235,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in zoom-in-95"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>Jump to Live</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Live Active Trade Overlay Floating Box */}
        {assetActiveTrades.length > 0 && (
          <div className="absolute top-12 left-4 z-10 flex flex-col gap-2 pointer-events-none">
            {assetActiveTrades.map((t) => {
              const remainingSec = Math.max(0, Math.ceil((t.closeTime - Date.now()) / 1000));
              const isProfit =
                t.direction === 'HIGH'
                  ? selectedAsset.price > t.entryPrice
                  : selectedAsset.price < t.entryPrice;
              return (
                <div
                  key={t.id}
                  className={`px-3 py-2 rounded-xl backdrop-blur-md border text-xs shadow-md pointer-events-auto ${
                    isProfit
                      ? 'bg-blue-50/95 border-blue-300 text-blue-900'
                      : 'bg-rose-50/95 border-rose-300 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {t.direction === 'HIGH' ? (
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                    )}
                    <span className="font-black">{t.direction} OPTION</span>
                    <span className="font-mono font-bold">${t.amount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[11px] mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{remainingSec}s left</span>
                    </span>
                    <span className="font-black">
                      {isProfit ? `+$${(t.amount * t.payoutRate).toFixed(0)} In Money` : 'Out of Money'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
