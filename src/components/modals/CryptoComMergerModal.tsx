import React from 'react';
import { ShieldCheck, CheckCircle2, ArrowRight, Zap, Award, Sparkles, X, ExternalLink } from 'lucide-react';

interface CryptoComMergerModalProps {
  isOpen: boolean;
  onClose: () => void;
  openDepositModal: () => void;
  setCurrentTab: (tab: 'home' | 'markets' | 'trade' | 'wallet' | 'admin') => void;
}

export const CryptoComMergerModal: React.FC<CryptoComMergerModalProps> = ({
  isOpen,
  onClose,
  openDepositModal,
  setCurrentTab,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Hero Banner with Official Crypto.com Navy & Royal Blue */}
        <div className="bg-gradient-to-br from-[#002D74] via-[#0B3A82] to-[#1D4ED8] p-6 sm:p-7 text-white relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1 pr-1 sm:pr-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 border border-white/25 text-[10px] font-mono uppercase tracking-wider font-bold">
                  Official Platform Announcement
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                TRXTRADE × Crypto.com
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1">
                We are proud to announce the strategic operational merger with <strong>Crypto.com</strong>, establishing high-performance binary clearing.
              </p>
            </div>

            {/* Official Crypto.com Logo Image Badge (Placed right at marked position) */}
            <div className="relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-xl border-2 border-white/40 ring-4 ring-white/15 bg-[#002D74] mr-8">
              <img
                src="/assets/aistudio/image_648bde8c.png"
                alt="Crypto.com Official Emblem"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Verification Badge */}
          <div className="mt-4 flex items-center gap-2 text-xs font-mono text-blue-100">
            <div className="w-5 h-5 rounded-md overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
              <img src="/assets/aistudio/image_648bde8c.png" alt="Crypto.com" className="w-full h-full object-cover" />
            </div>
            <span>Verified Liquidity Partnership • 100% Backed Reserves</span>
          </div>
        </div>

        {/* Modal Body: Merger Highlights */}
        <div className="p-5 sm:p-6 space-y-3.5 bg-white text-slate-800 text-xs sm:text-sm">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-100">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                Up to 60% Payout & 5-Minute Contracts
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                New multi-tier nodes: 30s (15%), 60s (20%), 120s (30%), 3m (40%), 4m (50%), and 5m (60%) with execution caps up to $1,000,000 USD.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-blue-200/80 shadow-xs flex-shrink-0 bg-[#002D74]">
              <img
                src="/assets/aistudio/image_648bde8c.png"
                alt="Crypto.com Liquidity Engine"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                Crypto.com Deep Liquidity Engine
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                Orders settle with zero-slippage directly against high-depth Crypto.com liquidity pools for BTC, ETH, Gold, and US equities.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                Direct Crypto Deposit Gateway
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                Fund your live trading account in seconds using Tether (USDT), Ethereum (ETH), or Bitcoin (BTC).
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={() => {
              onClose();
              openDepositModal();
            }}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#002D74] hover:bg-[#00235C] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <ShieldCheck className="w-4 h-4 text-blue-300" />
            <span>Deposit USDT / Crypto</span>
          </button>

          <button
            onClick={() => {
              onClose();
              setCurrentTab('trade');
            }}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-98"
          >
            <span>Enter Terminal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
