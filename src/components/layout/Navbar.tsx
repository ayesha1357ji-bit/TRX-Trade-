import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  Wallet,
  Compass,
  Home,
  ShieldCheck,
  ChevronDown,
  RotateCcw,
  PlusCircle,
  LogOut,
  User,
  Sliders,
  DollarSign,
  Sparkles,
  ShieldAlert,
  Headphones,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'home' | 'markets' | 'trade' | 'wallet' | 'admin';
  setCurrentTab: (tab: 'home' | 'markets' | 'trade' | 'wallet' | 'admin') => void;
  openAuthModal: () => void;
  openDepositModal: () => void;
  openCustomerSupport?: () => void;
  openAccountModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openAuthModal,
  openDepositModal,
  openCustomerSupport,
  openAccountModal,
}) => {
  const {
    currentUser,
    userProfile,
    tradingMode,
    switchTradingMode,
    resetDemoBalance,
    logout,
    isAdmin,
  } = useAuth();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const demoBalance = userProfile?.demoBalance ?? 50000;
  const realBalance = userProfile?.realBalance ?? 0;
  const currentBalance = tradingMode === 'demo' ? demoBalance : realBalance;

  const handleResetDemo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setResetting(true);
    await resetDemoBalance();
    setTimeout(() => setResetting(false), 600);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left: Brand & Partner Badge in Top Corner */}
        <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
          <div
            className="flex items-center gap-1.5 sm:gap-2 text-left select-none flex-shrink-0 cursor-default"
          >
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 via-[#2563EB] to-indigo-700 flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.3)] ring-1 ring-blue-500/40 flex-shrink-0">
              <span className="font-black text-white text-[11px] sm:text-sm tracking-tighter">TRX</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-sm sm:text-lg tracking-wider text-slate-950">
                  TRX<span className="text-blue-600">TRADE</span>
                </span>
                <span className="text-[8px] sm:text-[10px] font-mono uppercase px-1 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold hidden sm:inline">
                  GLOBAL
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono hidden sm:block">
                Premier Digital Asset Exchange
              </p>
            </div>
          </div>

          {/* Partner & Regulatory Pill - Visible on tablet and desktop, streamlined on mobile */}
          <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl bg-blue-50/90 border border-blue-200 text-[9px] sm:text-[10px] text-blue-950 font-mono shadow-2xs">
            <div className="w-4 h-4 rounded-md overflow-hidden shadow-xs flex-shrink-0 bg-[#002D74]">
              <img
                src="/assets/aistudio/image_648bde8c.png"
                alt="Crypto.com"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-[#002D74]">Crypto.com</span>
              <span className="px-1 py-0.2 rounded text-[8px] sm:text-[9px] bg-[#002D74] text-white font-black uppercase tracking-tight">
                MERGER
              </span>
            </div>
            <span className="hidden xs:inline text-slate-300">|</span>
            <span className="hidden xs:flex items-center gap-1 text-blue-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              Live Feed
            </span>
          </div>
        </div>

        {/* Center: Main Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              currentTab === 'home'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-600 hover:bg-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setCurrentTab('markets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              currentTab === 'markets'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-600 hover:bg-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Markets</span>
          </button>

          <button
            onClick={() => setCurrentTab('trade')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              currentTab === 'trade'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-600 hover:bg-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Terminal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            onClick={() => setCurrentTab('wallet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              currentTab === 'wallet'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-600 hover:bg-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Wallet</span>
          </button>

          {/* Admin link strictly visible only to authorized admin */}
          {isAdmin && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-blue-700 hover:text-blue-800 hover:bg-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}
        </nav>

        {/* Right: Account & Balance / Auth */}
        <div className="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">
          {currentUser ? (
            <>
              {/* Demo vs Real Mode Toggle */}
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-0.5 sm:p-1 flex items-center shadow-inner flex-shrink-0">
                <button
                  onClick={() => switchTradingMode('demo')}
                  className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-black transition-all cursor-pointer ${
                    tradingMode === 'demo'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  DEMO
                </button>
                <button
                  onClick={() => switchTradingMode('real')}
                  className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                    tradingMode === 'real'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  LIVE
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </button>
              </div>

              {/* Balance Pill */}
              <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-right flex-shrink-0">
                <div>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider font-mono hidden sm:block">
                    {tradingMode === 'demo' ? 'Virtual Balance' : 'Real Equity'}
                  </p>
                  <p className="text-[11px] sm:text-sm font-black font-mono text-slate-950">
                    <span className="sm:hidden">
                      ${currentBalance >= 1000000
                        ? `${(currentBalance / 1000000).toFixed(1)}M`
                        : currentBalance >= 10000
                        ? `${(currentBalance / 1000).toFixed(1)}k`
                        : currentBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="hidden sm:inline">
                      ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>
                {tradingMode === 'demo' ? (
                  <button
                    onClick={handleResetDemo}
                    title="Reset virtual balance to $50,000"
                    className={`p-1 sm:p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 transition-all cursor-pointer ${
                      resetting ? 'animate-spin text-blue-600' : ''
                    }`}
                  >
                    <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={openDepositModal}
                    className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-[11px] font-black flex items-center gap-1 shadow-xs transition-all hover:scale-102 cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Deposit</span>
                  </button>
                )}
              </div>

              {/* User Dropdown / Account Option [ A v ] */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 640 && openAccountModal) {
                      openAccountModal();
                    } else {
                      setUserDropdownOpen(!userDropdownOpen);
                    }
                  }}
                  aria-label="Account Menu"
                  title="Account Menu"
                  className="flex items-center gap-1 sm:gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-800 transition-all cursor-pointer shadow-2xs flex-shrink-0"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] sm:text-xs font-black text-white shadow-xs flex-shrink-0">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'A'}
                  </div>
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 sm:w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-black text-slate-900 truncate">
                        {currentUser.displayName || 'Verified Trading Account'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate font-mono">
                        {currentUser.email || 'Registered Trader'}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-blue-600 font-bold">
                        <Sparkles className="w-3 h-3" />
                        <span>{tradingMode === 'demo' ? 'Active in Sandbox Mode' : 'Live Trading Active'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentTab('wallet');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 transition-all text-left cursor-pointer"
                    >
                      <Wallet className="w-4 h-4 text-blue-600" />
                      <span>Wallet & Portfolio</span>
                    </button>

                    <button
                      onClick={() => {
                        openDepositModal();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 transition-all text-left cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span>Deposit / Funding</span>
                    </button>

                    {openCustomerSupport && (
                      <button
                        onClick={() => {
                          openCustomerSupport();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-blue-600 hover:bg-blue-50 transition-all text-left font-bold cursor-pointer"
                      >
                        <Headphones className="w-4 h-4 text-blue-600" />
                        <span>Contact Customer Service</span>
                      </button>
                    )}

                    {/* Strictly only show if admin */}
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setCurrentTab('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-indigo-700 hover:bg-indigo-50 font-black transition-all text-left cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-indigo-600" />
                        <span>Admin Command Center</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 transition-all text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black tracking-wide shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create Account / Sign In</span>
              <span className="sm:hidden">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
