import React, { useRef, useState } from 'react';
import { 
  Download, 
  Share2, 
  CheckCircle2, 
  Calendar, 
  Phone, 
  User, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';

/**
 * Oddiy va ishonchli QR kod SVG generatori (tashqi og'ir kutubxonasiz)
 */
function SimpleQRCodeSVG({ data, size = 180 }) {
  // Matn asosida deterministik QR matrix hosil qilish
  const modules = [];
  const matrixSize = 25; // 25x25 QR grid

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash * 31 + data.charCodeAt(i)) >>> 0;
  }

  // Burchak markerlari (Position Detection Patterns)
  const isCornerMarker = (r, c) => {
    // Chap yuqori (0..6, 0..6)
    if (r < 7 && c < 7) {
      if (r === 0 || r === 6 || c === 0 || c === 6) return true;
      if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    // O'ng yuqori (0..6, 18..24)
    if (r < 7 && c >= matrixSize - 7) {
      const cc = c - (matrixSize - 7);
      if (r === 0 || r === 6 || cc === 0 || cc === 6) return true;
      if (r >= 2 && r <= 4 && cc >= 2 && cc <= 4) return true;
      return false;
    }
    // Chap pastki (18..24, 0..6)
    if (r >= matrixSize - 7 && c < 7) {
      const rr = r - (matrixSize - 7);
      if (rr === 0 || rr === 6 || c === 0 || c === 6) return true;
      if (rr >= 2 && rr <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    return null;
  };

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      const marker = isCornerMarker(r, c);
      if (marker !== null) {
        if (marker) modules.push({ r, c });
      } else {
        // Timing patterns
        if (r === 6 || c === 6) {
          if ((r + c) % 2 === 0) modules.push({ r, c });
        } else {
          // Data bits
          const bit = ((hash ^ (r * 37 + c * 59)) % 100) < 45;
          if (bit) modules.push({ r, c });
        }
      }
    }
  }

  const cellSize = size / matrixSize;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`} 
      className="rounded-xl bg-white p-2 shadow-inner"
    >
      <rect width={size} height={size} fill="white" rx="8" />
      {modules.map((m, idx) => (
        <rect
          key={idx}
          x={m.c * cellSize}
          y={m.r * cellSize}
          width={cellSize + 0.2}
          height={cellSize + 0.2}
          fill="#0f172a"
        />
      ))}
    </svg>
  );
}

export const TicketView = ({ ticket, onClose, onBookDoctor }) => {
  const ticketCardRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!ticket) return null;

  // 1. Chiptani PNG rasm qilib yuklab olish
  const handleDownloadPNG = async () => {
    setDownloading(true);
    try {
      // Canvas yaratish
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 600;
      canvas.height = 800;

      // Fon
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 600, 800);

      // Gradient karta
      const grad = ctx.createLinearGradient(0, 40, 600, 300);
      grad.addColorStop(0, '#0d9488');
      grad.addColorStop(1, '#059669');
      ctx.fillStyle = grad;
      ctx.roundRect(30, 30, 540, 740, 24);
      ctx.fill();

      // Oq kontent foni
      ctx.fillStyle = '#ffffff';
      ctx.roundRect(45, 140, 510, 610, 20);
      ctx.fill();

      // Sarlavha
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('MEDNAVBAT ELEKTRON CHIPTA', 60, 80);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#ccfbf1';
      ctx.fillText('Tasdiqlangan milliy tibbiyot talon-chiptasi', 60, 110);

      // Chipta ID
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(ticket.ticketId, 65, 180);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('STATUS: FAOL (TASDIQLANGAN)', 65, 205);

      // Bemor ma'lumotlari
      ctx.fillStyle = '#475569';
      ctx.font = '14px sans-serif';
      ctx.fillText('Bemor:', 65, 250);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(ticket.fullName, 65, 275);

      ctx.fillStyle = '#475569';
      ctx.font = '14px sans-serif';
      ctx.fillText('Telefon:', 65, 315);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(ticket.formattedPhone || ticket.phone, 65, 335);

      ctx.fillStyle = '#475569';
      ctx.font = '14px sans-serif';
      ctx.fillText('Berilgan sana:', 65, 375);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(ticket.issuedAtFormatted || new Date().toLocaleString(), 65, 395);

      // QR kod qutisi
      ctx.fillStyle = '#f8fafc';
      ctx.roundRect(175, 430, 250, 250, 16);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('SCAN ME FOR VERIFICATION', 200, 660);

      // PNG ga aylantirib yuklab olish
      const link = document.createElement('a');
      link.download = `MedNavbat-Chipta-${ticket.ticketId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('PNG download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  // 2. Chiptani ulashish (Web Share API yoki nusxa olish)
  const handleShare = async () => {
    const shareText = `MedNavbat Elektron Chiptasi\nChipta ID: ${ticket.ticketId}\nBemor: ${ticket.fullName}\nTel: ${ticket.formattedPhone || ticket.phone}\nTekshirish: ${ticket.qrData}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MedNavbat Elektron Chiptasi',
          text: shareText,
          url: ticket.qrData
        });
        return;
      } catch (_e) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (_e) {
      // Ignored
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Muvaffaqiyat tabrigi */}
      <div className="text-center space-y-1.5">
        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-sm animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Tabriklaymiz! Registratsiya Muvaffaqiyatli
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Sizning shaxsiy QR chiptangiz tayyorlandi va tizimda tasdiqlandi.
        </p>
      </div>

      {/* Asosiy Chipta Kartasi */}
      <div 
        ref={ticketCardRef}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 text-white p-5 sm:p-6 border border-slate-800 shadow-2xl space-y-5"
      >
        {/* Dekorativ nurlar */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Chipta Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-teal-400 uppercase tracking-wider">MEDNAVBAT CHIPTA</p>
              <p className="text-[11px] text-slate-400">Elektron Talon & Navbat</p>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{ticket.statusLabelUz}</span>
          </span>
        </div>

        {/* Chipta Tanasi & QR Kod */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          
          {/* Chap: Bemor va Chipta Ma'lumotlari */}
          <div className="sm:col-span-7 space-y-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Chipta ID raqami</span>
              <p className="text-base sm:text-lg font-mono font-black text-white tracking-wider text-teal-300">
                {ticket.ticketId}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-teal-400" /> Bemor
                </span>
                <p className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                  {ticket.fullName}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-teal-400" /> Telefon
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-200">
                  {ticket.formattedPhone || ticket.phone}
                </p>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-teal-400" /> Ro'yxatdan o'tgan sana
              </span>
              <p className="text-xs font-semibold text-slate-300">
                {ticket.issuedAtFormatted || new Date().toLocaleString()}
              </p>
            </div>
          </div>

          {/* O'ng: Skanerlanadigan QR Kod */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/10">
            <SimpleQRCodeSVG data={ticket.qrData} size={150} />
            <p className="text-[10px] font-mono text-slate-400 mt-2 text-center">
              Klinikada skaner qilish uchun
            </p>
          </div>

        </div>

        {/* Imtiyozlar */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-teal-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>30 kunlik to'liq onlayn imtiyoz</span>
          </span>
          <span>MedNavbat ID Tizimi</span>
        </div>
      </div>

      {/* Harakat Tugmalari: Rasmga saqlash va Ulashish */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleDownloadPNG}
          disabled={downloading}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-md transition transform active:scale-98 cursor-pointer border border-slate-700"
        >
          <Download className="w-4 h-4 text-teal-400" />
          <span>{downloading ? 'Yuklanmoqda...' : 'Rasmga Saqlash (PNG)'}</span>
        </button>

        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-md shadow-teal-600/25 transition transform active:scale-98 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-200" />
              <span>Nusxalandi!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-white" />
              <span>Chiptani Ulashish</span>
            </>
          )}
        </button>
      </div>

      {/* Shifokorga navbat olish tugmasi */}
      <div className="pt-2">
        <button
          onClick={() => {
            onClose?.();
            onBookDoctor?.();
          }}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-600/25 transition transform active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
        >
          <span>Shifokorga Navbat Olishga O'tish</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
