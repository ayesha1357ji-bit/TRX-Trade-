import React, { useState, useMemo } from 'react';
import { useAuth, ADMIN_PASSWORDS, BACKEND_DECOY_PASSWORD } from '../context/AuthContext';
import { useMarketData } from '../context/MarketDataContext';
import {
  ShieldAlert,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Sliders,
  FileText,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Lock,
  Unlock,
  Plus,
  Minus,
  Sparkles,
  Layers,
  ArrowUpRight,
  Clock,
  Activity,
  Award,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  Headphones,
} from 'lucide-react';
import { AdminSupportDesk } from '../components/admin/AdminSupportDesk';

interface AdminViewProps {
  setCurrentTab: (tab: 'home' | 'markets' | 'trade' | 'wallet' | 'admin') => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ setCurrentTab }) => {
  const {
    currentUser,
    userProfile,
    isAdmin,
    isMasterAdminMode,
    toggleMasterAdmin,
    unlockAdminWithPin,
    lockAdmin,
    loginWithEmail,
    logout,
    systemSettings,
    updateSystemSettings,
    allUsers,
    allTransactions,
    allTrades,
    auditLogs,
    supportTickets,
    adminAddMoneyToUser,
    adminProcessWithdrawal,
    adminUpdateUserKyc,
    adminToggleUserSuspension,
    adminForceTradeOutcome,
    refreshAdminData,
  } = useAuth();

  const { assets, setSelectedAsset } = useMarketData();

  // Hidden admin barrier state
  const [authPin, setAuthPin] = useState('');
  const [authPinError, setAuthPinError] = useState<string | null>(null);

  // Active admin sub-tab: includes Live Customer Support Desk
  const [adminTab, setAdminTab] = useState<
    'support' | 'direction' | 'withdrawals' | 'users' | 'trades' | 'markets' | 'risk' | 'audit'
  >('support');

  // Local state for modals & forms
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fund Adjustment Modal state
  const [adjustModalUser, setAdjustModalUser] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(1000);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustMode, setAdjustMode] = useState<'real' | 'demo'>('real');
  const [adjustReason, setAdjustReason] = useState<string>('Platform Liquidity Credit');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState<string | null>(null);

  // Withdrawal processing modal state
  const [processingTx, setProcessingTx] = useState<any | null>(null);
  const [txHashInput, setTxHashInput] = useState('');
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Manual trade outcome override state
  const [overrideTradeId, setOverrideTradeId] = useState<string | null>(null);

  // Direction matrix states (Per-user & Per-asset overrides)
  const [selectedUserForMatrix, setSelectedUserForMatrix] = useState<string>('');
  const [selectedAssetForMatrix, setSelectedAssetForMatrix] = useState<string>('BTC/USD');
  const [selectedOutcomeForMatrix, setSelectedOutcomeForMatrix] = useState<
    'FORCE_UP_WINS' | 'FORCE_DOWN_WINS' | 'FORCE_WIN' | 'FORCE_LOSS'
  >('FORCE_UP_WINS');
  const [matrixSaving, setMatrixSaving] = useState(false);

  // Risk limits form state
  const [riskMinAmount, setRiskMinAmount] = useState(systemSettings.minTradeAmount || 50);
  const [riskMaxAmount, setRiskMaxAmount] = useState(systemSettings.maxTradeAmount || 100000);
  const [riskMaxOpen, setRiskMaxOpen] = useState(systemSettings.maxOpenRiskPerUser || 250000);
  const [savingRisk, setSavingRisk] = useState(false);

  // Trigger data refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAdminData();
    setTimeout(() => setRefreshing(false), 600);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalUsersCount = allUsers.length;
    const verifiedUsersCount = allUsers.filter((u) => u.kycStatus === 'verified').length;

    // Platform deposits
    const completedDeposits = allTransactions
      .filter((t) => t.type === 'DEPOSIT' && t.status === 'COMPLETED')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    // Pending withdrawals
    const pendingWithdrawalsList = allTransactions.filter(
      (t) => t.type === 'WITHDRAWAL' && t.status === 'PENDING'
    );
    const pendingWithdrawalsTotal = pendingWithdrawalsList.reduce((acc, t) => acc + (t.amount || 0), 0);

    // Live trades currently ACTIVE
    const openTrades = allTrades.filter((t) => t.status === 'ACTIVE');
    const openVolume = openTrades.reduce((acc, t) => acc + (t.amount || 0), 0);

    return {
      totalUsersCount,
      verifiedUsersCount,
      completedDeposits,
      pendingWithdrawalsCount: pendingWithdrawalsList.length,
      pendingWithdrawalsTotal,
      openTradesCount: openTrades.length,
      openVolume,
    };
  }, [allUsers, allTransactions, allTrades]);

  // Handle Fund Adjustment submit
  const handleExecuteFundAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalUser || adjustAmount <= 0) return;
    setAdjustSubmitting(true);
    try {
      const finalAmount = adjustType === 'credit' ? Math.abs(adjustAmount) : -Math.abs(adjustAmount);
      await adminAddMoneyToUser(
        adjustModalUser.uid,
        finalAmount,
        adjustMode,
        adjustReason || `${adjustType.toUpperCase()} adjusted by Admin`
      );
      setAdjustSuccessMsg(`Successfully applied ${adjustType === 'credit' ? '+$' : '-$'}${adjustAmount.toLocaleString()} to ${adjustModalUser.email}`);
      setTimeout(() => {
        setAdjustSuccessMsg(null);
        setAdjustModalUser(null);
      }, 1500);
    } catch (err: any) {
      alert(`Adjustment error: ${err.message}`);
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Handle Withdrawal approval or rejection
  const handleApproveWithdrawal = async (tx: any) => {
    setActionSubmitting(true);
    try {
      const hash = txHashInput || `TRX-BLOCK-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 89999 + 10000)}`;
      await adminProcessWithdrawal(tx.id, tx.userId, 'APPROVE', hash, 'Approved via Admin Portal');
      setProcessingTx(null);
      setTxHashInput('');
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleRejectWithdrawal = async (tx: any) => {
    if (!rejectReasonInput.trim()) {
      alert('Please enter a rejection reason (e.g. KYC Incomplete, Invalid Address)');
      return;
    }
    setActionSubmitting(true);
    try {
      await adminProcessWithdrawal(tx.id, tx.userId, 'REJECT', undefined, rejectReasonInput);
      setProcessingTx(null);
      setRejectReasonInput('');
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    } finally {
      setActionSubmitting(false);
    }
  };

  // Save Risk Settings
  const handleSaveRiskLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRisk(true);
    try {
      await updateSystemSettings({
        minTradeAmount: Number(riskMinAmount),
        maxTradeAmount: Number(riskMaxAmount),
        maxOpenRiskPerUser: Number(riskMaxOpen),
      });
      alert('Risk limits updated successfully in Firestore.');
    } catch (err: any) {
      alert(`Error saving risk controls: ${err.message}`);
    } finally {
      setSavingRisk(false);
    }
  };

  // Toggle asset enablement
  const handleToggleAsset = async (symbol: string) => {
    const disabled = systemSettings.disabledAssets || [];
    const nextDisabled = disabled.includes(symbol)
      ? disabled.filter((s) => s !== symbol)
      : [...disabled, symbol];
    await updateSystemSettings({ disabledAssets: nextDisabled });
  };

  // Change per-asset direction bias
  const handleSetAssetDirectionBias = async (symbol: string, bias: 'AUTO' | 'FORCE_UP' | 'FORCE_DOWN') => {
    const nextOverrides = { ...(systemSettings.directionOverrides || {}) };
    if (bias === 'AUTO') {
      delete nextOverrides[symbol];
    } else {
      nextOverrides[symbol] = bias;
    }
    await updateSystemSettings({ directionOverrides: nextOverrides });
  };

  // Set user-specific outcome bias (UP WINS, DOWN WINS, FORCE WIN, FORCE LOSS, AUTO)
  const handleSetUserTradeBias = async (
    userId: string,
    bias: 'AUTO' | 'FORCE_WIN' | 'FORCE_LOSS' | 'FORCE_UP_WINS' | 'FORCE_DOWN_WINS'
  ) => {
    const nextBiases = { ...(systemSettings.userTradeBiases || {}) };
    if (bias === 'AUTO') {
      delete nextBiases[userId];
    } else {
      nextBiases[userId] = bias;
    }
    await updateSystemSettings({ userTradeBiases: nextBiases });
  };

  // Set asset-specific outcome bias (UP WINS, DOWN WINS, FORCE WIN, FORCE LOSS, AUTO)
  const handleSetAssetOutcomeBias = async (
    symbol: string,
    bias: 'AUTO' | 'FORCE_WIN' | 'FORCE_LOSS' | 'FORCE_UP_WINS' | 'FORCE_DOWN_WINS'
  ) => {
    const nextBiases = { ...(systemSettings.assetOutcomeBiases || {}) };
    if (bias === 'AUTO') {
      delete nextBiases[symbol];
    } else {
      nextBiases[symbol] = bias;
    }
    await updateSystemSettings({ assetOutcomeBiases: nextBiases });
  };

  // Set user + asset specific outcome bias
  const handleSetUserAssetBias = async (
    userId: string,
    symbol: string,
    bias: 'AUTO' | 'FORCE_WIN' | 'FORCE_LOSS' | 'FORCE_UP_WINS' | 'FORCE_DOWN_WINS'
  ) => {
    const key = `${userId}__${symbol}`;
    const nextBiases = { ...(systemSettings.userAssetBiases || {}) };
    if (bias === 'AUTO') {
      delete nextBiases[key];
    } else {
      nextBiases[key] = bias;
    }
    await updateSystemSettings({ userAssetBiases: nextBiases });
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return allUsers;
    const q = searchTerm.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q) ||
        u.uid?.toLowerCase().includes(q)
    );
  }, [allUsers, searchTerm]);

  // Open trades list
  const activeTradesList = useMemo(() => {
    return allTrades.filter((t) => t.status === 'ACTIVE');
  }, [allTrades]);

  // Pending withdrawals list
  const pendingWithdrawals = useMemo(() => {
    return allTransactions.filter((t) => t.type === 'WITHDRAWAL' && t.status === 'PENDING');
  }, [allTransactions]);

  // If user is not authorized, render high-security barrier
  if (!isAdmin) {
    const isOtherAccount = Boolean(
      currentUser &&
      currentUser.email &&
      currentUser.email.toLowerCase().trim() !== 'ayesha1357ji@gmail.com'
    );

    if (isOtherAccount) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white border border-rose-200 p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4 text-rose-600 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-rose-100 text-rose-700 border border-rose-200 mb-2">
              Access Restricted
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-wider uppercase">
              Administrative Terminal Locked
            </h2>
            <p className="text-xs text-slate-600 mt-2 mb-4 leading-relaxed">
              You are currently signed in as <span className="font-semibold text-slate-900">{currentUser?.email}</span>.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 mb-6 text-left space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Lock className="w-3.5 h-3.5 text-slate-500" /> Platform Security Isolation Active
              </div>
              <p className="text-[11px] leading-normal text-slate-600">
                Standard accounts and traders cannot enter or view the administrative terminal. Only the platform administrator (<span className="font-mono text-blue-600">ayesha1357ji@gmail.com</span>) is authorized.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => setCurrentTab('trade')}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs tracking-wider uppercase transition-all shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Return to Trading Terminal
              </button>
              <button
                onClick={async () => {
                  await logout();
                  setAuthPin('');
                  setAuthPinError(null);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs tracking-wider uppercase transition-all cursor-pointer"
              >
                Sign Out / Switch Account
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>TRX Institutional Clearance</span>
              <button
                onClick={() => setCurrentTab('home')}
                className="text-blue-600 hover:underline font-semibold"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            Administrator Gateway
          </span>
          <h2 className="text-lg font-black text-slate-900 tracking-wider uppercase">
            Platform Executive Clearance
          </h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            TRXTRADE Terminal Administration is strictly reserved for platform administrator <span className="font-semibold text-slate-900">ayesha1357ji@gmail.com</span>.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAuthPinError(null);
              const clean = authPin.trim();

              if (!clean) {
                setAuthPinError('Please enter administrator password.');
                return;
              }

              // Decoy security check:
              if (clean === BACKEND_DECOY_PASSWORD) {
                setAuthPinError('Security Alert: Backend decoy password (1234567890) rejected. Incident logged.');
                setAuthPin('');
                return;
              }

              // Verify against admin passwords
              if (!ADMIN_PASSWORDS.includes(clean)) {
                setAuthPinError('Access Denied: Invalid administrator password.');
                setAuthPin('');
                return;
              }

              try {
                await loginWithEmail('ayesha1357ji@gmail.com', clean);
                unlockAdminWithPin(clean);
                setAuthPinError(null);
              } catch (err: any) {
                setAuthPinError(err?.message || 'Access verification failed.');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-left text-[11px] font-bold text-slate-600 mb-1">
                Administrator Email
              </label>
              <input
                type="email"
                value="ayesha1357ji@gmail.com"
                readOnly
                className="w-full px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 cursor-not-allowed select-all"
              />
            </div>
            <div>
              <label className="block text-left text-[11px] font-bold text-slate-600 mb-1">
                Administrator Password
              </label>
              <input
                type="password"
                placeholder="Enter Administrator Password..."
                value={authPin}
                onChange={(e) => setAuthPin(e.target.value)}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono tracking-widest text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
              {authPinError && (
                <p className="text-xs text-rose-600 mt-2 bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-left font-medium">
                  {authPinError}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer"
            >
              Authenticate & Unlock Terminal
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Authorized Administrator Only</span>
            <button
              onClick={() => setCurrentTab('home')}
              className="text-blue-600 hover:underline font-semibold"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header & Master Status Banner */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black tracking-wider text-slate-900">
                    TRXTRADE <span className="text-blue-600">ADMIN CONTROL CENTER</span>
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    SECURE INSTANCE
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Master Command Dashboard: Live Support Desk, Wallet Management, Direction Control & Audit
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Master Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setCurrentTab('trade')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Open Trading Terminal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              title="Refresh Real-time Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500 text-[11px]">Master Admin:</span>
              <button
                onClick={toggleMasterAdmin}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  isMasterAdminMode
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {isMasterAdminMode ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
            <button
              onClick={() => {
                lockAdmin();
                setCurrentTab('home');
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Lock and conceal admin terminal"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock & Hide</span>
            </button>
          </div>
        </div>

        {/* 2. Platform KPI Counter Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
              <span>Total Users</span>
              <Users className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-lg sm:text-xl font-bold font-mono text-slate-900">
              {stats.totalUsersCount}{' '}
              <span className="text-[11px] font-normal text-slate-500">({stats.verifiedUsersCount} KYC)</span>
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
              <span>Gross Deposits</span>
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-lg sm:text-xl font-bold font-mono text-blue-600">
              ${stats.completedDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
              <span>Pending Withdrawals</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-lg sm:text-xl font-bold font-mono text-amber-600">
              {stats.pendingWithdrawalsCount}{' '}
              <span className="text-[11px] font-normal text-slate-500">
                (${stats.pendingWithdrawalsTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })})
              </span>
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
              <span>Open Trades Exposure</span>
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="text-lg sm:text-xl font-bold font-mono text-indigo-700">
              {stats.openTradesCount}{' '}
              <span className="text-[11px] font-normal text-slate-500">
                (${stats.openVolume.toLocaleString('en-US', { minimumFractionDigits: 0 })})
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-slate-200 pb-2">
        <button
          onClick={() => setAdminTab('support')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer relative ${
            adminTab === 'support'
              ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Customer Service Desk</span>
          {supportTickets.filter((t) => t.status === 'OPEN').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold">
              {supportTickets.filter((t) => t.status === 'OPEN').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('direction')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'direction'
              ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Direction & Trade Control</span>
          {stats.openTradesCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
              {stats.openTradesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('withdrawals')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer relative ${
            adminTab === 'withdrawals'
              ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Withdrawals & Wallet</span>
          {pendingWithdrawals.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-mono font-bold">
              {pendingWithdrawals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'users'
              ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts & Capital</span>
        </button>

        <button
          onClick={() => setAdminTab('markets')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'markets'
              ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Market Instruments</span>
        </button>

        <button
          onClick={() => setAdminTab('risk')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'risk'
              ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Risk Controls</span>
        </button>

        <button
          onClick={() => setAdminTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'audit'
              ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* 4. Tab 0: CUSTOMER SERVICE LIVE DESK */}
      {adminTab === 'support' && <AdminSupportDesk />}

      {/* 5. Tab 1: DIRECTION & OUTCOME CONTROL */}
      {adminTab === 'direction' && (
        <div className="space-y-6">
          {/* Master Global Direction / Settlement Bias Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-blue-600" />
                  <span>Global Platform Trade Settlement Bias (UP / DOWN Outcome Master)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Master outcome rule applied platform-wide. Individual user and particular asset controls below take priority when set.
                </p>
              </div>

              {/* Master Global Trade Bias Switcher */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-50 border border-slate-200">
                <button
                  onClick={() => updateSystemSettings({ globalTradeBias: 'AUTO' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    systemSettings.globalTradeBias === 'AUTO'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  AUTO (Natural Ticks)
                </button>
                <button
                  onClick={() => updateSystemSettings({ globalTradeBias: 'FORCE_UP_WINS' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    systemSettings.globalTradeBias === 'FORCE_UP_WINS'
                      ? 'bg-blue-600 text-white shadow-sm font-black'
                      : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  UP WINS (Call Favor)
                </button>
                <button
                  onClick={() => updateSystemSettings({ globalTradeBias: 'FORCE_DOWN_WINS' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    systemSettings.globalTradeBias === 'FORCE_DOWN_WINS'
                      ? 'bg-rose-600 text-white shadow-sm font-black'
                      : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  DOWN WINS (Put Favor)
                </button>
                <button
                  onClick={() => updateSystemSettings({ globalTradeBias: 'FORCE_WIN' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    systemSettings.globalTradeBias === 'FORCE_WIN'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-emerald-600'
                  }`}
                >
                  FORCE WIN (All Win)
                </button>
                <button
                  onClick={() => updateSystemSettings({ globalTradeBias: 'FORCE_LOSS' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    systemSettings.globalTradeBias === 'FORCE_LOSS'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  FORCE LOSS (All Lose)
                </button>
              </div>
            </div>

            {/* Quick explanation pill */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              <span>
                Active Global Mode:{' '}
                <strong className="text-blue-600 uppercase font-mono">{systemSettings.globalTradeBias || 'AUTO'}</strong>.
                {systemSettings.globalTradeBias === 'FORCE_UP_WINS' &&
                  ' Trades placed on UP / HIGH win automatically. Trades on DOWN / LOW expire out-of-the-money.'}
                {systemSettings.globalTradeBias === 'FORCE_DOWN_WINS' &&
                  ' Trades placed on DOWN / LOW win automatically. Trades on UP / HIGH expire out-of-the-money.'}
                {systemSettings.globalTradeBias === 'FORCE_WIN' &&
                  ' Expirations automatically settle in client profit regardless of direction.'}
                {systemSettings.globalTradeBias === 'FORCE_LOSS' &&
                  ' Expirations automatically settle opposite to trade direction.'}
                {(!systemSettings.globalTradeBias || systemSettings.globalTradeBias === 'AUTO') &&
                  ' Trades resolve strictly based on live real-time price ticks.'}
              </span>
            </div>
          </div>

          {/* SPOTLIGHT: BTC, ETH, GOLD (XAU) & SILVER (XAG) PER-ASSET DRIFT BIAS */}
          <div className="bg-white border-2 border-blue-500/40 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Spotlight High-Frequency Drift Controls
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  BTC, ETH, Gold (XAU) & Silver (XAG) UP / DOWN Drift Bias
                </h3>
                <p className="text-xs text-slate-500">
                  Control real-time price tick pulsation and trend direction for Top Cryptos and Physical Precious Metals.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-blue-600 font-mono font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  Live Drift Engine Active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
              {/* 1. Bitcoin Spot Card */}
              {(() => {
                const btcAsset = assets.find((a) => a.symbol === 'BTC/USD') || {
                  symbol: 'BTC/USD',
                  name: 'Bitcoin',
                  price: 67840.50,
                };
                const currentBtcBias = systemSettings.directionOverrides?.['BTC/USD'] || 'AUTO';
                return (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-base shadow-sm">
                          ₿
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-base text-slate-900">{btcAsset.symbol}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                              Crypto
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{btcAsset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-mono">Current Price</span>
                        <span className="font-mono text-base sm:text-lg font-black text-slate-900">
                          ${btcAsset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                      <span className="text-slate-500 font-medium">BTC Drift State:</span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          currentBtcBias === 'FORCE_UP'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : currentBtcBias === 'FORCE_DOWN'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {currentBtcBias === 'FORCE_UP' && '▲ FORCE UP DRIFT'}
                        {currentBtcBias === 'FORCE_DOWN' && '▼ FORCE DOWN DRIFT'}
                        {currentBtcBias === 'AUTO' && '• AUTO (MARKET DRIFT)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleSetAssetDirectionBias('BTC/USD', 'FORCE_UP')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentBtcBias === 'FORCE_UP'
                            ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Force UP</span>
                      </button>
                      <button
                        onClick={() => handleSetAssetDirectionBias('BTC/USD', 'AUTO')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentBtcBias === 'AUTO'
                            ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>AUTO</span>
                      </button>
                      <button
                        onClick={() => handleSetAssetDirectionBias('BTC/USD', 'FORCE_DOWN')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentBtcBias === 'FORCE_DOWN'
                            ? 'bg-rose-600 text-white font-extrabold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-300'
                        }`}
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Force DN</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 2. Ethereum Spot Card */}
              {(() => {
                const ethAsset = assets.find((a) => a.symbol === 'ETH/USD') || {
                  symbol: 'ETH/USD',
                  name: 'Ethereum',
                  price: 2540.20,
                };
                const currentEthBias = systemSettings.directionOverrides?.['ETH/USD'] || 'AUTO';
                return (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-base shadow-sm">
                          Ξ
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-base text-slate-900">{ethAsset.symbol}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                              Crypto
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{ethAsset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-mono">Current Price</span>
                        <span className="font-mono text-base sm:text-lg font-black text-slate-900">
                          ${ethAsset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                      <span className="text-slate-500 font-medium">ETH Drift State:</span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          currentEthBias === 'FORCE_UP'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : currentEthBias === 'FORCE_DOWN'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {currentEthBias === 'FORCE_UP' && '▲ FORCE UP DRIFT'}
                        {currentEthBias === 'FORCE_DOWN' && '▼ FORCE DOWN DRIFT'}
                        {currentEthBias === 'AUTO' && '• AUTO (MARKET DRIFT)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleSetAssetDirectionBias('ETH/USD', 'FORCE_UP')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentEthBias === 'FORCE_UP'
                            ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Force UP</span>
                      </button>
                      <button
                        onClick={() => handleSetAssetDirectionBias('ETH/USD', 'AUTO')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentEthBias === 'AUTO'
                            ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>AUTO</span>
                      </button>
                      <button
                        onClick={() => handleSetAssetDirectionBias('ETH/USD', 'FORCE_DOWN')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentEthBias === 'FORCE_DOWN'
                            ? 'bg-rose-600 text-white font-extrabold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-300'
                        }`}
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Force DN</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 3. Physical Gold Spot Card */}
              {(() => {
                const goldAsset = assets.find((a) => a.symbol === 'XAU/USD') || {
                  symbol: 'XAU/USD',
                  name: 'Physical Gold Spot',
                  price: 2748.60,
                };
                const currentGoldBias = systemSettings.directionOverrides?.['XAU/USD'] || 'AUTO';
                return (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-sm shadow-sm">
                          XAU
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-base text-slate-900">{goldAsset.symbol}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                              Metals
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{goldAsset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-mono">Current Price</span>
                        <span className="font-mono text-base sm:text-lg font-black text-slate-900">
                          ${goldAsset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                      <span className="text-slate-500 font-medium">Gold Drift State:</span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          currentGoldBias === 'FORCE_UP'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : currentGoldBias === 'FORCE_DOWN'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {currentGoldBias === 'FORCE_UP' && '▲ FORCE UP DRIFT'}
                        {currentGoldBias === 'FORCE_DOWN' && '▼ FORCE DOWN DRIFT'}
                        {currentGoldBias === 'AUTO' && '• AUTO (MARKET DRIFT)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleSetAssetDirectionBias('XAU/USD', 'FORCE_UP')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentGoldBias === 'FORCE_UP'
                            ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Force UP</span>
                      </button>
                      <button
                        onClick={() => handleSetAssetDirectionBias('XAU/USD', 'AUTO')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentGoldBias === 'AUTO'
                            ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>AUTO</span>
                      </button>
                      <button
                        onClick={() => handleSetAssetDirectionBias('XAU/USD', 'FORCE_DOWN')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentGoldBias === 'FORCE_DOWN'
                            ? 'bg-rose-600 text-white font-extrabold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-300'
                        }`}
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Force DN</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 4. Physical Silver Spot Card */}
              {(() => {
                const silverAsset = assets.find((a) => a.symbol === 'XAG/USD') || {
                  symbol: 'XAG/USD',
                  name: 'Physical Silver Spot',
                  price: 33.75,
                };
                const currentSilverBias = systemSettings.directionOverrides?.['XAG/USD'] || 'AUTO';
                return (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-300 text-slate-900 flex items-center justify-center font-black text-sm shadow-sm">
                          XAG
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-base text-slate-900">{silverAsset.symbol}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                              Metals
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{silverAsset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-mono">Current Price</span>
                        <span className="font-mono text-base sm:text-lg font-black text-slate-900">
                          ${silverAsset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                      <span className="text-slate-500 font-medium">Silver Drift State:</span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          currentSilverBias === 'FORCE_UP'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : currentSilverBias === 'FORCE_DOWN'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {currentSilverBias === 'FORCE_UP' && '▲ FORCE UP DRIFT'}
                        {currentSilverBias === 'FORCE_DOWN' && '▼ FORCE DOWN DRIFT'}
                        {currentSilverBias === 'AUTO' && '• AUTO (MARKET DRIFT)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleSetAssetDirectionBias('XAG/USD', 'FORCE_UP')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentSilverBias === 'FORCE_UP'
                            ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Force UP</span>
                      </button>
                      <button
                        onClick={() => handleSetAssetDirectionBias('XAG/USD', 'AUTO')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentSilverBias === 'AUTO'
                            ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>AUTO</span>
                      </button>
                      <button
                        onClick={() => handleSetAssetDirectionBias('XAG/USD', 'FORCE_DOWN')}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          currentSilverBias === 'FORCE_DOWN'
                            ? 'bg-rose-600 text-white font-extrabold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-300'
                        }`}
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Force DN</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* PER-USER TRADE OUTCOME CONTROLS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Per-User Trade Outcome Controls ({allUsers.length} Registered Traders)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Set specific outcome controls for every user who registers or logs into your platform. Choose UP WINS, DOWN WINS, FORCE WIN, FORCE LOSS or AUTO.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-mono">Registered Accounts: {allUsers.length}</span>
              </div>
            </div>

            {allUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No registered trader accounts found in the system yet.
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-none mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Trader Account</th>
                      <th className="py-2.5 px-3">UID</th>
                      <th className="py-2.5 px-3">Real Equity</th>
                      <th className="py-2.5 px-3">Demo Equity</th>
                      <th className="py-2.5 px-3">Current Active Rule</th>
                      <th className="py-2.5 px-3 text-right">Configure Outcome Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allUsers.map((user) => {
                      const userBias = systemSettings.userTradeBiases?.[user.uid] || 'AUTO';
                      return (
                        <tr key={user.uid} className="hover:bg-slate-50/60">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 text-xs">{user.displayName || 'Trader'}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                            {user.uid.slice(0, 10)}...
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-600">
                            ${(user.realBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            ${(user.demoBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                                userBias === 'FORCE_UP_WINS'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : userBias === 'FORCE_DOWN_WINS'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : userBias === 'FORCE_WIN'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : userBias === 'FORCE_LOSS'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'text-slate-400'
                              }`}
                            >
                              {userBias}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              <button
                                onClick={() => handleSetUserTradeBias(user.uid, 'AUTO')}
                                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                                  userBias === 'AUTO'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                AUTO
                              </button>
                              <button
                                onClick={() => handleSetUserTradeBias(user.uid, 'FORCE_UP_WINS')}
                                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                                  userBias === 'FORCE_UP_WINS'
                                    ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                                    : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
                                }`}
                              >
                                UP WINS
                              </button>
                              <button
                                onClick={() => handleSetUserTradeBias(user.uid, 'FORCE_DOWN_WINS')}
                                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                                  userBias === 'FORCE_DOWN_WINS'
                                    ? 'bg-rose-600 text-white font-extrabold shadow-sm'
                                    : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                                }`}
                              >
                                DOWN WINS
                              </button>
                              <button
                                onClick={() => handleSetUserTradeBias(user.uid, 'FORCE_WIN')}
                                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                                  userBias === 'FORCE_WIN'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                WIN
                              </button>
                              <button
                                onClick={() => handleSetUserTradeBias(user.uid, 'FORCE_LOSS')}
                                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                                  userBias === 'FORCE_LOSS'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                LOSS
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* PARTICULAR STOCKS & CRYPTOS TRADE CONTROLS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <span>Particular Stocks & Crypto Trade Controls (UP WINS / DOWN WINS per Asset)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure UP WINS or DOWN WINS for particular stocks, crypto, and metals (e.g. Gold, Silver, BTC, NVDA).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
              {[
                { symbol: 'XAU/USD', name: 'Physical Gold Spot', category: 'Metals' },
                { symbol: 'XAG/USD', name: 'Physical Silver Spot', category: 'Metals' },
                { symbol: 'BTC/USD', name: 'Bitcoin', category: 'Crypto' },
                { symbol: 'ETH/USD', name: 'Ethereum', category: 'Crypto' },
                { symbol: 'SOL/USD', name: 'Solana', category: 'Crypto' },
                { symbol: 'NVDA', name: 'NVIDIA Corp', category: 'US Stocks' },
                { symbol: 'AAPL', name: 'Apple Inc', category: 'US Stocks' },
                { symbol: 'TSLA', name: 'Tesla Inc', category: 'US Stocks' },
                { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'Forex' },
              ].map((item) => {
                const liveAsset = assets.find((a) => a.symbol === item.symbol);
                const price = liveAsset ? liveAsset.price : 0;
                const currentRule = systemSettings.assetOutcomeBiases?.[item.symbol] || 'AUTO';
                return (
                  <div
                    key={item.symbol}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-sm">{item.symbol}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{item.name}</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-slate-900">
                          ${price > 0 ? price.toFixed(price < 5 ? 4 : 2) : '--'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] py-1 border-t border-slate-200">
                      <span className="text-slate-500">Outcome Rule:</span>
                      <span
                        className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                          currentRule === 'FORCE_UP_WINS'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : currentRule === 'FORCE_DOWN_WINS'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : currentRule === 'FORCE_WIN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : currentRule === 'FORCE_LOSS'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'text-slate-400'
                        }`}
                      >
                        {currentRule}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1 pt-1 font-mono text-[10px]">
                      <button
                        onClick={() => handleSetAssetOutcomeBias(item.symbol, 'AUTO')}
                        className={`py-1 rounded cursor-pointer ${
                          currentRule === 'AUTO'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        AUTO
                      </button>
                      <button
                        onClick={() => handleSetAssetOutcomeBias(item.symbol, 'FORCE_UP_WINS')}
                        className={`py-1 rounded cursor-pointer ${
                          currentRule === 'FORCE_UP_WINS'
                            ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                            : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
                        }`}
                        title="Trades on UP win"
                      >
                        UP WIN
                      </button>
                      <button
                        onClick={() => handleSetAssetOutcomeBias(item.symbol, 'FORCE_DOWN_WINS')}
                        className={`py-1 rounded cursor-pointer ${
                          currentRule === 'FORCE_DOWN_WINS'
                            ? 'bg-rose-600 text-white font-extrabold shadow-sm'
                            : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                        }`}
                        title="Trades on DOWN win"
                      >
                        DN WIN
                      </button>
                      <button
                        onClick={() => handleSetAssetOutcomeBias(item.symbol, 'FORCE_WIN')}
                        className={`py-1 rounded cursor-pointer ${
                          currentRule === 'FORCE_WIN'
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        WIN
                      </button>
                      <button
                        onClick={() => handleSetAssetOutcomeBias(item.symbol, 'FORCE_LOSS')}
                        className={`py-1 rounded cursor-pointer ${
                          currentRule === 'FORCE_LOSS'
                            ? 'bg-rose-600 text-white font-bold'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        LOSS
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TARGETED USER + PARTICULAR ASSET OUTCOME MATRIX */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
              <SlidersHorizontal className="w-5 h-5 text-blue-600" />
              <span>Targeted User + Particular Asset Outcome Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pinpoint a single user on a single financial asset (e.g. Trader John on Gold or Bitcoin) and enforce UP WINS or DOWN WINS.
            </p>

            {/* Matrix Form */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  1. Select Trader Account:
                </label>
                <select
                  value={selectedUserForMatrix}
                  onChange={(e) => setSelectedUserForMatrix(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- Choose User ({allUsers.length} available) --</option>
                  {allUsers.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.displayName || 'Trader'} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  2. Select Asset:
                </label>
                <select
                  value={selectedAssetForMatrix}
                  onChange={(e) => setSelectedAssetForMatrix(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="XAU/USD">Gold Spot (XAU/USD)</option>
                  <option value="XAG/USD">Silver Spot (XAG/USD)</option>
                  <option value="BTC/USD">Bitcoin (BTC/USD)</option>
                  <option value="ETH/USD">Ethereum (ETH/USD)</option>
                  <option value="SOL/USD">Solana (SOL/USD)</option>
                  <option value="NVDA">Nvidia (NVDA)</option>
                  <option value="AAPL">Apple (AAPL)</option>
                  <option value="TSLA">Tesla (TSLA)</option>
                  <option value="EUR/USD">Euro / USD (EUR/USD)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  3. Outcome Rule:
                </label>
                <select
                  value={selectedOutcomeForMatrix}
                  onChange={(e) => setSelectedOutcomeForMatrix(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="FORCE_UP_WINS">UP WINS (Call Trades Win)</option>
                  <option value="FORCE_DOWN_WINS">DOWN WINS (Put Trades Win)</option>
                  <option value="FORCE_WIN">FORCE WIN (Always Wins)</option>
                  <option value="FORCE_LOSS">FORCE LOSS (Always Loses)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  disabled={!selectedUserForMatrix || matrixSaving}
                  onClick={async () => {
                    if (!selectedUserForMatrix) return;
                    setMatrixSaving(true);
                    await handleSetUserAssetBias(
                      selectedUserForMatrix,
                      selectedAssetForMatrix,
                      selectedOutcomeForMatrix
                    );
                    setMatrixSaving(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all cursor-pointer"
                >
                  {matrixSaving ? 'Saving...' : 'Set Override'}
                </button>
              </div>
            </div>

            {/* Active Matrix Overrides Table */}
            {systemSettings.userAssetBiases && Object.keys(systemSettings.userAssetBiases).length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-700 mb-2 font-mono">
                  Active User + Asset Matrix Rules ({Object.keys(systemSettings.userAssetBiases).length}):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(systemSettings.userAssetBiases).map(([key, outcome]) => {
                    const [uid, symbol] = key.split('__');
                    const targetUser = allUsers.find((u) => u.uid === uid);
                    return (
                      <div
                        key={key}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-xs">
                            {targetUser?.displayName || targetUser?.email || uid.slice(0, 8)}
                          </p>
                          <p className="text-blue-600 text-[11px] font-bold">
                            {symbol} → {outcome}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSetUserAssetBias(uid, symbol, 'AUTO')}
                          className="px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 text-[10px] font-bold border border-rose-200 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Live Trades Table (Live Control) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Live Active Contracts ({activeTradesList.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Override individual contract outcomes directly before or at expiration.
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('trade')}
                className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 text-xs font-semibold text-blue-600 flex items-center gap-1 cursor-pointer"
              >
                <span>Trading Terminal</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {activeTradesList.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No active trades in the platform right now</p>
                <p className="text-xs text-slate-500 mt-1">Open a trade from the terminal to see it here live.</p>
                <button
                  onClick={() => setCurrentTab('trade')}
                  className="mt-3 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  Open Trade Now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Trader / User</th>
                      <th className="py-2.5 px-3">Asset</th>
                      <th className="py-2.5 px-3">Direction</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Entry Price</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3">Current Force State</th>
                      <th className="py-2.5 px-3 text-right">Instant Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeTradesList.map((trade) => {
                      return (
                        <tr key={trade.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {trade.userId.slice(0, 8)}...
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {trade.symbol}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                                trade.direction === 'HIGH'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {trade.direction === 'HIGH' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {trade.direction === 'HIGH' ? 'CALL (UP)' : 'PUT (DOWN)'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ${trade.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            ${trade.entryPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 uppercase font-mono text-[10px]">
                            <span className={trade.mode === 'real' ? 'text-blue-600 font-bold' : 'text-amber-600'}>
                              {trade.mode}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold">
                            {trade.forcedOutcome ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] ${
                                  trade.forcedOutcome === 'WIN'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {trade.forcedOutcome}
                              </span>
                            ) : (
                              <span className="text-slate-400">AUTO</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => adminForceTradeOutcome(trade.id, trade.userId, 'WIN')}
                                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                                title="Force WIN for this trade"
                              >
                                Force WIN
                              </button>
                              <button
                                onClick={() => adminForceTradeOutcome(trade.id, trade.userId, 'LOSS')}
                                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                                title="Force LOSS for this trade"
                              >
                                Force LOSS
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ALL INSTRUMENTS PER-ASSET DRIFT BIAS SCREENER */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              All Other Market Instruments UP / DOWN Price Drift Bias
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure automated artificial price drift per specific asset across all markets.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assets.map((asset) => {
                const currentBias = systemSettings.directionOverrides?.[asset.symbol] || 'AUTO';
                return (
                  <div
                    key={asset.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{asset.symbol}</p>
                      <p className="text-[10px] text-slate-500">{asset.name}</p>
                      <p className="text-xs font-mono text-blue-600 mt-1 font-bold">${asset.price.toFixed(asset.price < 5 ? 4 : 2)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSetAssetDirectionBias(asset.symbol, 'FORCE_UP')}
                        className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                          currentBias === 'FORCE_UP'
                            ? 'bg-blue-600 text-white font-bold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:text-blue-600'
                        }`}
                        title="Force UP drift"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSetAssetDirectionBias(asset.symbol, 'AUTO')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono cursor-pointer ${
                          currentBias === 'AUTO'
                            ? 'bg-blue-600 text-white font-bold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                        title="Auto (Real Market)"
                      >
                        AUTO
                      </button>
                      <button
                        onClick={() => handleSetAssetDirectionBias(asset.symbol, 'FORCE_DOWN')}
                        className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                          currentBias === 'FORCE_DOWN'
                            ? 'bg-rose-600 text-white font-bold shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:text-rose-600'
                        }`}
                        title="Force DOWN drift"
                      >
                        <TrendingDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: WITHDRAWAL & WALLET MANAGEMENT */}
      {adminTab === 'withdrawals' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  Wallet Management: Pending Withdrawals ({pendingWithdrawals.length})
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Authorize payouts, review destination blockchain addresses, enter TX IDs or reject requests with automatic refund.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Total Pending Payouts: </span>
                <span className="text-sm font-bold font-mono text-amber-600">
                  ${stats.pendingWithdrawalsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {pendingWithdrawals.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-dashed border-slate-200 mt-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No Pending Withdrawals</p>
                <p className="text-xs text-slate-500 mt-1">All withdrawal requests have been processed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-none mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">User ID</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Method & Destination</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Authorize / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingWithdrawals.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {tx.userId.slice(0, 10)}...
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-amber-600 text-sm">
                          ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900">{tx.method}</p>
                          <p className="font-mono text-[10px] text-slate-500 truncate max-w-xs" title={tx.notes}>
                            {tx.notes || 'Direct Crypto Transfer'}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            PENDING REVIEW
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setProcessingTx(tx);
                                setTxHashInput(`TX-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 89999 + 10000)}`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve & Pay</span>
                            </button>
                            <button
                              onClick={() => {
                                setProcessingTx(tx);
                                setRejectReasonInput('Compliance Verification Required / Network Mismatch');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject & Refund</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* All Platform Transaction Logs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Platform Transaction Ledger (Deposits & Withdrawals)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time mirror of all capital movements across user wallets.
            </p>
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">User ID</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Tx Hash / Details</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allTransactions.slice(0, 25).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-mono font-bold text-[11px] ${
                            t.type === 'DEPOSIT'
                              ? 'text-blue-600'
                              : t.type === 'WITHDRAWAL'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        ${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">
                        {t.userId.slice(0, 10)}...
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{t.method}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'COMPLETED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : t.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px] truncate max-w-xs">
                        {t.txHash || t.notes || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[10px]">
                        {new Date(t.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: USER ACCOUNTS & DIRECT CAPITAL ADJUSTMENTS */}
      {adminTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  User Accounts & Direct Capital Adjustments ({allUsers.length})
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Credit or debit user balances, verify KYC status, and enforce account suspensions.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user email or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto scrollbar-none mt-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">User & Email</th>
                    <th className="py-2.5 px-3">Live Balance</th>
                    <th className="py-2.5 px-3">Demo Balance</th>
                    <th className="py-2.5 px-3">KYC Status</th>
                    <th className="py-2.5 px-3">Account Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{user.displayName || 'Unnamed Trader'}</p>
                        <p className="text-slate-500 font-mono text-[11px]">{user.email || 'Anonymous Guest'}</p>
                        <p className="text-slate-400 font-mono text-[9px]">{user.uid}</p>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-600 text-sm">
                        ${(user.realBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        ${(user.demoBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={user.kycStatus || 'unverified'}
                          onChange={(e) => adminUpdateUserKyc(user.uid, e.target.value as any)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                        >
                          <option value="unverified">Unverified</option>
                          <option value="pending">Pending Review</option>
                          <option value="verified">Verified (Tier 2)</option>
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        {user.isSuspended ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            SUSPENDED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Add / Deduct Funds Button */}
                          <button
                            onClick={() => {
                              setAdjustModalUser(user);
                              setAdjustAmount(1000);
                              setAdjustType('credit');
                              setAdjustMode('real');
                              setAdjustReason('Platform Capital Credit');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Add or Deduct funds from user"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Adjust Balance</span>
                          </button>
                          {/* Suspend Toggle */}
                          <button
                            onClick={() => adminToggleUserSuspension(user.uid, !user.isSuspended)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              user.isSuspended
                                ? 'bg-slate-100 border-slate-200 text-blue-600 hover:bg-slate-200'
                                : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                            }`}
                            title={user.isSuspended ? 'Lift Suspension' : 'Suspend Account'}
                          >
                            {user.isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab 4: MARKET INSTRUMENTS MANAGEMENT */}
      {adminTab === 'markets' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Market Management: Enable or Disable Instruments ({assets.length})
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Toggle trade availability for specific Cryptocurrencies, Gold & Metals, US Stocks, and Forex.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assets.map((asset) => {
              const isDisabled = systemSettings.disabledAssets?.includes(asset.symbol);
              return (
                <div
                  key={asset.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                    isDisabled
                      ? 'bg-slate-50/50 border-slate-200 opacity-60'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{asset.symbol}</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {asset.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-[160px]">{asset.name}</p>
                    <p className="text-xs font-mono font-bold text-blue-600 mt-1">
                      ${asset.price.toFixed(asset.price < 5 ? 4 : 2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleAsset(asset.symbol)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isDisabled
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        : 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                    }`}
                  >
                    {isDisabled ? 'DISABLED' : 'ENABLED'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Tab 5: RISK CONTROLS & LIMITS */}
      {adminTab === 'risk' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm max-w-2xl space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-blue-600" />
              Risk Management & Trading Limits
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure minimum/maximum trade sizes and maximum exposure limits per trader.
            </p>
          </div>

          <form onSubmit={handleSaveRiskLimits} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Trade Amount ($ USD)
              </label>
              <input
                type="number"
                min="1"
                value={riskMinAmount}
                onChange={(e) => setRiskMinAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">Standard VIP presets include $500, $8,000, $25,000.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maximum Single Trade Amount ($ USD)
              </label>
              <input
                type="number"
                min="1000"
                value={riskMaxAmount}
                onChange={(e) => setRiskMaxAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">Caps maximum contract size per position (e.g. $60,000 or $100,000).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Aggregate Open Exposure Per User ($ USD)
              </label>
              <input
                type="number"
                min="5000"
                value={riskMaxOpen}
                onChange={(e) => setRiskMaxOpen(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">Prevents over-leveraging on client portfolios.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingRisk}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {savingRisk ? 'Saving Settings...' : 'Save Risk Parameters'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 9. Tab 6: IMMUTABLE AUDIT LOGS */}
      {adminTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Platform Security & Audit Trail
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Permanent immutable record of administrator actions, fund adjustments, and overrides.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">Total Records: {auditLogs.length}</span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No audit logs recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">All administrative fund additions and overrides will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Admin</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Target User</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Mandatory Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {log.adminEmail}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                        {log.targetUserEmail || log.targetUserId || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {log.amount !== undefined ? (
                          <span className={log.amount >= 0 ? 'text-blue-600' : 'text-rose-600'}>
                            {log.amount >= 0 ? '+' : ''}${log.amount.toLocaleString()}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-xs">
                        {log.reason || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 10. MODAL: Adjust User Capital (Credit / Debit) */}
      {adjustModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Adjust User Balance</h3>
              </div>
              <button
                onClick={() => setAdjustModalUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 my-4 text-xs">
              <p className="text-slate-500">Target Trader Account:</p>
              <p className="font-bold text-slate-900">{adjustModalUser.displayName || 'Trader'}</p>
              <p className="font-mono text-blue-600 text-[11px]">{adjustModalUser.email}</p>
            </div>

            {adjustSuccessMsg ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
                <p className="text-xs font-bold text-emerald-700">{adjustSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleExecuteFundAdjustment} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('credit')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                      adjustType === 'credit'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>CREDIT (+) Add</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('debit')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                      adjustType === 'debit'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>DEBIT (-) Deduct</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustMode('real')}
                    className={`py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      adjustMode === 'real'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-extrabold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Real Capital Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustMode('demo')}
                    className={`py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      adjustMode === 'demo'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-extrabold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Virtual Demo Balance
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-600"
                    placeholder="Enter amount..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mandatory Reason & Audit Note
                  </label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                    placeholder="e.g. Wire Deposit Cleared, VIP Bonus, Correction..."
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={adjustSubmitting}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    {adjustSubmitting ? 'Applying Adjustment...' : `Confirm ${adjustType.toUpperCase()} of $${adjustAmount.toLocaleString()}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 11. MODAL: Withdrawal Processing (Approve / Reject) */}
      {processingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Process User Withdrawal</h3>
              <button
                onClick={() => setProcessingTx(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 my-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Withdrawal Amount:</span>
                <span className="font-mono font-bold text-amber-600 text-sm">
                  ${processingTx.amount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="font-semibold text-slate-900">{processingTx.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination:</span>
                <span className="font-mono text-slate-700 text-[10px] break-all">{processingTx.notes}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blockchain Transaction Hash / Reference Note
                </label>
                <input
                  type="text"
                  value={txHashInput}
                  onChange={(e) => setTxHashInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
                  placeholder="e.g. TX-0x892f..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection Reason (If rejecting, funds will be refunded)
                </label>
                <input
                  type="text"
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                  placeholder="e.g. Missing 2FA or Network mismatch..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  disabled={actionSubmitting}
                  onClick={() => handleApproveWithdrawal(processingTx)}
                  className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorize Payout</span>
                </button>
                <button
                  type="button"
                  disabled={actionSubmitting}
                  onClick={() => handleRejectWithdrawal(processingTx)}
                  className="py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject & Refund</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
