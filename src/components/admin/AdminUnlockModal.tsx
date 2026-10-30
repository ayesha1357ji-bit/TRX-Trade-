import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Lock, KeyRound, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface AdminUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminUnlockModal: React.FC<AdminUnlockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { unlockAdminWithPin } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const ok = unlockAdminWithPin(pin);
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPin('');
        onSuccess();
        onClose();
      }, 700);
    } else {
      setError('Invalid authorization key or access denied.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-3 text-blue-600 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black tracking-wider text-slate-900">
            ADMINISTRATIVE ACCESS
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Access restricted strictly to authorized platform administrators. Enter security clearance key to proceed.
          </p>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-blue-600 mx-auto animate-bounce" />
            <p className="text-xs font-bold text-blue-700">Access Granted. Launching Terminal...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter Security Key or PIN..."
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono text-center tracking-widest text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>
              {error && (
                <div className="flex items-center gap-1.5 text-[11px] text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-200">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Lock className="w-3.5 h-3.5 text-white" />
              <span>Unlock Admin Terminal</span>
            </button>

            <p className="text-[10px] text-slate-400 text-center font-mono">
              Authorized personnel only • Zero-trust verified
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
