/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarketDataProvider, useMarketData } from './context/MarketDataContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomeView } from './views/HomeView';
import { MarketsView } from './views/MarketsView';
import { TradeView } from './views/TradeView';
import { WalletView } from './views/WalletView';
import { AdminView } from './views/AdminView';
import { AuthModal } from './components/auth/AuthModal';
import { DepositModal } from './components/wallet/DepositModal';
import { CustomerSupportModal } from './components/support/CustomerSupportModal';
import { CryptoComMergerModal } from './components/modals/CryptoComMergerModal';
import { AccountModal } from './components/modals/AccountModal';
import {
  TrendingUp,
  TrendingDown,
  Home,
  Compass,
  Wallet,
  ShieldAlert,
  Headphones,
  Sparkles,
  ArrowRight,
  User,
} from 'lucide-react';

const MarketTickerTape: React.FC<{ onSelectSymbol: (symbol: string) => void }> = ({ onSelectSymbol }) => {
  const { assets } = useMarketData();

  return (
    <div className="w-full bg-white border-b border-slate-200/80 overflow-x-auto scrollbar-none py-1.5 select-none shadow-2xs">
      <div className="flex items-center gap-4 sm:gap-6 whitespace-nowrap font-mono text-[11px] px-3">
        {assets.slice(0, 16).map((asset) => {
          const positive = asset.change24h >= 0;
          return (
            <button
              key={asset.id}
              onClick={() => onSelectSymbol(asset.symbol)}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg hover:bg-blue-50/80 transition-colors flex-shrink-0 cursor-pointer"
            >
              <span className="font-bold text-slate-700">{asset.symbol}</span>
              <span className="text-slate-950 font-bold">${asset.price.toFixed(asset.price < 5 ? 4 : 2)}</span>
              <span className={`flex items-center gap-0.5 font-semibold text-[10px] ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{positive ? '+' : ''}{asset.change24h.toFixed(2)}%</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'home' | 'markets' | 'trade' | 'wallet' | 'admin'>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [customerSupportOpen, setCustomerSupportOpen] = useState(false);
  const [cryptoMergerModalOpen, setCryptoMergerModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const { setSelectedAsset, assets } = useMarketData();
  const { isAdmin, currentUser, loading } = useAuth();

  // Show Crypto.com strategic merger announcement as soon as anyone logs in or registers
  React.useEffect(() => {
    if (currentUser) {
      const seenMerger = sessionStorage.getItem(`trxtrade_merger_seen_${currentUser.uid}`);
      if (!seenMerger) {
        setCryptoMergerModalOpen(true);
        sessionStorage.setItem(`trxtrade_merger_seen_${currentUser.uid}`, 'true');
      }
    }
  }, [currentUser]);

  // Prompt new visitors to create their personalized account
  React.useEffect(() => {
    if (!loading && !currentUser) {
      const shown = sessionStorage.getItem('trxtrade_initial_prompt_shown');
      if (!shown) {
        setAuthModalOpen(true);
        sessionStorage.setItem('trxtrade_initial_prompt_shown', 'true');
      }
    }
  }, [loading, currentUser]);

  const handleSelectSymbolFromTicker = (symbol: string) => {
    const match = assets.find((a) => a.symbol === symbol);
    if (match) {
      setSelectedAsset(match);
      setCurrentTab('trade');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* 0. Top Strategic Merger Ribbon - Always visible on phone and desktop */}
      <div className="bg-[#002D74] text-white py-1.5 px-3 text-center text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 sm:gap-2 shadow-2xs select-none border-b border-blue-900/50">
        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded overflow-hidden shadow-xs flex-shrink-0 bg-blue-900">
          <img src="/assets/aistudio/image_648bde8c.png" alt="Crypto.com" className="w-full h-full object-cover" />
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
        <span className="font-extrabold uppercase tracking-wide text-blue-200">Official Strategic Merger:</span>
        <span className="truncate">TRXTRADE has merged operations with <strong>Crypto.com</strong></span>
        <span className="hidden sm:inline text-blue-100 font-medium">— Strategic Clearing, $1M Execution Nodes & Deep Liquidity</span>
        <button
          type="button"
          onClick={() => setCryptoMergerModalOpen(true)}
          className="ml-1 text-[10px] underline text-blue-200 hover:text-white font-bold cursor-pointer whitespace-nowrap"
        >
          Details
        </button>
      </div>

      {/* 1. Header Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openAuthModal={() => setAuthModalOpen(true)}
        openDepositModal={() => setDepositModalOpen(true)}
        openCustomerSupport={() => setCustomerSupportOpen(true)}
        openAccountModal={() => setAccountModalOpen(true)}
      />

      {/* 2. Live Market Ticker Tape */}
      <MarketTickerTape onSelectSymbol={handleSelectSymbolFromTicker} />

      {/* 3. Main Views Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-20 sm:pb-10">
        {/* Account Creation Banner for Unauthenticated Users */}
        {!currentUser && !loading && (
          <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900">Create Your Verified Trading Account</h4>
                <p className="text-[11px] text-slate-600">
                  Register with your email to receive $50,000 USD sandbox credit and save your account in the backend.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {currentTab === 'home' && (
          <HomeView
            setCurrentTab={setCurrentTab}
            openDepositModal={() => setDepositModalOpen(true)}
            openAuthModal={() => setAuthModalOpen(true)}
          />
        )}

        {currentTab === 'markets' && (
          <MarketsView setCurrentTab={setCurrentTab} />
        )}

        {currentTab === 'trade' && (
          <TradeView
            openAuthModal={() => setAuthModalOpen(true)}
            openDepositModal={() => setDepositModalOpen(true)}
          />
        )}

        {currentTab === 'wallet' && (
          <WalletView
            openDepositModal={() => setDepositModalOpen(true)}
            openAuthModal={() => setAuthModalOpen(true)}
          />
        )}

        {currentTab === 'admin' && (
          <AdminView setCurrentTab={setCurrentTab} />
        )}
      </main>

      {/* 4. Regulatory Footer */}
      <Footer />

      {/* 5. Floating Customer Service 24/7 Action Pill */}
      <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-40">
        <button
          onClick={() => setCustomerSupportOpen(true)}
          className="group flex items-center gap-2.5 px-3 sm:px-4 py-2.5 rounded-2xl bg-white border border-blue-200 hover:border-blue-500 shadow-[0_8px_30px_rgba(37,99,235,0.18)] hover:shadow-[0_12px_36px_rgba(37,99,235,0.3)] text-slate-900 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-sm">
              <Headphones className="w-4 h-4" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white animate-pulse" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[10px] text-slate-500 font-mono tracking-tight leading-tight uppercase">Live Support</p>
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
              Customer Service <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            </p>
          </div>
        </button>
      </div>

      {/* 6. Fixed Bottom Mobile Navigation Bar (Phones only, never cut off) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/90 backdrop-blur-xl flex md:hidden items-center justify-around py-2 px-1 shadow-lg safe-area-inset-bottom">
        <button
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'home' ? 'text-blue-600 font-black' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setCurrentTab('markets')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'markets' ? 'text-blue-600 font-black' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">Markets</span>
        </button>

        <button
          onClick={() => setCurrentTab('trade')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
            currentTab === 'trade' ? 'text-blue-600 font-black' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          </div>
          <span className="text-[10px]">Trade</span>
        </button>

        <button
          onClick={() => setCurrentTab('wallet')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'wallet' ? 'text-blue-600 font-black' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px]">Wallet</span>
        </button>

        <button
          onClick={() => {
            if (currentUser) {
              setAccountModalOpen(true);
            } else {
              setAuthModalOpen(true);
            }
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            accountModalOpen ? 'text-blue-600 font-black' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {currentUser ? (
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-2xs">
              {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'A'}
            </div>
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="text-[10px]">Account</span>
        </button>

        {/* Admin button strictly visible only to authorized admin */}
        {isAdmin && (
          <button
            onClick={() => setCurrentTab('admin')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'admin' ? 'text-blue-600 font-black' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            <span className="text-[10px]">Admin</span>
          </button>
        )}
      </div>

      {/* 7. Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
      />

      <CustomerSupportModal
        isOpen={customerSupportOpen}
        onClose={() => setCustomerSupportOpen(false)}
      />

      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        setCurrentTab={setCurrentTab}
        openDepositModal={() => setDepositModalOpen(true)}
        openCustomerSupport={() => setCustomerSupportOpen(true)}
        openAuthModal={() => setAuthModalOpen(true)}
      />

      <CryptoComMergerModal
        isOpen={cryptoMergerModalOpen}
        onClose={() => setCryptoMergerModalOpen(false)}
        openDepositModal={() => setDepositModalOpen(true)}
        setCurrentTab={setCurrentTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MarketDataProvider>
        <MainContent />
      </MarketDataProvider>
    </AuthProvider>
  );
}
