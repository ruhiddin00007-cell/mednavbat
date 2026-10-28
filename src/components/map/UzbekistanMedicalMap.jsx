/**
 * MedNavbat — O'zbekiston Tibbiyot Xaritasi (Leaflet + OpenStreetMap)
 * ────────────────────────────────────────────────────────────────────
 * Qoidalar va xususiyatlar:
 *  1. Bepul Leaflet + OpenStreetMap (API kalitsiz ishlaydi).
 *  2. Sahifa ochilganda brauzerdan joylashuvga ruxsat so'raladi (navigator.geolocation).
 *  3. Ruxsat berilsa: xarita foydalanuvchining joyida ochiladi, "Siz shu yerdasiz"
 *     belgisi qo'yiladi va atrofdagi shifoxonalar masofasi (km) bo'yicha tartiblanadi.
 *  4. Ruxsat berilmasa: O'zbekiston markazida ochiladi va 14 ta hudud (viloyat)
 *     ro'yxatidan tanlash imkoni beriladi.
 *  5. Belgi bosilsa: nomi, manzili, telefoni va "Shifokorlarni ko'rish" tugmasi chiqadi.
 *  6. Maxfiylik: Foydalanuvchi koordinatalari bazaga saqlanmaydi (faqat joriy xotirada).
 *  7. Ilovada ham, mobil brauzerda ham to'liq moslashuvchan.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Building2,
  Phone,
  Stethoscope,
  ChevronRight,
  Compass,
  AlertCircle,
  CheckCircle2,
  Search,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  HOSPITALS_GEO,
  getHospitalsSortedByDistance,
  calculateDistanceKm,
} from '../../data/hospitalsWithCoordinates';
import { UZBEKISTAN_REGIONS } from '../../data/locationData';
import { ClinicLocationLink } from '../common/ClinicLocationLink';
import { openYandexMaps, getYandexMapsUrls, getYandexMapUrl } from '../../utils/yandexMaps';
import { getActivePrivateDoctorMapEntries } from '../../services/privacy/locationPrivacyService';

// O'zbekiston markazi (Toshkent / Markaziy koordinatalar)
const UZBEKISTAN_CENTER = [41.3111, 69.2797];
const DEFAULT_ZOOM = 11;

export const UzbekistanMedicalMap = ({ onSelectHospitalForDoctors }) => {
  const { 
    t, 
    language, 
    doctors = [], 
    appointments = [], 
    userProfile = null, 
    isAdminAuthenticated = false,
    setSelectedDoctor,
    setActiveModal
  } = useApp();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Foydalanuvchi joylashuvi (faqat xotirada, bazaga yozilmaydi)
  const [userLocation, setUserLocation] = useState(null);
  const [geoStatus, setGeoStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'loading'
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedPrivateDoctor, setSelectedPrivateDoctor] = useState(null);
  const [selectedRegionId, setSelectedRegionId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Filtr: 'all' | 'hospitals' | 'private_doctors'
  const [facilityTypeFilter, setFacilityTypeFilter] = useState('all');

  // 1. Xususiy shifokorlar (Maxfiylik va tasdiqlanish sanitizatsiyasi bilan)
  const privateDoctorEntries = useMemo(() => {
    const viewer = userProfile || (isAdminAuthenticated ? { role: 'admin', isAdmin: true } : null);
    const rawEntries = getActivePrivateDoctorMapEntries(doctors, viewer, appointments);
    
    return rawEntries.map(entry => {
      let distanceKm = null;
      if (userLocation && entry.lat != null && entry.lng != null) {
        distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, entry.lat, entry.lng);
      }
      return {
        ...entry,
        distanceKm
      };
    });
  }, [doctors, userProfile, isAdminAuthenticated, appointments, userLocation]);

  // Saralangan xususiy shifokorlar
  const sortedPrivateDoctors = useMemo(() => {
    let list = [...privateDoctorEntries];
    if (selectedRegionId !== 'all') {
      list = list.filter((d) => d.regionId === selectedRegionId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.doctorName?.toLowerCase().includes(q) ||
          d.specialtyName?.toLowerCase().includes(q) ||
          d.cabinetName?.toLowerCase().includes(q) ||
          d.address?.toLowerCase().includes(q) ||
          d.district?.toLowerCase().includes(q)
      );
    }
    // Masofa bo'yicha saralash
    if (userLocation) {
      list.sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }
    return list;
  }, [privateDoctorEntries, selectedRegionId, searchQuery, userLocation]);

  // 2. Shifoxonalar ro'yxati (masofa bo'yicha tartiblangan)
  const sortedHospitals = useMemo(() => {
    let list = getHospitalsSortedByDistance(userLocation?.lat, userLocation?.lng);
    if (selectedRegionId !== 'all') {
      list = list.filter((h) => h.regionId === selectedRegionId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.address.toLowerCase().includes(q) ||
          h.regionName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [userLocation, selectedRegionId, searchQuery]);

  // Birlashgan va filtrlangan ro'yxat (chap tomondagi kartalar uchun)
  const combinedEntries = useMemo(() => {
    let list = [];
    if (facilityTypeFilter === 'all' || facilityTypeFilter === 'hospitals') {
      list.push(...sortedHospitals.map(h => ({ ...h, entryType: 'hospital' })));
    }
    if (facilityTypeFilter === 'all' || facilityTypeFilter === 'private_doctors') {
      list.push(...sortedPrivateDoctors.map(d => ({ ...d, entryType: 'private_doctor' })));
    }

    // Agar foydalanuvchi joylashuvi aniqlangan bo'lsa, umumiy masofa bo'yicha saralash
    if (userLocation) {
      list.sort((a, b) => {
        const distA = a.distanceKm ?? 999999;
        const distB = b.distanceKm ?? 999999;
        return distA - distB;
      });
    }
    return list;
  }, [sortedHospitals, sortedPrivateDoctors, facilityTypeFilter, userLocation]);

  // 2. Joylashuvni so'rash (navigator.geolocation)
  const requestLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }

    setGeoStatus('loading');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setGeoStatus('granted');

        // Xaritani foydalanuvchi joyiga siljitish
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], 13, { duration: 1.5 });
          updateUserMarker(coords);
        }
      },
      (err) => {
        console.warn('Geolocation permission error or denied:', err.message);
        setGeoStatus('denied');
        // Ruxsat berilmasa O'zbekiston markazida ochiladi
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(UZBEKISTAN_CENTER, 6);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Foydalanuvchi markerini yangilash
  const updateUserMarker = (coords) => {
    if (!mapInstanceRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:rgba(13,148,136,0.25);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:18px;height:18px;border-radius:50%;background:#0d9488;border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.3);z-index:2;"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([coords.lat, coords.lng], { icon: userIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(
        `<div style="font-family:inherit;font-size:12px;font-weight:bold;color:#0d9488;text-align:center;padding:4px;">
           📍 Siz shu yerdasiz
         </div>`
      );

    userMarkerRef.current = marker;
  };

  // 3. Leaflet xaritasini initsializatsiya qilish
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Xarita mavjud bo'lsa qayta yaratmaslik
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: UZBEKISTAN_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: true,
      });

      // OpenStreetMap bepul qatlam
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Zoom tugmalari
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.featureGroup().addTo(map);

      // Sahifa ochilishi bilanoq joylashuvni so'rash
      requestLocation();
    }

    return () => {
      // Unmount tozalash
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 4. Shifoxona va Xususiy shifokor markerlarini yangilash
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    // A. Shifoxonalar (agar faqat xususiy shifokorlar filtrlanmagan bo'lsa)
    if (facilityTypeFilter === 'all' || facilityTypeFilter === 'hospitals') {
      sortedHospitals.forEach((hosp) => {
        const isSelected = selectedHospital?.id === hosp.id;

        const hospIcon = L.divIcon({
          className: 'custom-hosp-marker',
          html: `
            <div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;">
              <div style="
                width: ${isSelected ? '36px' : '28px'};
                height: ${isSelected ? '36px' : '28px'};
                background: ${isSelected ? '#0f766e' : '#0d9488'};
                border: 2px solid white;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(13,148,136,0.4);
                display:flex;
                align-items:center;
                justify-content:center;
                color:white;
                font-size:${isSelected ? '16px' : '13px'};
                transition: all 0.2s ease;
              ">
                🏥
              </div>
              ${
                hosp.distanceKm != null
                  ? `<div style="
                      position:absolute;
                      top:-16px;
                      background:#0f172a;
                      color:#5eead4;
                      font-size:9px;
                      font-weight:800;
                      padding:1px 5px;
                      border-radius:6px;
                      white-space:nowrap;
                      border:1px solid #1e293b;
                      box-shadow:0 2px 4px rgba(0,0,0,0.2);
                    ">${hosp.distanceKm} km</div>`
                  : ''
              }
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([hosp.lat, hosp.lng], { icon: hospIcon });

        // Popup
        const popupContent = document.createElement('div');
        popupContent.style.minWidth = '220px';
        const { webUrl: yandexUrl } = getYandexMapsUrls(hosp);
        popupContent.style.fontFamily = 'inherit';
        popupContent.innerHTML = `
          <div style="padding:4px 0;">
            <div style="font-size:10px;text-transform:uppercase;font-weight:800;color:#0d9488;margin-bottom:2px;">
              ${hosp.regionName}
            </div>
            <a href="${yandexUrl}" target="_blank" rel="noopener noreferrer" title="Yandex Xaritalarda ochish" style="display:block;font-size:13px;font-weight:800;color:#0f172a;line-height:1.2;margin-bottom:4px;text-decoration:none;cursor:pointer;">
              ${hosp.name} ↗
            </a>
            <a href="${yandexUrl}" target="_blank" rel="noopener noreferrer" title="Yandex Xaritalarda yo'l ko'rish" style="display:block;font-size:11px;color:#0d9488;margin-bottom:6px;text-decoration:underline;cursor:pointer;font-weight:600;">
              📍 ${hosp.address} (Yo'l ko'rsatish)
            </a>
            <div style="font-size:11px;color:#334155;margin-bottom:8px;font-weight:600;">
              📞 <a href="tel:${hosp.phone.replace(/\\s+/g, '')}" style="color:#0d9488;text-decoration:underline;">${hosp.phone}</a>
            </div>
            ${
              hosp.distanceKm != null
                ? `<div style="display:inline-block;background:#f0fdf4;color:#166534;font-size:10px;font-weight:800;padding:2px 8px;border-radius:12px;margin-bottom:8px;border:1px solid #bbf7d0;">
                     Sizdan masofa: ${hosp.distanceKm} km
                   </div>`
                : ''
            }
            <button id="btn-see-docs-${hosp.id}" style="
              width:100%;
              min-height:44px;
              padding:8px 12px;
              background:#0d9488;
              color:white;
              font-size:11px;
              font-weight:800;
              border-radius:8px;
              border:none;
              cursor:pointer;
              display:flex;
              align-items:center;
              justify-content:center;
              gap:4px;
            ">
              👨‍⚕️ Shifokorlarni ko'rish
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('popupopen', () => {
          setSelectedHospital(hosp);
          setSelectedPrivateDoctor(null);
          const btn = document.getElementById(`btn-see-docs-${hosp.id}`);
          if (btn) {
            btn.onclick = () => {
              handleViewDoctors(hosp);
            };
          }
        });

        marker.on('click', () => {
          setSelectedHospital(hosp);
          setSelectedPrivateDoctor(null);
        });

        markersGroupRef.current.addLayer(marker);
      });
    }

    // B. Xususiy Shifokorlar (Binafsha rangli belgilar, agar faqat shifoxonalar filtrlanmagan bo'lsa)
    if (facilityTypeFilter === 'all' || facilityTypeFilter === 'private_doctors') {
      sortedPrivateDoctors.forEach((privDoc) => {
        const isSelected = selectedPrivateDoctor?.id === privDoc.id;

        // Agar manzil maxfiy bo'lsa, xaritada taxminiy ~400 metrli xavfsiz doira chizamiz
        if (privDoc.isLocationMasked) {
          const approxCircle = L.circle([privDoc.lat, privDoc.lng], {
            radius: privDoc.approxRadiusMeters || 400,
            color: '#9333ea',
            fillColor: '#c084fc',
            fillOpacity: 0.22,
            weight: 1.5,
            dashArray: '5, 5'
          });
          markersGroupRef.current.addLayer(approxCircle);
        }

        const privIcon = L.divIcon({
          className: 'custom-private-doctor-marker',
          html: `
            <div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;">
              <div style="
                width: ${isSelected ? '36px' : '28px'};
                height: ${isSelected ? '36px' : '28px'};
                background: ${isSelected ? '#6b21a8' : '#9333ea'};
                border: 2px solid white;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(147,51,234,0.45);
                display:flex;
                align-items:center;
                justify-content:center;
                color:white;
                font-size:${isSelected ? '16px' : '13px'};
                transition: all 0.2s ease;
              ">
                🩺
              </div>
              ${
                privDoc.distanceKm != null
                  ? `<div style="
                      position:absolute;
                      top:-16px;
                      background:#2e1065;
                      color:#e9d5ff;
                      font-size:9px;
                      font-weight:800;
                      padding:1px 5px;
                      border-radius:6px;
                      white-space:nowrap;
                      border:1px solid #581c87;
                      box-shadow:0 2px 4px rgba(0,0,0,0.25);
                    ">${privDoc.distanceKm} km</div>`
                  : ''
              }
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([privDoc.lat, privDoc.lng], { icon: privIcon });

        // Xususiy shifokor popupi
        const popupContent = document.createElement('div');
        popupContent.style.minWidth = '240px';
        popupContent.style.fontFamily = 'inherit';

        const yandexDirectionsUrl = getYandexMapUrl({
          name: privDoc.cabinetName || privDoc.doctorName,
          address: privDoc.address,
          lat: privDoc.lat,
          lng: privDoc.lng
        });

        const cleanPhone = (privDoc.phone || '').replace(/\s+/g, '');

        popupContent.innerHTML = `
          <div style="padding:4px 0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;margin-bottom:4px;">
              <span style="font-size:9px;text-transform:uppercase;font-weight:900;color:#9333ea;background:#f3e8ff;padding:2px 6px;border-radius:6px;border:1px solid #e9d5ff;">
                ✨ Xususiy shifokor
              </span>
              <span style="font-size:10px;font-weight:800;color:#6b21a8;">
                ★ ${privDoc.rating || '5.0'}
              </span>
            </div>

            <div style="font-size:14px;font-weight:900;color:#0f172a;line-height:1.2;margin-bottom:2px;">
              ${privDoc.doctorName}
            </div>

            <div style="font-size:11px;font-weight:700;color:#7c3aed;margin-bottom:4px;">
              ${privDoc.specialtyName || ''}
            </div>

            ${
              privDoc.cabinetName
                ? `<div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:4px;">
                    🏢 ${privDoc.cabinetName}
                   </div>`
                : ''
            }

            <div style="font-size:11px;color:#334155;margin-bottom:6px;line-height:1.3;padding:4px 6px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
              ${
                privDoc.isLocationMasked
                  ? `<div style="color:#6b21a8;font-weight:700;">🔒 ${privDoc.address}</div>
                     <div style="font-size:10px;color:#71717a;margin-top:2px;">(Aniq manzil navbatingiz tasdiqlangach ko'rinadi)</div>`
                  : `<div style="color:#0f172a;font-weight:600;">📍 ${privDoc.address}</div>`
              }
            </div>

            ${
              privDoc.distanceKm != null
                ? `<div style="display:inline-block;background:#f5f3ff;color:#6b21a8;font-size:10px;font-weight:800;padding:2px 8px;border-radius:12px;margin-bottom:6px;border:1px solid #ddd6fe;">
                     Sizdan masofa: ${privDoc.distanceKm} km
                   </div>`
                : ''
            }

            <div style="font-size:11px;color:#334155;margin-bottom:8px;font-weight:600;">
              ⏰ Qabul kunlari: <strong>${(privDoc.workScheduleDays || []).slice(0, 3).join(', ')}</strong>
            </div>

            <div style="display:flex;flex-direction:column;gap:5px;">
              ${
                privDoc.canViewExactLocation
                  ? `<a href="${yandexDirectionsUrl}" target="_blank" rel="noopener noreferrer" style="
                      width:100%;
                      min-height:36px;
                      padding:6px 10px;
                      background:#f3e8ff;
                      color:#6b21a8;
                      font-size:11px;
                      font-weight:800;
                      border-radius:8px;
                      border:1px solid #d8b4fe;
                      text-decoration:none;
                      display:flex;
                      align-items:center;
                      justify-content:center;
                      gap:4px;
                      box-sizing:border-box;
                    ">
                      📍 Yo'l ko'rsatish (Yandex Xaritalar)
                    </a>`
                  : ''
              }

              <div style="display:grid;grid-template-columns:${cleanPhone ? '1fr 1fr' : '1fr'};gap:4px;">
                ${
                  cleanPhone
                    ? `<a href="tel:${cleanPhone}" style="
                        min-height:44px;
                        padding:7px 8px;
                        background:#f1f5f9;
                        color:#0f172a;
                        font-size:11px;
                        font-weight:800;
                        border-radius:8px;
                        border:1px solid #cbd5e1;
                        text-decoration:none;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        gap:3px;
                        box-sizing:border-box;
                      ">
                        📞 Qo'ng'iroq
                      </a>`
                    : ''
                }

                <button id="btn-book-priv-${privDoc.id}" style="
                  min-height:44px;
                  padding:7px 10px;
                  background:#9333ea;
                  color:white;
                  font-size:11px;
                  font-weight:800;
                  border-radius:8px;
                  border:none;
                  cursor:pointer;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  gap:3px;
                  box-sizing:border-box;
                ">
                  📅 Navbat olish
                </button>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('popupopen', () => {
          setSelectedPrivateDoctor(privDoc);
          setSelectedHospital(null);
          const btn = document.getElementById(`btn-book-priv-${privDoc.id}`);
          if (btn) {
            btn.onclick = () => {
              handleBookPrivateDoctor(privDoc);
            };
          }
        });

        marker.on('click', () => {
          setSelectedPrivateDoctor(privDoc);
          setSelectedHospital(null);
        });

        markersGroupRef.current.addLayer(marker);
      });
    }
  }, [sortedHospitals, sortedPrivateDoctors, facilityTypeFilter, selectedHospital, selectedPrivateDoctor]);

  // Shifoxonani xaritada ko'rsatish
  const handleSelectHospitalFromList = (hosp) => {
    setSelectedHospital(hosp);
    setSelectedPrivateDoctor(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hosp.lat, hosp.lng], 14, { duration: 1.2 });
    }
  };

  // Xususiy shifokorni xaritada ko'rsatish
  const handleSelectPrivateDoctorFromList = (docEntry) => {
    setSelectedPrivateDoctor(docEntry);
    setSelectedHospital(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([docEntry.lat, docEntry.lng], 14, { duration: 1.2 });
    }
  };

  // Navbat olish
  const handleBookPrivateDoctor = (docEntry) => {
    if (docEntry.doctor) {
      if (typeof setSelectedDoctor === 'function') {
        setSelectedDoctor(docEntry.doctor);
      }
      if (typeof setActiveModal === 'function') {
        setActiveModal('booking');
      }
    }
  };

  // Viloyat tanlanganda xaritani o'sha viloyatga yo'naltirish
  const handleRegionChange = (regId) => {
    setSelectedRegionId(regId);
    setSelectedHospital(null);
    setSelectedPrivateDoctor(null);

    if (!mapInstanceRef.current) return;

    if (regId === 'all') {
      mapInstanceRef.current.flyTo(UZBEKISTAN_CENTER, 6, { duration: 1.2 });
    } else {
      const regionData = UZBEKISTAN_REGIONS.find((r) => r.id === regId);
      if (regionData && regionData.lat && regionData.lon) {
        mapInstanceRef.current.flyTo([regionData.lat, regionData.lon], 12, { duration: 1.2 });
      }
    }
  };

  const handleViewDoctors = (hosp) => {
    if (onSelectHospitalForDoctors) {
      onSelectHospitalForDoctors(hosp);
    } else {
      // Standart harakat: Shifokorlar bo'limiga siljish
      const doctorsSection = document.getElementById('doctors-section');
      if (doctorsSection) {
        doctorsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section id="hospitals-map-section" className="py-12 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-xs font-black uppercase tracking-wider mb-2 border border-teal-200 dark:border-teal-800">
              <Compass className="w-3.5 h-3.5" />
              <span>O'zbekiston Interaktiv Xaritasi (Leaflet)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Shifoxonalar va Xususiy Shifokorlar Xaritasi
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              OpenStreetMap xaritasi orqali eng yaqin shifoxonalar va xususiy shifokorlar qabulini masofa (km) bo'yicha ko'ring va navbat oling.
            </p>
          </div>

          {/* Geolocation Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={requestLocation}
              disabled={geoStatus === 'loading'}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-extrabold shadow-md shadow-teal-600/20 transition flex items-center gap-2"
            >
              <Navigation className={`w-3.5 h-3.5 ${geoStatus === 'loading' ? 'animate-spin' : ''}`} />
              <span>
                {geoStatus === 'loading'
                  ? 'Aniqlanmoqda...'
                  : geoStatus === 'granted'
                  ? 'Joylashuvni yangilash'
                  : 'Mening joylashuvimni aniqlash'}
              </span>
            </button>
          </div>
        </div>

        {/* Status Alert if Geolocation is Denied or Waiting */}
        {geoStatus === 'denied' && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-300">
              <strong>Joylashuv ruxsati berilmadi yoki aniqlanmadi.</strong> Xarita O'zbekiston bo'ylab ochildi. Pastdagi ro'yxatdan o'zingizga qulay hududni (viloyatni) tanlashingiz mumkin.
            </div>
          </div>
        )}

        {geoStatus === 'granted' && userLocation && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Sizning joylashuvingiz aniqlandi:</strong> Tibbiyot muassasalari va xususiy shifokorlar sizga yaqinlik bo'yicha saralandi.
              </span>
            </div>
            <span className="text-[11px] font-bold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700">
              📍 Koordinatalar faqat shu oynada ishlatiladi
            </span>
          </div>
        )}

        {/* 1. Turi bo'yicha Filtr (Barchasi / Shifoxonalar / Xususiy shifokorlar) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFacilityTypeFilter('all')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              facilityTypeFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-teal-600 shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>Barchasi</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 dark:bg-black/20">
              {combinedEntries.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFacilityTypeFilter('hospitals')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              facilityTypeFilter === 'hospitals'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>🏥 Shifoxonalar</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 dark:bg-black/20">
              {sortedHospitals.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFacilityTypeFilter('private_doctors')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              facilityTypeFilter === 'private_doctors'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40'
            }`}
          >
            <span>✨ Xususiy shifokorlar</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200">
              {sortedPrivateDoctors.length}
            </span>
          </button>
        </div>

        {/* 2. Region Filter Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => handleRegionChange('all')}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
              selectedRegionId === 'all'
                ? 'bg-slate-800 text-white dark:bg-teal-700 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            Barcha Hududlar (14 ta)
          </button>
          {UZBEKISTAN_REGIONS.map((reg) => (
            <button
              key={reg.id}
              type="button"
              onClick={() => handleRegionChange(reg.id)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedRegionId === reg.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {reg.shortName || reg.name}
            </button>
          ))}
        </div>

        {/* Main Grid: Left Side Cards List + Right Side Interactive Leaflet Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT: Cards List */}
          <div className="lg:col-span-5 space-y-3 order-2 lg:order-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Shifoxona, xususiy shifokor yoki manzil bo'yicha izlash..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
              <span>Topildi: {combinedEntries.length} ta natija</span>
              {userLocation && <span className="text-teal-600 dark:text-teal-400">Eng yaqinlari yuqorida</span>}
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {combinedEntries.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  Qidiruv bo'yicha muassasa yoki shifokor topilmadi
                </div>
              ) : (
                combinedEntries.map((item) => {
                  // A. Shifoxona kartasi
                  if (item.entryType === 'hospital') {
                    const isSelected = selectedHospital?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectHospitalFromList(item)}
                        className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                                {item.regionName}
                              </span>
                              <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                🏥 Shifoxona
                              </span>
                              {item.distanceKm != null && (
                                <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                                  📍 {item.distanceKm} km masofa
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              <ClinicLocationLink
                                hospital={item}
                                name={item.name}
                                showPin={false}
                                linkClassName="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 hover:text-teal-600"
                              />
                              <a
                                href={getYandexMapUrl(item)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Yandex Xaritalarda yo'l ko'rish"
                                className="min-h-[44px] inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline select-none active:scale-95 active:opacity-80 cursor-pointer bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 transition-all"
                              >
                                <Navigation className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                                <span>Yo'l ko'rsatish</span>
                              </a>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              <ClinicLocationLink
                                hospital={item}
                                name={item.address}
                                iconClassName="w-3 h-3 text-rose-500 mr-1 flex-shrink-0"
                                linkClassName="hover:underline"
                              />
                            </div>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 pt-0.5">
                              <Phone className="w-3 h-3 text-teal-500" />
                              <a
                                href={`tel:${item.phone.replace(/\s+/g, '')}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline"
                              >
                                {item.phone}
                              </a>
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDoctors(item);
                            }}
                            className="min-h-[44px] flex-shrink-0 p-2 sm:px-3 sm:py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-extrabold transition active:scale-95 shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Shifokorlar</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // B. Xususiy Shifokor kartasi (Binafsha rangli premium stil)
                  const isSelected = selectedPrivateDoctor?.id === item.id;
                  const yandexDirectionsUrl = getYandexMapUrl({
                    name: item.cabinetName || item.doctorName,
                    address: item.address,
                    lat: item.lat,
                    lng: item.lng
                  });

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectPrivateDoctorFromList(item)}
                      className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20 shadow-md'
                          : 'bg-white dark:bg-slate-900 border-purple-100 dark:border-purple-900/40 hover:border-purple-400 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                              ✨ Xususiy shifokor
                            </span>
                            {item.regionName && (
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                {item.regionName}
                              </span>
                            )}
                            {item.distanceKm != null && (
                              <span className="text-[10px] font-extrabold text-purple-800 dark:text-purple-200 bg-purple-100 dark:bg-purple-950/90 px-2 py-0.5 rounded-full">
                                📍 {item.distanceKm} km masofa
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                              {item.doctorName}
                            </h4>
                            <span className="text-[11px] font-extrabold text-purple-700 dark:text-purple-400">
                              • {item.specialtyName}
                            </span>
                          </div>

                          {item.cabinetName && (
                            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 line-clamp-1">
                              🏢 {item.cabinetName}
                            </p>
                          )}

                          <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                            {item.isLocationMasked ? (
                              <span className="text-purple-700 dark:text-purple-300 font-bold">
                                🔒 {item.address}
                              </span>
                            ) : (
                              <span>📍 {item.address}</span>
                            )}

                            {item.canViewExactLocation && (
                              <a
                                href={yandexDirectionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Yandex Xaritalarda yo'l ko'rish"
                                className="min-h-[44px] inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline select-none active:scale-95 active:opacity-80 cursor-pointer bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800"
                              >
                                <Navigation className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                <span>Yo'l ko'rsatish</span>
                              </a>
                            )}
                          </div>

                          {item.phone && (
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 pt-0.5">
                              <Phone className="w-3 h-3 text-purple-500" />
                              <a
                                href={`tel:${item.phone.replace(/\s+/g, '')}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline text-purple-700 dark:text-purple-300"
                              >
                                {item.phone}
                              </a>
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookPrivateDoctor(item);
                            }}
                            className="min-h-[44px] p-2 sm:px-3 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-extrabold transition active:scale-95 shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <span>Navbat olish</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Leaflet Interactive Map */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900">
              <div
                ref={mapContainerRef}
                className="w-full h-[400px] sm:h-[520px] z-10"
                style={{ background: '#f8fafc' }}
              />

              {/* Map Floating Legend (Talab: "legend ga Xususiy shifokor qo'shilsin") */}
              <div className="absolute top-3 right-3 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-bold shadow-md flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse"></span>
                  <span>Siz</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-600"></span>
                  <span>Shifoxona</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-purple-600"></span>
                  <span>Xususiy shifokor</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default UzbekistanMedicalMap;
