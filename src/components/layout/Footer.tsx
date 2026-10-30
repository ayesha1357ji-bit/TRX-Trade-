import React from 'react';
import { ShieldCheck, Lock, Clock, AlertTriangle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 bg-white text-slate-600 text-xs mt-auto">
      {/* Trading Sessions Status Bar */}
      <div className="border-b border-slate-200 bg-slate-50 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Global Markets:</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>New York (NYSE/CME): <strong className="text-slate-900">Active</strong></span>
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded overflow-hidden shadow-2xs inline-flex flex-shrink-0 bg-[#002D74]">
                <img src="/assets/aistudio/image_648bde8c.png" alt="Crypto.com" className="w-full h-full object-cover" />
              </span>
              <span>Crypto.com Feed 24/7: <strong className="text-slate-900">Live</strong></span>
            </span>
            <span className="hidden lg:flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Gold Spot (LBMA): <strong className="text-slate-900">Live</strong></span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-blue-600" />
              <span>256-Bit SSL AES</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              <span>Cold Storage Custody</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white text-xs shadow-xs">
                TRX
              </div>
              <span className="font-black text-slate-950 text-base tracking-wider">
                TRX<span className="text-blue-600">TRADE</span>
              </span>
            </div>
            <p className="text-[12px] text-slate-600 leading-relaxed">
              Premier high-performance trading terminal for Cryptocurrencies, Physical Gold Spot, US Equities, and Foreign Exchange.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-blue-700 font-mono font-bold">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>FinCEN MSB Ready Architecture</span>
            </div>
          </div>

          {/* Markets Col */}
          <div>
            <h4 className="text-slate-900 font-bold mb-3 uppercase tracking-wider text-[11px]">Asset Classes</h4>
            <ul className="space-y-1.5 text-[12px]">
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Digital Assets (BTC, ETH, SOL)</li>
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Precious Metals (XAU Gold Spot, XAG)</li>
              <li className="hover:text-blue-600 transition-colors cursor-pointer">US Blue-Chip Equities (NVDA, AAPL)</li>
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Major Forex (EUR/USD, GBP/USD)</li>
              <li className="hover:text-blue-600 transition-colors cursor-pointer">Perpetual Futures (Up to 100x)</li>
            </ul>
          </div>

          {/* Technology & Execution */}
          <div>
            <h4 className="text-slate-900 font-bold mb-3 uppercase tracking-wider text-[11px]">Execution Engine</h4>
            <ul className="space-y-1.5 text-[12px] text-slate-600">
              <li>Sub-15ms Latency Order Matching</li>
              <li>High/Low Derivative Options</li>
              <li>Flexible Durations: 30s to 5 Min</li>
              <li>Tiered Capital Allocation ($500 - $1M)</li>
              <li>Crypto.com WebSocket Streaming</li>
            </ul>
          </div>

          {/* Compliance & Security */}
          <div>
            <h4 className="text-slate-900 font-bold mb-3 uppercase tracking-wider text-[11px]">Regulatory Compliance</h4>
            <ul className="space-y-1.5 text-[12px] text-slate-600">
              <li>US Bank Routing (Fedwire / ACH)</li>
              <li>CIP & BSA / AML Compliance Standards</li>
              <li>Separated Client Funds in Tier-1 US Banks</li>
              <li>Two-Factor Cryptographic Authentication</li>
              <li>Zero-Trust Data Protection</li>
            </ul>
          </div>
        </div>

        {/* Regulatory Disclaimers & Risk Warning */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>High-Risk Derivatives & Regulatory Disclaimer</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Trading financial instruments, including cryptocurrency futures, foreign exchange, gold contracts, and short-duration high/low contracts carries a high level of market risk and may result in the loss of your invested capital. You should not invest money that you cannot afford to lose. TRXTRADE provides access to live demo trading accounts with virtual funds for practice and strategy verification prior to real-money execution. Real-money accounts and withdrawals are subject to US regulatory identity verification, compliance approval, and authorized banking settlement rails.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-slate-200">
            <span>&copy; {new Date().getFullYear()} TRXTRADE Financial Technologies Inc. All rights reserved.</span>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span>Server Sync: {new Date().toISOString().slice(0, 10)}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
