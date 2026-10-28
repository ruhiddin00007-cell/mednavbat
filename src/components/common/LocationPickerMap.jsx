import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Navigation, 
  Search, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Check, 
  Loader2,
  HelpCircle,
  Building
} from 'lucide-react';
import { getDistrictsByRegion, getRegionCenterCoords } from '../../data/uzbekistanDistricts';

export const LocationPickerMap = ({
  initialCoords = null, // { lat, lng }
  regionId = 'tashkent_city',
  district = '',
  address = '',
  privacyType = 'after_confirmed', // 'public' | 'after_confirmed'
  onCoordsChange,
  onPrivacyChange,
  readOnly = false,
  showPrivacySelector = true
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const [coords, setCoords] = useState(() => {
    if (initialCoords?.lat && initialCoords?.lng) {
      return { lat: Number(initialCoords.lat), lng: Number(initialCoords.lng) };
    }
    const defaultCenter = getRegionCenterCoords(regionId);
    return { lat: defaultCenter[0], lng: defaultCenter[1] };
  });

  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingMsg, setGeocodingMsg] = useState('');
  const [currentPrivacy, setCurrentPrivacy] = useState(privacyType);

  // Markerni yaratish / yangilash
  const updateMarkerAndCircle = useCallback((newLat, newLng, privacy) => {
    if (!mapInstanceRef.current) return;

    // 1. Markerni yangilash
    if (markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
    } else {
      const pinIcon = L.divIcon({
        className: 'custom-picker-pin',
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:grab;">
            <div style="
              width:34px;
              height:34px;
              border-radius:12px;
              background:#9333ea;
              border:2px solid white;
              box-shadow:0 6px 16px rgba(147,51,234,0.45);
              display:flex;
              align-items:center;
              justify-content:center;
              color:white;
              font-size:16px;
            ">
              🏢
            </div>
            <div style="
              position:absolute;
              bottom:-8px;
              width:0;
              height:0;
              border-left:6px solid transparent;
              border-right:6px solid transparent;
              border-top:8px solid #9333ea;
            "></div>
          </div>
        `,
        iconSize: [34, 42],
        iconAnchor: [17, 42]
      });

      const m = L.marker([newLat, newLng], {
        icon: pinIcon,
        draggable: !readOnly
      }).addTo(mapInstanceRef.current);

      if (!readOnly) {
        m.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          const updated = { lat: Number(pos.lat.toFixed(5)), lng: Number(pos.lng.toFixed(5)) };
          setCoords(updated);
          if (onCoordsChange) onCoordsChange(updated);
        });
      }

      markerRef.current = m;
    }

    // 2. Maxfiylik doirasini ko'rsatish (agar 'after_confirmed' bo'lsa)
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    if (privacy === 'after_confirmed') {
      const circle = L.circle([newLat, newLng], {
        color: '#9333ea',
        fillColor: '#c084fc',
        fillOpacity: 0.22,
        radius: 400, // 400 metr taxminiy radius
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(mapInstanceRef.current);

      circleRef.current = circle;
    }
  }, [readOnly, onCoordsChange]);

  // Leaflet xaritasini initsializatsiya qilish
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false // Sahifa skrollini ushlab qolmasligi uchun
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Xaritaga bosilganda markerni o'sha joyga ko'chirish
      if (!readOnly) {
        map.on('click', (e) => {
          const newPos = {
            lat: Number(e.latlng.lat.toFixed(5)),
            lng: Number(e.latlng.lng.toFixed(5))
          };
          setCoords(newPos);
          if (onCoordsChange) onCoordsChange(newPos);
          updateMarkerAndCircle(newPos.lat, newPos.lng, currentPrivacy);
        });
      }

      mapInstanceRef.current = map;
      updateMarkerAndCircle(coords.lat, coords.lng, currentPrivacy);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, []);

  // Koordinatalar yoki maxfiylik o'zgarganda markerni yangilash
  useEffect(() => {
    updateMarkerAndCircle(coords.lat, coords.lng, currentPrivacy);
  }, [coords.lat, coords.lng, currentPrivacy, updateMarkerAndCircle]);

  // Hudud o'zgarganda xaritani o'sha hududga siljitish
  useEffect(() => {
    if (!initialCoords?.lat && regionId && mapInstanceRef.current) {
      const center = getRegionCenterCoords(regionId);
      mapInstanceRef.current.setView(center, 12);
      const newPos = { lat: center[0], lng: center[1] };
      setCoords(newPos);
      if (onCoordsChange) onCoordsChange(newPos);
    }
  }, [regionId]);

  // "Hozirgi joyimni aniqlash" (navigator.geolocation)
  const handleDetectCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeocodingMsg("Qurilmangizda geolokatsiya qo'llab-quvvatlanmaydi.");
      return;
    }

    setIsLocating(true);
    setGeocodingMsg('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const newCoords = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5))
        };
        setCoords(newCoords);
        if (onCoordsChange) onCoordsChange(newCoords);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([newCoords.lat, newCoords.lng], 16, { duration: 1.2 });
        }
        updateMarkerAndCircle(newCoords.lat, newCoords.lng, currentPrivacy);
        setGeocodingMsg("Hozirgi joylashuvingiz muvaffaqiyatli aniqlandi! ✅");
      },
      (err) => {
        setIsLocating(false);
        setGeocodingMsg("Joylashuvni aniqlab bo'lmadi. Belgini xaritada qo'lda belgilang.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Manzil bo'yicha OpenStreetMap Nominatim xizmatidan geokodlash
  const handleGeocodeAddress = async () => {
    const queryParts = [address, district, 'O‘zbekiston'].filter(Boolean).join(', ');
    if (!queryParts.trim()) {
      setGeocodingMsg("Avval manzil yoki tumanni kiriting.");
      return;
    }

    setIsGeocoding(true);
    setGeocodingMsg("Xaritadan manzil qidirilmoqda...");

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryParts)}&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'uz,ru,en' } });
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const newLat = Number(parseFloat(item.lat).toFixed(5));
        const newLng = Number(parseFloat(item.lon).toFixed(5));
        const newCoords = { lat: newLat, lng: newLng };

        setCoords(newCoords);
        if (onCoordsChange) onCoordsChange(newCoords);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([newLat, newLng], 15, { duration: 1.2 });
        }
        updateMarkerAndCircle(newLat, newLng, currentPrivacy);
        setGeocodingMsg("Manzil topildi! Agar aniq bo'lmasa, belgini sudrab to'g'rilang. ✅");
      } else {
        setGeocodingMsg("Aniq joy topilmadi. Belgini xaritadan o'zingiz tanlang.");
      }
    } catch (_err) {
      setGeocodingMsg("Geokodlash xizmatiga ulanib bo'lmadi. Belgini qo'lda to'g'rilang.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handlePrivacyChange = (type) => {
    setCurrentPrivacy(type);
    if (onPrivacyChange) onPrivacyChange(type);
    updateMarkerAndCircle(coords.lat, coords.lng, type);
  };

  return (
    <div className="space-y-4">
      {/* Map Header Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDetectCurrentLocation}
              disabled={isLocating}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
            >
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <Navigation className="w-4 h-4 text-purple-600" />}
              <span>Hozirgi joyimni aniqlash</span>
            </button>

            {address && (
              <button
                type="button"
                onClick={handleGeocodeAddress}
                disabled={isGeocoding}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin text-teal-600" /> : <Search className="w-4 h-4 text-teal-600" />}
                <span>Manzildan topish</span>
              </button>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </div>
        </div>
      )}

      {/* Geocoding Notification */}
      {geocodingMsg && (
        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2 animate-in fade-in">
          <span>{geocodingMsg}</span>
        </div>
      )}

      {/* Interactive Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-900">
        <div
          ref={mapContainerRef}
          className="w-full h-[280px] sm:h-[340px] z-10"
        />

        {/* Overlay Helper Badge */}
        {!readOnly && (
          <div className="absolute top-2.5 left-2.5 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 shadow-sm flex items-center gap-1.5 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
            <span>Belgini kerakli joyga qo'ying yoki sudrab to'g'rilang</span>
          </div>
        )}

        {/* Legend for radius */}
        {currentPrivacy === 'after_confirmed' && (
          <div className="absolute bottom-2.5 left-2.5 z-[400] bg-purple-950/90 text-purple-200 backdrop-blur-md px-3 py-1.5 rounded-xl border border-purple-800 text-[10px] font-bold shadow-sm flex items-center gap-1.5 pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full border border-purple-400 bg-purple-400/30"></span>
            <span>Doira: Bemorlarga ko'rinadigan taxminiy hudud (400 m)</span>
          </div>
        )}
      </div>

      {/* ── 3. MAXFIYLIK SOZLAMASI (PRIVACY SETTINGS) ── */}
      {showPrivacySelector && !readOnly && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Kabinet Manzili Maxfiyligi (Muhim)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1-variant: Hammaga ko'rinsin */}
            <label
              onClick={() => handlePrivacyChange('public')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                currentPrivacy === 'public'
                  ? 'bg-purple-50/80 dark:bg-purple-950/60 border-purple-600 ring-2 ring-purple-600/20 shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="privacyOption"
                checked={currentPrivacy === 'public'}
                onChange={() => handlePrivacyChange('public')}
                className="mt-1 text-purple-600 focus:ring-purple-500"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Eye className="w-3.5 h-3.5 text-teal-600" />
                  <span>Aniq manzilim hammaga ko'rinsin</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Barcha bemorlar va sayt mehmonlari xaritada aniq bino va "Yo'l ko'rsatish" tugmasini darhol ko'radi.
                </p>
              </div>
            </label>

            {/* 2-variant: Faqat tasdiqlangach ko'rinsin */}
            <label
              onClick={() => handlePrivacyChange('after_confirmed')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                currentPrivacy === 'after_confirmed'
                  ? 'bg-purple-50/80 dark:bg-purple-950/60 border-purple-600 ring-2 ring-purple-600/20 shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="privacyOption"
                checked={currentPrivacy === 'after_confirmed'}
                onChange={() => handlePrivacyChange('after_confirmed')}
                className="mt-1 text-purple-600 focus:ring-purple-500"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <EyeOff className="w-3.5 h-3.5 text-purple-600" />
                  <span>Faqat navbat tasdiqlangach ko'rinsin</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Xaritada faqat taxminiy hudud (400 m doira) ko'rinadi. Aniq manzil va yo'nalish bemor navbati tasdiqlangach ochiladi.
                </p>
              </div>
            </label>
          </div>

          {/* Shifokor uyi uchun ogohlantirish (Talab 3) */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <strong className="font-extrabold">Xavfsizlik ogohlantirishi:</strong>
              <p className="text-[11px]">
                Agar qabulingiz xususiy uyingizda bo'lsa yoki aniq manzilingiz hammaga ko'rinishini xohlamasangiz, albatta ikkinchi variantni (<strong>"Faqat navbat tasdiqlangach ko'rinsin"</strong>) tanlang.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
