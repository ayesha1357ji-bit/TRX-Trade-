import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  CheckCircle2,
  Copy,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  Sparkles,
} from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CryptoType = 'usdt' | 'eth' | 'btc';

interface CryptoConfig {
  id: CryptoType;
  symbol: string;
  name: string;
  network: string;
  address: string;
  qrImage: string;
  color: string;
  minDeposit: string;
  confirmations: string;
}

const CRYPTO_CONFIGS: Record<CryptoType, CryptoConfig> = {
  usdt: {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether USD',
    network: 'USDT (Solana SPL / Multi-Chain)',
    address: 'FGu3bigyFoJbcZ18Nyhv2Bz16vhMUo5rwFKW7x5AvxoD',
    qrImage: '/assets/aistudio/image_afad5a79.png',
    color: 'blue',
    minDeposit: '10 USDT',
    confirmations: '1 Confirmation (~1-2 mins)',
  },
  eth: {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'ERC-20 (Ethereum Mainnet)',
    address: '0x1627717b202d862bfc8844410eeeb3131f419f0d',
    qrImage: '/assets/aistudio/image_bde4d6fb.png',
    color: 'blue',
    minDeposit: '0.005 ETH',
    confirmations: '12 Confirmations (~3 mins)',
  },
  btc: {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin Mainnet (Native SegWit)',
    address: 'bc1qc5t9jn4z2p5kcl8tysur2eccq5jd0xj4xkaue5',
    qrImage: '/assets/aistudio/image_740d4fc3.png',
    color: 'amber',
    minDeposit: '0.0005 BTC',
    confirmations: '2 Confirmations (~15 mins)',
  },
};

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, submitDeposit } = useAuth();
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>('usdt');
  const [amountInput, setAmountInput] = useState<string>('2500');
  const amount = Number(amountInput) || 0;
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentCrypto = CRYPTO_CONFIGS[selectedCrypto];

  const handleDeposit = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const methodName = `${currentCrypto.symbol} (${currentCrypto.network})`;
      await submitDeposit(amount, methodName);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTxHash('');
        onClose();
      }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(currentCrypto.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-7 text-slate-900 max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between gap-2 mb-1 pr-8">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-blue-700 font-bold">
                Crypto Deposit Gateway
              </span>
            </div>
            <div className="hidden xs:flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-[10px] text-blue-950 font-bold shadow-2xs">
              <div className="w-3.5 h-3.5 rounded overflow-hidden shadow-2xs bg-[#002D74] flex-shrink-0">
                <img src="/assets/aistudio/image_648bde8c.png" alt="Crypto.com" className="w-full h-full object-cover" />
              </div>
              <span>Crypto.com Clearing</span>
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">Deposit Crypto</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Fast direct blockchain settlement via Tether (USDT), Ethereum (ETH), or Bitcoin (BTC).
          </p>
        </div>

        {success ? (
          <div className="py-12 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-black text-slate-950">Deposit Submitted</h4>
            <p className="text-xs text-slate-600 font-medium">
              ${amount.toLocaleString()} USD has been credited to your real trading equity.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Crypto Asset Selector: USDT, ETH, BTC */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Select Cryptocurrency</label>
              <div className="grid grid-cols-3 gap-2">
                {(['usdt', 'eth', 'btc'] as const).map((key) => {
                  const item = CRYPTO_CONFIGS[key];
                  const isSelected = selectedCrypto === key;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedCrypto(item.id)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-600 text-blue-950 shadow-xs ring-1 ring-blue-500/30'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        <span className="w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center bg-blue-600 text-white shadow-2xs">
                          {item.symbol === 'USDT' ? '₮' : item.symbol === 'ETH' ? 'Ξ' : '₿'}
                        </span>
                      </div>
                      <span className="text-xs font-bold block text-slate-950">{item.symbol}</span>
                      <span className="text-[10px] text-slate-500 font-mono block truncate">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Network & Address Display Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 font-bold">Network:</span>
                <span className="font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md border border-blue-200">
                  {currentCrypto.network}
                </span>
              </div>

              {/* QR Code and Address Copy Section */}
              <div className="flex flex-col sm:flex-row items-center gap-4 py-1">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="relative p-1.5 rounded-2xl bg-black border border-slate-700 shadow-md">
                    <img
                      src={currentCrypto.qrImage}
                      alt={`${currentCrypto.symbol} Official Deposit QR Code`}
                      className="w-36 h-36 sm:w-40 sm:h-40 rounded-xl object-contain block"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 text-center font-semibold">
                    Scan with wallet
                  </span>
                </div>

                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span className="font-bold">Deposit Address:</span>
                    <button
                      onClick={copyAddress}
                      className="text-blue-600 hover:text-blue-800 text-xs font-black flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? 'Copied!' : 'Copy Address'}</span>
                    </button>
                  </div>

                  <div
                    onClick={copyAddress}
                    className="p-3 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-900 break-all cursor-pointer hover:border-blue-400 transition-colors select-all shadow-2xs font-bold"
                  >
                    {currentCrypto.address}
                  </div>

                  <div className="text-[10px] text-slate-500 space-y-0.5 font-mono">
                    <div>Min Deposit: <strong className="text-slate-800">{currentCrypto.minDeposit}</strong></div>
                    <div>Confirmation: <strong className="text-slate-800">{currentCrypto.confirmations}</strong></div>
                  </div>
                </div>
              </div>

              {/* Network Warning Banner */}
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                <p className="leading-snug font-medium">
                  Only send <strong>{currentCrypto.symbol}</strong> via the <strong>{currentCrypto.network}</strong>. Sending any other currency or using an incompatible network will result in irreversible loss of capital.
                </p>
              </div>
            </div>

            {/* Credit Amount (USD Equivalent) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Equivalent Credit Amount (USD)</label>
                <span className="text-[11px] text-slate-500 font-mono">1:1 Value</span>
              </div>
              <div className="relative mb-2">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  value={amountInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setAmountInput('');
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
                    setAmountInput(clean);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && (amountInput === '0' || amountInput === '0.00')) {
                      e.preventDefault();
                      setAmountInput('');
                    }
                  }}
                  onFocus={() => {
                    if (amountInput === '0') {
                      setAmountInput('');
                    }
                  }}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:outline-none text-base font-black font-mono text-slate-950 transition-colors"
                />
              </div>

              {/* Fast Presets */}
              <div className="grid grid-cols-4 gap-2">
                {[500, 2500, 8000, 50000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountInput(String(preset))}
                    className={`py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      amount === preset
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300'
                    }`}
                  >
                    ${preset >= 1000 ? `${preset / 1000}k` : preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Tx Hash */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Transaction Hash / Reference (Optional)
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Paste blockchain transaction TXID or reference..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none font-mono transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleDeposit}
              disabled={loading || amount <= 0}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm tracking-wide shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>{loading ? 'Processing Deposit...' : `Confirm Deposit of $${amount.toLocaleString()} USD`}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
