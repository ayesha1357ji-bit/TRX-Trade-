import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  Send,
  X,
  Headphones,
  CheckCheck,
  Clock,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Paperclip,
  ZoomIn,
} from 'lucide-react';
import { SupportMessage } from '../../types';
import { processAndCompressImage, extractImageFromClipboard } from '../../utils/imageUtils';

interface CustomerSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQ_SUGGESTIONS = [
  'How do I deposit via USDT (TRC20)?',
  'What is the minimum trade size and payout?',
  'How long do withdrawals take to process?',
  'Can I increase my account trading limits?',
  'Is my account verified for real-money trading?',
];

export const CustomerSupportModal: React.FC<CustomerSupportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    userProfile,
    userTicket,
    sendCustomerMessage,
  } = useAuth();

  const [messageText, setMessageText] = useState('');
  const [subject, setSubject] = useState('Deposit & Account Support');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, userTicket?.messages, attachedPhoto]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (file: File | Blob) => {
    try {
      setIsProcessingPhoto(true);
      setErrorMsg(null);
      const compressed = await processAndCompressImage(file);
      setAttachedPhoto(compressed);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to process image. Please try another photo.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
      e.target.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const imgFile = extractImageFromClipboard(e);
    if (imgFile) {
      e.preventDefault();
      handlePhotoUpload(imgFile);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() && !attachedPhoto) return;

    if (!currentUser && !guestEmail.trim()) {
      setErrorMsg('Please enter your contact email so admin can reach you.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await sendCustomerMessage({
        subject,
        message: messageText.trim(),
        imageUrl: attachedPhoto || undefined,
        name: currentUser?.displayName || guestName || 'Trader',
        email: currentUser?.email || guestEmail.trim() || 'guest@trxtrade.com',
      });
      setMessageText('');
      setAttachedPhoto(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send message. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickFaq = (faq: string) => {
    setMessageText(faq);
  };

  const messages: SupportMessage[] = userTicket?.messages || [
    {
      id: 'welcome',
      ticketId: 'init',
      senderId: 'admin_desk',
      senderName: 'TRX Chief Desk',
      senderEmail: 'ayesha1357ji@gmail.com',
      senderRole: 'admin',
      message:
        'Welcome to TRXTRADE 24/7 Priority Support. Your messages are monitored directly by the Chief Risk Administrator. You can send questions, attach photos, or paste screenshots anytime.',
      timestamp: new Date().toISOString(),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
      onPaste={handlePaste}
    >
      <div className="w-full sm:max-w-md h-[92vh] sm:h-[640px] bg-white border border-slate-200 sm:rounded-3xl shadow-[0_20px_50px_rgba(37,99,235,0.2)] flex flex-col overflow-hidden text-slate-900">
        {/* Header: Classy Royal Blue Gradient */}
        <div className="p-4 bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#1D4ED8] border-b border-blue-400/20 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xs">
                <Headphones className="w-5 h-5 font-bold" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-sm sm:text-base tracking-wide flex items-center gap-1.5">
                  TRX <span>Customer Service</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white border border-white/30 font-bold uppercase">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-blue-100 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                Direct Priority Routing to Desk
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest Credentials form if not signed in */}
        {!currentUser && (
          <div className="p-3 bg-blue-50/60 border-b border-blue-100 text-xs">
            <p className="text-[11px] text-blue-900 font-bold mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Guest Trader Concierge:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Your Name (Optional)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-blue-200 text-slate-900 text-[11px] focus:outline-none focus:border-blue-600"
              />
              <input
                type="email"
                placeholder="Email for Admin Reply *"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-blue-200 text-slate-900 text-[11px] focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        )}

        {/* Department / Category Selector */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-mono font-bold">Department:</span>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-white text-blue-700 font-bold border border-blue-200 rounded-lg px-2.5 py-1 focus:outline-none text-[11px] shadow-2xs cursor-pointer"
          >
            <option value="Deposit & Account Support">Deposit Support (USDT/ETH/BTC)</option>
            <option value="Withdrawal Clearance">Withdrawal Clearance</option>
            <option value="Trading Execution & Expirations">Trading Execution & Expirations</option>
            <option value="KYC Verification & Limits">KYC Verification & Limits</option>
            <option value="VIP Priority Desk">VIP Priority Desk</option>
          </select>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC] text-xs">
          {/* Status Alert Banner */}
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-950">Direct Line to TRX Trading Desk</p>
              <p className="text-[10px] text-slate-600">
                Any message, photo, or pasted picture sent here notifies the Chief Administrator directly in real time.
              </p>
            </div>
          </div>

          {/* Quick FAQ prompts */}
          {messages.length <= 1 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">Quick Inquiries:</p>
              <div className="flex flex-col gap-1.5">
                {FAQ_SUGGESTIONS.map((faq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePickFaq(faq)}
                    className="text-left text-[11px] text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl px-3 py-1.5 transition-all flex items-center justify-between cursor-pointer shadow-2xs"
                  >
                    <span>{faq}</span>
                    <HelpCircle className="w-3 h-3 text-slate-400 hover:text-blue-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => {
            const isAdminMsg = msg.senderRole === 'admin';
            return (
              <div
                key={msg.id || i}
                className={`flex flex-col ${isAdminMsg ? 'items-start' : 'items-end'}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 px-1">
                  <span className={`text-[10px] font-mono font-bold ${isAdminMsg ? 'text-blue-700' : 'text-slate-500'}`}>
                    {isAdminMsg ? 'TRX Chief Admin (Desk)' : (msg.senderName || 'You')}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                    isAdminMsg
                      ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-tr-xs shadow-blue-500/20'
                  }`}
                >
                  {/* Photo Attachment if present */}
                  {msg.imageUrl && (
                    <div
                      className="mb-2 relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                      onClick={() => setPreviewImageModal(msg.imageUrl || null)}
                    >
                      <img
                        src={msg.imageUrl}
                        alt="attachment"
                        className="max-h-56 w-full object-cover rounded-xl group-hover:scale-102 transition-transform"
                      />
                      <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-mono gap-1">
                        <ZoomIn className="w-3.5 h-3.5" /> Tap to view full size
                      </div>
                    </div>
                  )}

                  {msg.message && msg.message !== '📷 [Photo Attached]' && (
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  )}
                </div>

                {isAdminMsg && (
                  <span className="flex items-center gap-1 text-[9px] text-blue-700 mt-0.5 px-1 font-mono font-bold">
                    <CheckCheck className="w-3 h-3 text-blue-600" /> Official TRX Verification
                  </span>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-white border-t border-slate-200">
          {errorMsg && (
            <div className="mb-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Staged Photo Thumbnail Preview */}
          {attachedPhoto && (
            <div className="mb-2 p-2 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center gap-2.5">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => setPreviewImageModal(attachedPhoto)}
                  title="Click to preview"
                >
                  <img
                    src={attachedPhoto}
                    alt="Photo attachment staged"
                    className="w-11 h-11 rounded-lg object-cover border border-blue-400 shadow-xs"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center text-white">
                    <ZoomIn className="w-3 h-3" />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> Photo Attached
                  </span>
                  <span className="text-[10px] text-slate-500">Ready to send with your inquiry</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAttachedPhoto(null)}
                className="p-1 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Hidden File Input for Image Attachment */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Attach Photo Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingPhoto}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 text-blue-600 transition-all cursor-pointer flex-shrink-0 active:scale-95 shadow-2xs"
              title="Attach photo or image file"
            >
              {isProcessingPhoto ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </button>

            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onPaste={handlePaste}
              placeholder="Ask anything or paste photo (Ctrl+V)..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-sans"
            />

            <button
              type="submit"
              disabled={submitting || (!messageText.trim() && !attachedPhoto)}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition-all disabled:opacity-40 disabled:shadow-none hover:scale-102 flex-shrink-0 cursor-pointer"
              title="Send to Admin"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-blue-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Paste (Ctrl+V) or click photo icon
            </span>
            <span>24/7 Live Priority Desk</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageModal}
              alt="Enlarged preview"
              className="rounded-2xl max-h-[80vh] w-auto object-contain border border-blue-400/40 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
