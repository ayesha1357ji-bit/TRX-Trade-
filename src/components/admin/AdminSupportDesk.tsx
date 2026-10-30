import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SupportTicket } from '../../types';
import {
  Headphones,
  Search,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  ShieldCheck,
  Check,
  Sparkles,
  RefreshCw,
  CornerDownRight,
  Filter,
  Image as ImageIcon,
  X,
  ZoomIn,
} from 'lucide-react';
import { processAndCompressImage, extractImageFromClipboard } from '../../utils/imageUtils';

const QUICK_REPLIES = [
  'Your deposit has been verified on the blockchain and credited to your trading account.',
  'Your withdrawal has been approved by the risk desk and submitted to the blockchain network.',
  'We have reviewed your request. Your trade limit has been upgraded to Tier-1 ($60,000 max size).',
  'Our liquidity desk is monitoring your active contracts. All payouts settle precisely at expiry.',
  'Your identity verification has been reviewed and approved. Real-money withdrawals are active.',
];

export const AdminSupportDesk: React.FC = () => {
  const {
    supportTickets,
    adminReplySupportTicket,
    adminUpdateTicketStatus,
  } = useAuth();

  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    supportTickets[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [replyText, setReplyText] = useState('');
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered tickets
  const filteredTickets = supportTickets.filter((ticket) => {
    const matchesFilter = statusFilter === 'ALL' || ticket.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      ticket.userEmail?.toLowerCase().includes(q) ||
      ticket.userName?.toLowerCase().includes(q) ||
      ticket.subject?.toLowerCase().includes(q) ||
      ticket.lastMessage?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const selectedTicket = supportTickets.find((t) => t.id === selectedTicketId) || filteredTickets[0];

  const handlePhotoUpload = async (file: File | Blob) => {
    try {
      setIsProcessingPhoto(true);
      const compressed = await processAndCompressImage(file);
      setAttachedPhoto(compressed);
    } catch (err: any) {
      alert(`Image upload error: ${err?.message || err}`);
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

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTicket || (!replyText.trim() && !attachedPhoto)) return;

    setSendingReply(true);
    try {
      await adminReplySupportTicket(
        selectedTicket.id,
        replyText.trim(),
        'IN_PROGRESS',
        attachedPhoto || undefined
      );
      setReplyText('');
      setAttachedPhoto(null);
      setSuccessToast('Official admin response dispatched to user.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(`Failed to send reply: ${err?.message || err}`);
    } finally {
      setSendingReply(false);
    }
  };

  const handleApplyQuickReply = (text: string) => {
    setReplyText(text);
  };

  const openTicketsCount = supportTickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = supportTickets.filter((t) => t.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-4 animate-in fade-in duration-200" onPaste={handlePaste}>
      {/* 1. Header Banner & Quick Metrics */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-wide">
                Customer Service <span className="text-blue-600">Live Control Desk</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Direct Inbound Feed
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct incoming communication from platform users, deposit inquiries, and withdrawal assistance. Supports image attachments and Ctrl+V clipboard paste.
            </p>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500">Total Inquiries: </span>
            <span className="font-bold text-slate-900 font-mono">{supportTickets.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs">
            <span className="text-red-700">Needs Response: </span>
            <span className="font-bold text-red-600 font-mono">{openTicketsCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
            <span className="text-blue-700">In Progress: </span>
            <span className="font-bold text-blue-600 font-mono">{inProgressCount}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[560px]">
        {/* Left Column: Tickets Queue List (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-white border border-slate-200 overflow-hidden flex flex-col h-[600px] shadow-sm">
          {/* Search & Filter Header */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search user, email, subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-[11px] font-mono overflow-x-auto scrollbar-none">
              {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg transition-all font-semibold whitespace-nowrap cursor-pointer ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'IN_PROGRESS' ? 'Active' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p>No customer messages matching current filter.</p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left p-3.5 transition-all relative cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-xs text-slate-900 truncate max-w-[170px]">
                        {t.userName || t.userEmail}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${
                          t.status === 'OPEN'
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}
                      >
                        {t.status === 'IN_PROGRESS' ? 'Active' : t.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-600 font-semibold truncate mb-1">
                      {t.subject || 'Support Ticket'}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                      {t.lastMessage}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{t.userEmail}</span>
                      <span>
                        {t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation & Reply Center (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-white border border-slate-200 overflow-hidden flex flex-col h-[600px] shadow-sm">
          {selectedTicket ? (
            <>
              {/* Ticket Top Meta Bar */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">{selectedTicket.userName || 'Trader'}</h4>
                      <span className="text-[11px] font-mono text-slate-500">({selectedTicket.userEmail})</span>
                    </div>
                    <p className="text-xs text-blue-600 font-semibold flex items-center gap-1.5">
                      <span>{selectedTicket.subject}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 font-mono text-[10px]">ID: {selectedTicket.id}</span>
                    </p>
                  </div>
                </div>

                {/* Status Switcher & Actions */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs font-mono">Status:</span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) =>
                      adminUpdateTicketStatus(
                        selectedTicket.id,
                        e.target.value as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
                      )
                    }
                    className="bg-white text-slate-800 font-semibold border border-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="OPEN">🔴 Open / Pending</option>
                    <option value="IN_PROGRESS">🔵 In Progress</option>
                    <option value="RESOLVED">🟢 Resolved</option>
                  </select>
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC] text-xs">
                {selectedTicket.messages?.map((msg, idx) => {
                  const isAdminMsg = msg.senderRole === 'admin';
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className={`text-[10px] font-mono font-bold ${isAdminMsg ? 'text-blue-600' : 'text-slate-600'}`}>
                          {isAdminMsg ? 'You (TRX Chief Admin)' : `${msg.senderName} (${msg.senderEmail})`}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                          isAdminMsg
                            ? 'bg-blue-600 text-white font-medium rounded-tr-xs'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
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
                              className="max-h-60 w-full object-cover rounded-xl group-hover:scale-102 transition-transform"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-mono gap-1">
                              <ZoomIn className="w-3.5 h-3.5" /> Tap to view full size
                            </div>
                          </div>
                        )}
                        {msg.message && msg.message !== '📷 [Photo Attached]' && (
                          <p className="whitespace-pre-wrap text-xs">{msg.message}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Reply Presets */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto scrollbar-none flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-mono uppercase whitespace-nowrap">Templates:</span>
                {QUICK_REPLIES.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => handleApplyQuickReply(qr)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-600 text-[11px] whitespace-nowrap transition-all cursor-pointer shadow-xs"
                  >
                    {qr.slice(0, 32)}...
                  </button>
                ))}
              </div>

              {/* Admin Reply Composer */}
              <div className="p-3.5 bg-white border-t border-slate-200">
                {successToast && (
                  <div className="mb-2 p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>{successToast}</span>
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
                          alt="Staged attachment"
                          className="w-11 h-11 rounded-lg object-cover border border-blue-300 shadow-xs"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center text-white">
                          <ZoomIn className="w-3 h-3" />
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Photo Attached
                        </span>
                        <span className="text-[10px] text-slate-500">Ready to send with your admin reply</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedPhoto(null)}
                      className="p-1 rounded-lg bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 transition-colors cursor-pointer"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                <form onSubmit={handleSendReply} className="flex gap-2 items-center">
                  {/* Photo Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all cursor-pointer flex-shrink-0"
                    title="Attach photo or paste picture (Ctrl+V)"
                  >
                    {isProcessingPhoto ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </button>

                  <textarea
                    rows={1}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Type response or paste screenshot (Ctrl+V)..."
                    className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white font-sans resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />

                  <button
                    type="submit"
                    disabled={sendingReply || (!replyText.trim() && !attachedPhoto)}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 active:scale-98 flex-shrink-0 cursor-pointer"
                  >
                    {sendingReply ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-white" />
                        <span className="hidden sm:inline">Send Reply</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">Select a support ticket to start chatting</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Incoming messages from any user or guest will show up in real-time in the queue on the left.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageModal}
              alt="Enlarged preview"
              className="rounded-2xl max-h-[80vh] w-auto object-contain border border-slate-200 shadow-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
