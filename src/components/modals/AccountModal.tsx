import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  User,
  Mail,
  Wallet,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Headphones,
  LogOut,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  setCurrentTab: (tab: 'home' | 'markets' | 'trade' | 'wallet' | 'admin') => void;
  openDepositModal: () => void;
  openCustomerSupport: () => void;
  openAuthModal: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  setCurrentTab,
  openDepositModal,
  openCustomerSupport,
  openAuthModal,
}) => {
  const { currentUser, userProfile, tradingMode, switchTradingMode, logout, isAdmin } = useAuth();

  if (!isOpen) return null;

  const realBalance = userProfile?.realBalance ?? 0;
  const demoBalance = userProfile?.demoBalance ?? 50000;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 safe-area-inset-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Trading Account</h3>
              <p className="text-[10px] text-slate-500 font-mono">Profile & Portfolio Controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {currentUser ? (
            <>
              {/* User Profile Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-white border border-blue-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-blue-500/20">
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'A'}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-950">
                        {currentUser.displayName || 'Verified Trader'}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-mono font-bold border border-blue-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-blue-600" />
                    Verified
                  </span>
                </div>

                {/* Mode Selector */}
                <div className="pt-2 border-t border-blue-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-semibold">Active Mode:</span>
                  <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200">
                    <button
                      onClick={() => switchTradingMode('demo')}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        tradingMode === 'demo'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      DEMO
                    </button>
                    <button
                      onClick={() => switchTradingMode('real')}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                        tradingMode === 'real'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      LIVE
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Balances Summary */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
                    Real Equity
                  </span>
                  <span className="text-sm font-black font-mono text-slate-950">
                    ${realBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
                    Virtual Sandbox
                  </span>
                  <span className="text-sm font-black font-mono text-blue-700">
                    ${demoBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Quick Actions List */}
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    openDepositModal();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4" />
                    <span>Deposit Funds (USDT / ETH / BTC)</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 opacity-80" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    setCurrentTab('wallet');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-blue-600" />
                    <span>Treasury & Wallet Management</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    openCustomerSupport();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Headphones className="w-4 h-4 text-blue-600" />
                    <span>Live Customer Support (24/7)</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      onClose();
                      setCurrentTab('admin');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-black text-xs transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-indigo-600" />
                      <span>Admin Command Center</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-indigo-500" />
                  </button>
                )}
              </div>

              {/* Sign Out */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Sign In to TRXTRADE</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Access your live wallet, high/low contract settlement, and multi-asset positions.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  openAuthModal();
                }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all cursor-pointer"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
