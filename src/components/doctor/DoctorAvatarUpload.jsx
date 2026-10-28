/**
 * DoctorAvatarUpload — Profil Rasmi Yuklash Komponenti
 * ─────────────────────────────────────────────────────
 * - jpg, png, webp formatlar, max 5MB
 * - Canvas orqali 512x512 ga resize + EXIF tozalash
 * - Aylana crop preview
 * - "Rasmim bemorlarga ko'rinishiga roziman" rozilik
 * - Rasm yo'q bo'lsa initials avatar (rangli doira)
 */
import React, { useState, useRef, useCallback } from 'react';
import { Upload, Trash2, Camera, Check, AlertCircle, User, Loader } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// ── Initials Avatar (rasm yuklagan bo'lmasa) ──────────────────────────────────
export const InitialsAvatar = ({ name = '', doctorId = '', size = 80, className = '' }) => {
  // doctorId bo'yicha doimiy rang
  const colors = [
    '#0d9488','#0284c7','#7c3aed','#db2777','#d97706',
    '#059669','#2563eb','#9333ea','#e11d48','#b45309',
  ];
  const colorIndex = doctorId
    ? doctorId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
    : 0;
  const bg = colors[colorIndex];

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  const fontSize = Math.floor(size * 0.36);

  return (
    <div
      className={`flex items-center justify-center rounded-full select-none flex-shrink-0 font-extrabold text-white shadow-md ${className}`}
      style={{ width: size, height: size, backgroundColor: bg, fontSize }}
      aria-label={name}
    >
      {initials || <User style={{ width: size * 0.45, height: size * 0.45 }} />}
    </div>
  );
};

// ── Main upload component ──────────────────────────────────────────────────────
export const DoctorAvatarUpload = ({ doctor, onAvatarChange }) => {
  const { showToast } = useApp();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const [preview, setPreview] = useState(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
  const TARGET_SIZE = 512;

  // ── EXIF-free resize via Canvas ──────────────────────────────────────────────
  const resizeAndStrip = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;
        const ctx = canvas.getContext('2d');

        // Cover crop (aylana uchun kvadrat)
        const { naturalWidth: w, naturalHeight: h } = img;
        const min = Math.min(w, h);
        const sx = (w - min) / 2;
        const sy = (h - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, TARGET_SIZE, TARGET_SIZE);

        canvas.toBlob(
          blob => {
            if (!blob) { reject(new Error('Canvas blob failed')); return; }
            resolve(blob);
          },
          'image/webp', 0.88
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
      img.src = url;
    });
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Faqat JPG, PNG yoki WebP formatdagi rasm yuklanadi.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Fayl hajmi 5 MB dan oshmasin.");
      return;
    }

    // Preview yaratish
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setPendingFile(file);
      setShowConfirm(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!consent) {
      setError("Iltimos, bemorga ko'rinishiga roziligingizni belgilang.");
      return;
    }
    if (!pendingFile) return;

    setLoading(true);
    setError('');
    try {
      const blob = await resizeAndStrip(pendingFile);
      const dataUrl = await blobToDataUrl(blob);

      // Ishlab chiqarishda: Supabase Storage'ga yuklash, bu yerda localStorage demo
      const avatarKey = `mednavbat_avatar_${doctor?.id || 'doc'}`;
      localStorage.setItem(avatarKey, dataUrl);

      // Moderatsiya holati: pending
      const moderationKey = `mednavbat_avatar_moderation_${doctor?.id}`;
      localStorage.setItem(moderationKey, JSON.stringify({
        status: 'pending',
        submittedAt: new Date().toISOString(),
      }));

      onAvatarChange?.(dataUrl, 'pending');
      setShowConfirm(false);
      setPreview(null);
      setPendingFile(null);
      showToast("Rasm yuklandi! Admin tekshirguncha bemorlar umumiy avatar ko'radi.", 'success', 4500);
    } catch {
      setError("Rasm qayta ishlashda xato yuz berdi. Qayta urinib ko'ring.");
    }
    setLoading(false);
  };

  const handleCancelUpload = () => {
    setPreview(null);
    setPendingFile(null);
    setShowConfirm(false);
    setConsent(false);
    setError('');
  };

  const handleDeleteAvatar = () => {
    if (!window.confirm("Profilrasm o'chirilsinmi?")) return;
    const avatarKey = `mednavbat_avatar_${doctor?.id || 'doc'}`;
    localStorage.removeItem(avatarKey);
    localStorage.removeItem(`mednavbat_avatar_moderation_${doctor?.id}`);
    onAvatarChange?.(null, null);
    showToast("Profil rasmi o'chirildi.", 'info');
  };

  function blobToDataUrl(blob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }

  const currentAvatar = doctor?.avatar
    ? doctor.avatar
    : localStorage.getItem(`mednavbat_avatar_${doctor?.id}`);

  const moderation = (() => {
    try {
      const raw = localStorage.getItem(`mednavbat_avatar_moderation_${doctor?.id}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  return (
    <div className="flex flex-col items-center gap-4">
      {/* ── Preview / Current Avatar ── */}
      <div className="relative">
        {currentAvatar ? (
          <div className="relative">
            <img
              src={currentAvatar}
              alt={`Dr. ${doctor?.name || ''}`}
              className="w-24 h-24 rounded-full object-cover border-4 border-teal-400 shadow-lg"
            />
            {moderation?.status === 'pending' && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                Ko'rib chiqilmoqda
              </div>
            )}
            {moderation?.status === 'approved' && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Tasdiqlangan
              </div>
            )}
          </div>
        ) : (
          <InitialsAvatar name={doctor?.name || doctor?.fullName || ''} doctorId={doctor?.id || ''} size={96} />
        )}
      </div>

      {/* ── Buttons ── */}
      {!showConfirm && (
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold transition"
            style={{ minHeight: 44 }}
          >
            <Camera className="w-4 h-4" />
            Rasm yuklash
          </button>
          {currentAvatar && (
            <button
              onClick={handleDeleteAvatar}
              className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition hover:bg-rose-100 dark:hover:bg-rose-950/60"
              style={{ minHeight: 44 }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        capture="user"
      />

      {/* ── Confirm dialog ── */}
      {showConfirm && preview && (
        <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-4 shadow-xl">
          <p className="text-xs font-extrabold text-slate-800 dark:text-white text-center">Rasmni tasdiqlash</p>

          {/* Crop preview */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-teal-400 shadow-lg">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Consent */}
          <label className="flex items-start gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-teal-600 flex-shrink-0"
            />
            <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug group-hover:text-teal-700 dark:group-hover:text-teal-300 transition">
              Rasmim bemorlarga ko'rinishiga roziman
            </span>
          </label>

          {error && (
            <div className="flex items-start gap-1.5 p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleConfirmUpload}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-extrabold transition"
              style={{ minHeight: 44 }}
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {loading ? 'Yuklanmoqda...' : 'Yuklash'}
            </button>
            <button
              onClick={handleCancelUpload}
              disabled={loading}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              style={{ minHeight: 44 }}
            >
              Bekor
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center leading-snug">
            Rasm 512×512px ga kichraytirilib, GPS va shaxsiy ma'lumotlar o'chiriladi.
          </p>
        </div>
      )}

      {error && !showConfirm && (
        <div className="flex items-start gap-1.5 p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs border border-rose-200 dark:border-rose-900 max-w-xs w-full">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center max-w-xs leading-snug">
        JPG, PNG yoki WebP · Maksimal 5 MB · Admin tekshiruvidan o'tadi
      </p>
    </div>
  );
};
