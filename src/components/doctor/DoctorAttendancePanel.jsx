/**
 * DoctorAttendancePanel — Shifokor Davomat va Dam Olish Bo'limi
 * ─────────────────────────────────────────────────────────────────
 * - Bugungi holat (check-in)
 * - Ertangi kun uchun javob (kun oxirida)
 * - Dam olish so'rovi yuborish
 * - Dam olish tarixi (so'nggi 10 ta)
 * - O'tgan oy davomati jadvali
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2, XCircle, Clock, Calendar, Plus, ChevronDown,
  ChevronUp, Send, AlertCircle, Sun, Moon, BriefcaseMedical,
  Coffee, Smile, Frown, HelpCircle
} from 'lucide-react';
import {
  getTodayAttendance,
  getTomorrowAttendance,
  checkInDoctor,
  answerTomorrowQuestion,
  getAttendanceHistory,
  getDoctorLeaves,
  submitLeaveRequest,
  isMorningTime,
  isEveningTime,
  todayStr,
  tomorrowStr,
} from '../../services/doctorAttendanceService';
import {
  notifyDailyReminder,
} from '../../services/doctorNotificationService';

const STATUS_CONFIG = {
  present:      { label: 'Ishda',        icon: <Smile className="w-4 h-4" />,    color: 'emerald' },
  absent:       { label: 'Kelmadi',      icon: <Frown className="w-4 h-4" />,    color: 'rose'    },
  leave:        { label: 'Dam olishda',  icon: <Coffee className="w-4 h-4" />,   color: 'indigo'  },
  expected:     { label: 'Keladi',       icon: <CheckCircle2 className="w-4 h-4"/>, color: 'teal'  },
  day_off_self: { label: "Kelmayman",    icon: <XCircle className="w-4 h-4" />,  color: 'amber'   },
};

const LEAVE_STATUS = {
  pending:   { label: 'Ko\'rilmoqda', bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' },
  approved:  { label: 'Tasdiqlandi',  bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' },
  rejected:  { label: 'Rad etildi',   bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' },
};

export const DoctorAttendancePanel = ({ doctor }) => {
  const doctorId = doctor?.id;
  const doctorName = doctor?.name || doctor?.fullName || 'Shifokor';

  const [todayAttn, setTodayAttn] = useState({ status: null });
  const [tomorrowAttn, setTomorrowAttn] = useState({ status: null });
  const [leaves, setLeaves] = useState([]);
  const [history, setHistory] = useState([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveError, setLeaveError] = useState('');

  const isMorning = isMorningTime();
  const isEvening = isEveningTime();

  const refresh = useCallback(() => {
    if (!doctorId) return;
    setTodayAttn(getTodayAttendance(doctorId));
    setTomorrowAttn(getTomorrowAttendance(doctorId));
    setLeaves(getDoctorLeaves(doctorId));
    setHistory(getAttendanceHistory(doctorId, 30));
  }, [doctorId]);

  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener('mednavbat_attendance_changed', h);
    window.addEventListener('mednavbat_leaves_changed', h);
    return () => {
      window.removeEventListener('mednavbat_attendance_changed', h);
      window.removeEventListener('mednavbat_leaves_changed', h);
    };
  }, [refresh]);

  const handleCheckIn = () => {
    checkInDoctor(doctorId);
    refresh();
  };

  const handleTomorrow = (answer) => {
    answerTomorrowQuestion(doctorId, answer);
    refresh();
  };

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    setLeaveError('');
    if (!leaveForm.startDate || !leaveForm.endDate) {
      setLeaveError("Sana kiritish shart");
      return;
    }
    if (leaveForm.startDate > leaveForm.endDate) {
      setLeaveError("Boshlanish sanasi tugash sanasidan kechga bo'lmasin");
      return;
    }
    setLeaveSubmitting(true);
    setTimeout(() => {
      submitLeaveRequest({
        doctorId,
        doctorName,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason,
      });
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      setShowLeaveForm(false);
      setLeaveSubmitting(false);
      refresh();
    }, 600);
  };

  const today = todayStr();
  const tomorrow = tomorrowStr();

  // Davomat statistikasi (so'nggi 30 kun)
  const presentDays = history.filter(h => h.status === 'present').length;
  const absentDays = history.filter(h => h.status === 'absent').length;
  const leaveDays = history.filter(h => h.status === 'leave').length;

  return (
    <div className="space-y-5">

      {/* ── Bugungi holat ── */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center">
            <Sun className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Bugungi Davomat</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatDate(today)}</p>
          </div>
        </div>

        {todayAttn.status === 'present' ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">Siz bugun ishdasiz ✅</p>
              {todayAttn.checkedInAt && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  Kirish vaqti: {new Date(todayAttn.checkedInAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        ) : todayAttn.status === 'leave' ? (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-900">
            <p className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300">Dam olish kuni 🌴</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isMorning
                ? "Bugun ishga keldingizmi? Iltimos, tasdiqlang:"
                : "Bugungi davomat tasdiqlanmagan."}
            </p>
            <button
              onClick={handleCheckIn}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-teal-500/25 transition transform active:scale-95"
              style={{ minHeight: 44 }}
            >
              <BriefcaseMedical className="w-4 h-4" />
              Bugun ishga keldim ✅
            </button>
          </div>
        )}
      </div>

      {/* ── Ertangi kun savoli ── */}
      {(isEvening || !tomorrowAttn.status) && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center">
              <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Ertangi Kun</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatDate(tomorrow)}</p>
            </div>
          </div>

          {tomorrowAttn.status ? (
            <div className={`p-4 rounded-2xl border ${
              tomorrowAttn.status === 'expected'
                ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
            }`}>
              <p className={`text-sm font-extrabold ${
                tomorrowAttn.status === 'expected'
                  ? 'text-teal-700 dark:text-teal-300'
                  : 'text-amber-700 dark:text-amber-300'
              }`}>
                {tomorrowAttn.status === 'expected' ? 'Ertaga kelasiz ✅' : 'Ertaga kelmasligingiz belgilandi ☕'}
              </p>
              <button
                onClick={() => setTomorrowAttn({ status: null })}
                className="text-[11px] text-slate-400 underline mt-1"
              >
                O'zgartirish
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ertaga ishga kelasizmi? Bemorlar navbat olib qo'yishdan oldin xabar bering.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleTomorrow('will_come')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold transition transform active:scale-95"
                  style={{ minHeight: 44 }}
                >
                  <Smile className="w-4 h-4" />
                  Ha, kelaman
                </button>
                <button
                  onClick={() => handleTomorrow('will_not_come')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-extrabold transition transform active:scale-95"
                  style={{ minHeight: 44 }}
                >
                  <Coffee className="w-4 h-4" />
                  Yo'q, kelmayman
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Statistika ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ishda', value: presentDays, color: 'emerald' },
          { label: 'Kelmadi', value: absentDays, color: 'rose' },
          { label: 'Dam oldi', value: leaveDays, color: 'indigo' },
        ].map(stat => (
          <div key={stat.label} className={`p-4 rounded-2xl border text-center ${
            stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
            : stat.color === 'rose' ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
            : 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900'
          }`}>
            <p className={`text-2xl font-black ${
              stat.color === 'emerald' ? 'text-emerald-700 dark:text-emerald-300'
              : stat.color === 'rose' ? 'text-rose-700 dark:text-rose-300'
              : 'text-indigo-700 dark:text-indigo-300'
            }`}>{stat.value}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">{stat.label}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">30 kun</p>
          </div>
        ))}
      </div>

      {/* ── Dam olish so'rovlari ── */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Dam Olish So'rovlari</h3>
          </div>
          <button
            onClick={() => setShowLeaveForm(!showLeaveForm)}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold transition"
            style={{ minHeight: 36 }}
          >
            <Plus className="w-3.5 h-3.5" />
            Yangi so'rov
          </button>
        </div>

        {/* Leave form */}
        {showLeaveForm && (
          <form onSubmit={handleLeaveSubmit} className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Yangi Dam Olish So'rovi</p>
            {leaveError && (
              <div className="flex items-center gap-2 p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs border border-rose-200 dark:border-rose-900">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {leaveError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Boshlanish sanasi</label>
                <input
                  type="date"
                  value={leaveForm.startDate}
                  min={todayStr()}
                  onChange={e => setLeaveForm(f => ({ ...f, startDate: e.target.value }))}
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ minHeight: 40 }}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Tugash sanasi</label>
                <input
                  type="date"
                  value={leaveForm.endDate}
                  min={leaveForm.startDate || todayStr()}
                  onChange={e => setLeaveForm(f => ({ ...f, endDate: e.target.value }))}
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ minHeight: 40 }}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Sabab (ixtiyoriy)</label>
              <input
                type="text"
                placeholder="Masalan: Tibbiy ko'rik, dam olish..."
                value={leaveForm.reason}
                onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))}
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                style={{ minHeight: 40 }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={leaveSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-extrabold transition"
                style={{ minHeight: 44 }}
              >
                <Send className="w-3.5 h-3.5" />
                {leaveSubmitting ? 'Yuborilmoqda...' : "So'rov yuborish"}
              </button>
              <button
                type="button"
                onClick={() => setShowLeaveForm(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
                style={{ minHeight: 44 }}
              >
                Bekor
              </button>
            </div>
          </form>
        )}

        {/* Leaves list */}
        {leaves.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
            Dam olish so'rovlari yo'q
          </p>
        ) : (
          <div className="space-y-2">
            {leaves.slice(0, 5).map(leave => (
              <div key={leave.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {leave.startDate} → {leave.endDate}
                  </p>
                  {leave.reason && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{leave.reason}</p>
                  )}
                  {leave.adminComment && leave.status !== 'pending' && (
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                      Admin: {leave.adminComment}
                    </p>
                  )}
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ml-3 flex-shrink-0 ${
                  LEAVE_STATUS[leave.status]?.bg || 'bg-slate-100 text-slate-600'
                }`}>
                  {LEAVE_STATUS[leave.status]?.label || leave.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tarix ── */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">30 Kunlik Tarix</h3>
          </div>
          {showHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showHistory && (
          <div className="mt-4 grid grid-cols-7 gap-1">
            {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 pb-1">{d}</div>
            ))}
            {history.slice(0, 28).reverse().map((item) => {
              const dayOfWeek = new Date(item.date).getDay();
              const color = item.status === 'present' ? 'bg-emerald-500'
                : item.status === 'leave' ? 'bg-indigo-400'
                : item.status === 'day_off_self' ? 'bg-amber-400'
                : item.status === null && (dayOfWeek === 0 || dayOfWeek === 6) ? 'bg-slate-200 dark:bg-slate-700'
                : item.status === null ? 'bg-slate-100 dark:bg-slate-800'
                : 'bg-rose-400';
              return (
                <div
                  key={item.date}
                  title={`${item.date}: ${STATUS_CONFIG[item.status]?.label || 'Ma\'lumot yo\'q'}`}
                  className={`h-6 rounded-md ${color} transition hover:scale-110 cursor-help`}
                />
              );
            })}
          </div>
        )}
        {showHistory && (
          <div className="mt-3 flex flex-wrap gap-3">
            {[
              { color: 'bg-emerald-500', label: 'Ishda' },
              { color: 'bg-rose-400',    label: 'Kelmadi' },
              { color: 'bg-indigo-400',  label: 'Dam olish' },
              { color: 'bg-amber-400',   label: 'O\'zi kelmadi' },
              { color: 'bg-slate-200 dark:bg-slate-700', label: 'Dam kuni' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${item.color}`} />
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch { return dateStr; }
}
