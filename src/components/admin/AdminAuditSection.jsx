/**
 * MedNavbat — Admin Xavfsizlik Audit Jurnali Bo'limi
 * ──────────────────────────────────────────────────
 * Faqat administrator ko'ra oladi:
 *  - Kim qaysi ma'lumotni qachon ochganini va amallarni kuzatish
 *  - Telefonlar niqoblangan, tibbiy maxfiylik ta'minlangan
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Trash2, 
  Clock, 
  User, 
  Smartphone, 
  Monitor, 
  FileText,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { getAuditLogs, clearAuditLogs } from '../../services/auditLogService';

export const AdminAuditSection = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const loadLogs = () => {
    setLogs(getAuditLogs());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClear = () => {
    if (window.confirm("Haqiqatan ham audit jurnalini tozalamoqchimisiz?")) {
      clearAuditLogs();
      setLogs([]);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesRole = roleFilter === 'all' || log.actorRole === roleFilter;
    const matchesSearch =
      !searchTerm.trim() ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black border border-amber-500/30 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Faqat Administrator Uchun Himoyalangan Jurnal</span>
          </div>
          <h2 className="text-xl font-black text-white">Xavfsizlik Audit Jurnali</h2>
          <p className="text-xs text-slate-400 mt-1">
            Barcha kirishlar, navbat yaratish, bekor qilish va hisob o'chirish harakatlari vaqti va roli bilan qayd etiladi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Yangilash</span>
          </button>
          <button
            onClick={handleClear}
            className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Tozalash</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Harakat, telefon yoki manba bo'yicha qidirish..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              roleFilter === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Barchasi ({logs.length})
          </button>
          <button
            onClick={() => setRoleFilter('patient')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              roleFilter === 'patient' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Bemor
          </button>
          <button
            onClick={() => setRoleFilter('doctor')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              roleFilter === 'doctor' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Shifokor
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              roleFilter === 'admin' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 overflow-hidden shadow-xl">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-bold">Hozircha audit yozuvlari mavjud emas</p>
            <p className="text-xs text-slate-500">Tizimda kirish, navbat olish yoki profil amallari bajarilganda bu yerda ko'rinadi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-black border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Vaqt</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Identifikator (Niqoblangan)</th>
                  <th className="py-3 px-4">Amal (Action)</th>
                  <th className="py-3 px-4">Manba</th>
                  <th className="py-3 px-4">Tafsilot</th>
                  <th className="py-3 px-4">Qurilma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const formattedTime = dateObj.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const formattedDate = dateObj.toLocaleDateString('uz-UZ');

                  const roleBadgeClass = {
                    patient: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                    doctor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
                    admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                    system: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
                  }[log.actorRole] || 'bg-slate-700 text-slate-300';

                  return (
                    <tr key={log.id} className="hover:bg-slate-700/40 transition">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                        <div>{formattedTime}</div>
                        <div className="text-[10px] text-slate-500">{formattedDate}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${roleBadgeClass}`}>
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        {log.actorId}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-amber-400">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {log.resource}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={log.details}>
                        {log.details || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <span className="flex items-center gap-1">
                          {log.clientAgent === 'Mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                          <span>{log.clientAgent}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditSection;
