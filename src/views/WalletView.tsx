import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  ShieldCheck,
  Lock,
  Building,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Sliders,
  DollarSign,
  FileText,
  ArrowRight,
} from 'lucide-react';

interface WalletViewProps {
  openDepositModal: () => void;
  openAuthModal: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  openDepositModal,
  openAuthModal,
}) => {
  const {
    currentUser,
    userProfile,
    tradingMode,
    switchTradingMode,
    resetDemoBalance,
    transactions,
    submitWithdrawal,
    logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history' | 'security'>('overview');
  const [withdrawAmountInput, setWithdrawAmountInput] = useState<string>('500');
  const withdrawAmount = Number(withdrawAmountInput) || 0;
  const [withdrawMethod, setWithdrawMethod] = useState<'usdt' | 'eth' | 'btc'>('usdt');
  const [withdrawDestination, setWithdrawDestination] = useState<string>('FGu3bigyFoJbcZ18Nyhv2Bz16vhMUo5rwFKW7x5AvxoD');
  const [withdrawStatus, setWithdrawStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [antiPhishingCode, setAntiPhishingCode] = useState('TRX-SECURE-99');
  const [copied, setCopied] = useState(false);

  if (!currentUser) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
          <Wallet className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-950">Create Account to Access Wallet</h2>
        <p className="text-xs text-slate-500 font-medium">
          Create your unique trading account or sign in to manage deposits, withdrawals, and your balances.
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-[0_4px_16px_rgba(37,99,235,0.3)] transition-all hover:scale-102 cursor-pointer"
        >
          Create New Account / Sign In
        </button>
      </div>
    );
  }

  const demoBal = userProfile?.demoBalance ?? 50000;
  const realBal = userProfile?.realBalance ?? 0;

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawStatus(null);
    try {
      const res = await submitWithdrawal(withdrawAmount, withdrawMethod.toUpperCase(), withdrawDestination);
      setWithdrawStatus(res);
    } catch (err: unknown) {
      setWithdrawStatus({
        success: false,
        message: err instanceof Error ? err.message : 'Withdrawal failed',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Wallet Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Treasury & Secure Custody
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            FDIC-Insured US Partner Banking rails, USDC settlements and compliance portal.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 text-xs overflow-x-auto scrollbar-none shadow-2xs">
          {[
            { id: 'overview', label: 'Balances' },
            { id: 'deposit', label: 'Deposit' },
            { id: 'withdraw', label: 'Withdraw' },
            { id: 'history', label: 'Ledger' },
            { id: 'security', label: 'Security' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: OVERVIEW (Balances & Summary) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Dual Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live Real Funds Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50/70 to-indigo-50 border border-blue-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-blue-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  Live Regulated Account
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono font-bold border border-blue-200">
                  USD Native
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block font-mono font-bold">Available Trading Capital</span>
                <div className="text-3xl sm:text-4xl font-black font-mono text-slate-950 mt-1">
                  ${realBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={openDepositModal}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>Deposit Funds</span>
                </button>
                <button
                  onClick={() => setActiveTab('withdraw')}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <ArrowUpCircle className="w-4 h-4 text-blue-600" />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>

            {/* Virtual Demo Funds Card */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-slate-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Virtual Demo Sandbox
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                  Risk-Free Practice
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block font-mono font-bold">Simulated Capital</span>
                <div className="text-3xl sm:text-4xl font-black font-mono text-slate-950 mt-1">
                  ${demoBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={resetDemoBalance}
                  className="flex-1 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset to $50,000 USD</span>
                </button>
                <button
                  onClick={() => switchTradingMode(tradingMode === 'demo' ? 'real' : 'demo')}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <span>Switch to {tradingMode === 'demo' ? 'Live' : 'Demo'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Compliance & Account Tier Status */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-2xs">
            <h3 className="font-black text-slate-950 text-base mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>US Regulatory Compliance & Account Tier</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] mb-1 font-bold">KYC Tier Status</span>
                <span className="text-blue-700 font-black text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Tier 1 Verified
                </span>
                <p className="text-[10px] text-slate-500 mt-2 font-sans font-medium">
                  Unlimited trading sandbox, up to $250,000/day ACH limits.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] mb-1 font-bold">Clearing Partner</span>
                <span className="text-slate-900 font-black text-sm">US Federal Clearing</span>
                <p className="text-[10px] text-slate-500 mt-2 font-sans font-medium">
                  Separated omnibus client trust accounts in Tier-1 banks.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px] mb-1 font-bold">Tax Reporting (1099-B)</span>
                <span className="text-blue-700 font-black text-sm">Automated Ready</span>
                <p className="text-[10px] text-slate-500 mt-2 font-sans font-medium">
                  Compliant IRS year-end transaction matching exportable.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: DEPOSIT (Crypto Funding Rails Only) */}
      {activeTab === 'deposit' && (
        <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
              <ArrowDownCircle className="w-6 h-6 text-blue-600" />
              <span>Crypto Deposit Gateway</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Deposit real trading funds via Tether USDT (SPL / Multi-Chain), Ethereum (ETH), or Bitcoin (BTC).
            </p>
          </div>

          <div className="space-y-3.5">
            {/* USDT */}
            <div
              onClick={openDepositModal}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/image_afad5a79.png"
                  alt="USDT QR"
                  className="w-12 h-12 rounded-xl object-contain bg-black p-0.5 border border-slate-700 flex-shrink-0 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-slate-950 group-hover:text-blue-600 transition-colors">
                      USDT (Tether USD)
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono font-bold">
                      SPL / Multi-Chain
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 truncate max-w-xs sm:max-w-md font-bold">
                    FGu3bigyFoJbcZ18Nyhv2Bz16vhMUo5rwFKW7x5AvxoD
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard('FGu3bigyFoJbcZ18Nyhv2Bz16vhMUo5rwFKW7x5AvxoD');
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 flex-shrink-0 shadow-2xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied' : 'Copy Address'}</span>
              </button>
            </div>

            {/* ETH */}
            <div
              onClick={openDepositModal}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/image_bde4d6fb.png"
                  alt="ETH QR"
                  className="w-12 h-12 rounded-xl object-contain bg-black p-0.5 border border-slate-700 flex-shrink-0 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-slate-950 group-hover:text-blue-600 transition-colors">
                      ETH (Ethereum)
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono font-bold">
                      ERC-20 Mainnet
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 truncate max-w-xs sm:max-w-md font-bold">
                    0x1627717b202d862bfc8844410eeeb3131f419f0d
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard('0x1627717b202d862bfc8844410eeeb3131f419f0d');
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 flex-shrink-0 shadow-2xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied' : 'Copy Address'}</span>
              </button>
            </div>

            {/* BTC */}
            <div
              onClick={openDepositModal}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/image_740d4fc3.png"
                  alt="BTC QR"
                  className="w-12 h-12 rounded-xl object-contain bg-black p-0.5 border border-slate-700 flex-shrink-0 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-slate-950 group-hover:text-blue-600 transition-colors">
                      BTC (Bitcoin)
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-mono font-bold">
                      Native SegWit
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 truncate max-w-xs sm:max-w-md font-bold">
                    bc1qc5t9jn4z2p5kcl8tysur2eccq5jd0xj4xkaue5
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard('bc1qc5t9jn4z2p5kcl8tysur2eccq5jd0xj4xkaue5');
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-700 border border-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 flex-shrink-0 shadow-2xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied' : 'Copy Address'}</span>
              </button>
            </div>

            <button
              onClick={openDepositModal}
              className="w-full mt-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all cursor-pointer"
            >
              <span>Open Deposit Gateway & QR Scanner</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab: WITHDRAW */}
      {activeTab === 'withdraw' && (
        <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
              <ArrowUpCircle className="w-6 h-6 text-blue-600" />
              <span>Request Crypto Withdrawal</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Direct settlement to your private USDT (TRC-20), ETH, or BTC wallet.
            </p>
          </div>

          {withdrawStatus && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
                withdrawStatus.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {withdrawStatus.success ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              )}
              <span>{withdrawStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            {/* Method Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Withdrawal Asset</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'usdt', label: 'USDT (TRC-20)', fee: '1 USDT' },
                  { id: 'eth', label: 'ETH (ERC-20)', fee: '0.002 ETH' },
                  { id: 'btc', label: 'BTC Mainnet', fee: '0.0001 BTC' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setWithdrawMethod(m.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      withdrawMethod === m.id
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs ring-1 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="block font-black text-xs">{m.label}</span>
                    <span className="text-[10px] text-blue-600 font-mono font-bold">Fee: {m.fee}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Recipient {withdrawMethod.toUpperCase()} Wallet Address
              </label>
              <input
                type="text"
                required
                value={withdrawDestination}
                onChange={(e) => setWithdrawDestination(e.target.value)}
                placeholder={withdrawMethod === 'usdt' ? 'TT17... (Tron address)' : withdrawMethod === 'eth' ? '0x... (Ethereum address)' : 'bc1q... (Bitcoin address)'}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:outline-none text-sm text-slate-900 font-mono"
              />
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Amount (USD)</label>
                <span className="text-xs text-slate-500 font-mono font-bold">
                  Available: ${realBal.toFixed(2)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-bold">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  required
                  value={withdrawAmountInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setWithdrawAmountInput('');
                      return;
                    }
                    let clean = val.replace(/[^0-9.]/g, '');
                    const parts = clean.split('.');
                    if (parts.length > 2) {
                      clean = parts[0] + '.' + parts.slice(1).join('');
                    }
                    if (/^0\d+/.test(clean)) {
                      clean = clean.replace(/^0+/, '');
                    }
                    setWithdrawAmountInput(clean);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && (withdrawAmountInput === '0' || withdrawAmountInput === '0.00')) {
                      e.preventDefault();
                      setWithdrawAmountInput('');
                    }
                  }}
                  onFocus={() => {
                    if (withdrawAmountInput === '0') {
                      setWithdrawAmountInput('');
                    }
                  }}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:outline-none text-base font-black font-mono text-slate-950"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all cursor-pointer"
            >
              Confirm Withdrawal Order
            </button>
          </form>
        </div>
      )}

      {/* Tab: HISTORY (Transactions Ledger) */}
      {activeTab === 'history' && (
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-black text-slate-950 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Full Treasury Ledger</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono font-bold">{transactions.length} records</span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No ledger transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-100 font-bold">
                    <th className="pb-2">Transaction ID</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Method</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Date / Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-blue-50/40">
                      <td className="py-3 text-slate-500 font-mono text-[11px]">{tx.id.slice(0, 14)}...</td>
                      <td className="py-3 font-black text-slate-950">{tx.type}</td>
                      <td className="py-3 font-black text-blue-600">${tx.amount.toLocaleString()}</td>
                      <td className="py-3 text-slate-600 font-sans font-medium">{tx.method}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-400 text-[11px]">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: SECURITY (2FA & Profile) */}
      {activeTab === 'security' && (
        <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <span>Security & Authorization</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Protect your capital with bank-grade cryptographic security.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 2FA Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-950">Two-Factor Authentication (2FA)</h4>
                <p className="text-xs text-slate-500">Mandatory for all withdrawals and password modifications</p>
              </div>
              <button
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  twoFactorEnabled ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Anti Phishing Code */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-sm text-slate-950">Anti-Phishing Verification Code</h4>
              <p className="text-xs text-slate-500">
                Included in every official email from TRXTRADE to verify authenticity.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={antiPhishingCode}
                  onChange={(e) => setAntiPhishingCode(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => copyToClipboard(antiPhishingCode)}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Account Details & Logout */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-950">Sign Out of Session</h4>
                <p className="text-xs text-slate-500 font-mono">{currentUser.email || 'Guest User'}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
