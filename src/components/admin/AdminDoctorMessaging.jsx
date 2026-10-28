/**
 * AdminDoctorMessaging — Admin Shifokorlarga Xabar Yuborish Bo'limi
 * ─────────────────────────────────────────────────────────────────────────────
 * Imkoniyatlar:
 *   - Bitta shifokorga, muayyan shifoxona shifokorlariga yoki hammaga xabar yuborish
 *   - Xabar qanday ko'rinishi real vaqtda oldindan ko'rinishi (Live Preview)
 *   - Yetkazildi va O'qildi holatini (kim qachon o'qidi) kuzatish
 */

import React, { useState, useEffect } from 'react';
import {
  Send, MessageSquare, Users, User, Eye, CheckCheck, Loader, Bell,
  Building2, Clock, Check, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  notifyAdminMessage,
  broadcastAdminMessage,
  getAdminMessageDeliveryStatus,
} from '../../services/doctorNotificationService';

export const AdminDoctorMessaging = () => {
  const { doctors = [], showToast, getLocalized } = useApp();
  const [mode, setMode] = useState('all'); // 'all' | 'hospital' | 'single'
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(true);
  const [expandedMsgId, setExpandedMsgId] = useState(null);

  const [sentHistory, setSentHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mednavbat_admin_sent_msgs') || '[]');
    } catch {
      return [];
    }
  });

  const approvedDoctors = doctors.filter(d => d.status === 'approved' || d.licenseVerified || !d.status);

  // Unikal shifoxonalar ro'yxati
  const hospitals = Array.from(new Set(
    approvedDoctors.map(d => d.hospitalName).filter(Boolean)
  ));

  // Shifoxona bo'yicha shifokorlar
  const hospitalDoctors = selectedHospital
    ? approvedDoctors.filter(d => d.hospitalName === selectedHospital)
    : [];

  const handleRefreshHistory = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('mednavbat_admin_sent_msgs') || '[]');
      setSentHistory(stored);
    } catch {}
  };

  useEffect(() => {
    const handler = () => handleRefreshHistory();
    window.addEventListener('mednavbat_doctor_notifs_changed', handler);
    return () => window.removeEventListener('mednavbat_doctor_notifs_changed', handler);
  }, []);

  const handleSend = () => {
    if (!message.trim()) {
      showToast("Iltimos, xabar matnini kiriting", 'warning');
      return;
    }
    if (mode === 'single' && !selectedDoctorId) {
      showToast("Iltimos, shifokorni tanlang", 'warning');
      return;
    }
    if (mode === 'hospital' && !selectedHospital) {
      showToast("Iltimos, shifoxonani tanlang", 'warning');
      return;
    }

    setSending(true);
    const adminMsgId = `adm-${Date.now()}`;
    const cleanTitle = title.trim() || 'Admindan muhim xabar 📢';
    const cleanMsg = message.trim();

    setTimeout(() => {
      let recipientDoctors = [];

      if (mode === 'all') {
        recipientDoctors = approvedDoctors;
      } else if (mode === 'hospital') {
        recipientDoctors = hospitalDoctors;
      } else {
        const doc = approvedDoctors.find(d => d.id === selectedDoctorId);
        if (doc) recipientDoctors = [doc];
      }

      const docIds = recipientDoctors.map(d => d.id);
      broadcastAdminMessage(docIds, cleanMsg, cleanTitle, adminMsgId);

      const record = {
        id: adminMsgId,
        adminMsgId,
        mode,
        hospital: mode === 'hospital' ? selectedHospital : null,
        title: cleanTitle,
        message: cleanMsg,
        sentAt: new Date().toISOString(),
        recipientCount: recipientDoctors.length,
        recipients: recipientDoctors.map(d => ({
          id: d.id,
          name: d.name || d.fullName || 'Shifokor',
          specialty: getLocalized ? getLocalized(d, 'specialtyName') : (d.specialtyName || '')
        })),
      };

      const updated = [record, ...sentHistory].slice(0, 50);
      setSentHistory(updated);
      try {
        localStorage.setItem('mednavbat_admin_sent_msgs', JSON.stringify(updated));
      } catch {}

      setMessage('');
      setTitle('');
      setSending(false);
      showToast(`Xabar ${recipientDoctors.length} ta shifokorga yuborildi ✅`, 'success', 4000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* ── Yuborish Formasi (Compose Box) ── */}
      <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Shifokorlarga Bildirishnoma Yuborish</h3>
              <p className="text-[11px] text-slate-400">Shifokorlar paneliga va ulangan tashqi kanallarga yetkaziladi</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800">
            {approvedDoctors.length} ta faol shifokor
          </span>
        </div>

        {/* Qabul qiluvchi turi (Mode Selector) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => { setMode('all'); setSelectedDoctorId(''); setSelectedHospital(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer min-h-[44px] ${
              mode === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Barchaga ({approvedDoctors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('hospital'); setSelectedDoctorId(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer min-h-[44px] ${
              mode === 'hospital'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Shifoxona bo'yicha</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('single'); setSelectedHospital(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer min-h-[44px] ${
              mode === 'single'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Bitta shifokorga</span>
          </button>
        </div>

        {/* Shifoxona tanlash */}
        {mode === 'hospital' && (
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400">Shifoxonani tanlang:</label>
            <select
              value={selectedHospital}
              onChange={e => setSelectedHospital(e.target.value)}
              className="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option value="">— Shifoxonani tanlang —</option>
              {hospitals.map(h => (
                <option key={h} value={h}>
                  {h} ({approvedDoctors.filter(d => d.hospitalName === h).length} shifokor)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Bitta shifokor tanlash */}
        {mode === 'single' && (
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400">Shifokorni tanlang:</label>
            <select
              value={selectedDoctorId}
              onChange={e => setSelectedDoctorId(e.target.value)}
              className="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] cursor-pointer"
            >
              <option value="">— Shifokorni tanlang —</option>
              {approvedDoctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name || d.fullName} — {d.specialtyName || ''} ({d.hospitalName || ''})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sarlavha */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400">Xabar sarlavhasi (ixtiyoriy):</label>
          <input
            type="text"
            placeholder="Masalan: Davomat so'rovnomasiga javob bering / Bosh vrach buyrug'i"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 min-h-[44px]"
          />
        </div>

        {/* Matn */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400">Xabar matni:</label>
          <textarea
            rows={4}
            placeholder="Xabar matnini kiriting..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500 resize-none"
          />
        </div>

        {/* Real vaqtda oldindan ko'rish (Live Preview) */}
        {preview && message && (
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-indigo-500/40 space-y-2">
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider block">
              Shifokor panelidagi ko'rinishi (Oldindan ko'rish):
            </span>
            <div className="flex items-start gap-3 p-3.5 bg-slate-800 rounded-xl border-l-4 border-indigo-500">
              <div className="w-9 h-9 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-xs font-black text-white">{title.trim() || 'Admindan muhim xabar 📢'}</h5>
                <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap">{message}</p>
                <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-2">
                  <Clock className="w-3 h-3" /> Hozir
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="min-h-[44px] px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>{preview ? "Ko'rinishni berkitish" : "Ko'rib chiqish"}</span>
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md"
          >
            {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{sending ? 'Yuborilmoqda...' : 'Xabarni Yuborish'}</span>
          </button>
        </div>
      </div>

      {/* ── Yuborilgan Xabarlar Tarixi & O'qilganlik Holati ── */}
      <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-extrabold text-white">
              Yuborilgan xabarlar tarixi & O'qilganlik hisoboti
            </h3>
          </div>
          <button
            onClick={handleRefreshHistory}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yangilash</span>
          </button>
        </div>

        {sentHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">Hozircha yuborilgan xabarlar yo'q.</p>
        ) : (
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {sentHistory.map(item => {
              const status = getAdminMessageDeliveryStatus(item.adminMsgId || item.id);
              const isExpanded = expandedMsgId === item.id;
              const percent = status.total > 0 ? Math.round((status.read / status.total) * 100) : 0;

              return (
                <div
                  key={item.id}
                  className="p-4 bg-slate-900 rounded-2xl border border-slate-700/80 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-white">{item.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {item.mode === 'all' ? 'Barcha shifokorlarga'
                            : item.mode === 'hospital' ? `${item.hospital || 'Shifoxona'}`
                            : 'Yakka shifokorga'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{item.message}</p>
                      <span className="text-[10px] text-slate-500 mt-1.5 block">
                        Yuborilgan: {new Date(item.sentAt).toLocaleString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Progress & Stat */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 flex-shrink-0">
                      <span className="text-xs font-black text-emerald-400">
                        {status.read}/{status.total} o'qildi ({percent}%)
                      </span>
                      <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expand button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-400">
                      Yetkazildi: <b>{status.delivered} ta</b>
                    </span>
                    <button
                      onClick={() => setExpandedMsgId(isExpanded ? null : item.id)}
                      className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>{isExpanded ? "Tafsilotlarni yopish" : "Kimlar o'qidi?"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Expanded Readers list */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 mt-2">
                      <p className="text-[11px] font-bold text-slate-400">Xabar yuborilgan shifokorlar va o'qilish holati:</p>
                      <div className="divide-y divide-slate-800 max-h-40 overflow-y-auto">
                        {(item.recipients || []).map(r => {
                          const readInfo = status.readDoctors?.find(rd => rd.doctorId === r.id);
                          return (
                            <div key={r.id} className="py-1.5 flex items-center justify-between text-xs">
                              <span className="text-white font-medium">{r.name}</span>
                              {readInfo ? (
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>O'qildi: {new Date(readInfo.readAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">Kutilmoqda...</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
