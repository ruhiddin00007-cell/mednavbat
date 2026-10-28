import { useState, useCallback } from 'react';
import { 
  UZBEKISTAN_REGIONS, 
  COUNTRIES, 
  DEFAULT_COUNTRY, 
  DEFAULT_REGION,
  findNearestUzbekistanRegion,
  matchRegionByName,
  matchCountryByCodeOrName
} from '../data/locationData';
import { getRegionsByCountry, getRegionById, ALL_REGIONS } from '../data/regionsData';

const STORAGE_KEYS = {
  COUNTRY: 'mednavbat_user_country',
  REGION: 'mednavbat_user_region',
  ONBOARDED: 'mednavbat_location_onboarded',
  PROMPTED: 'mednavbat_location_prompted'
};

export const useUserLocation = () => {
  // Check HTTPS requirement
  const isHttps = typeof window !== 'undefined' && 
    (window.location.protocol === 'https:' || 
     window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');

  // Selected Country state
  const [selectedCountry, setSelectedCountry] = useState(() => {
    try {
      const savedCode = localStorage.getItem(STORAGE_KEYS.COUNTRY);
      if (savedCode) {
        return matchCountryByCodeOrName(savedCode);
      }
    } catch {
      // Ignored
    }
    return DEFAULT_COUNTRY;
  });

  // Selected Region state (null means 'Barcha hududlar' / All Regions)
  const [selectedRegion, setSelectedRegion] = useState(() => {
    try {
      const savedRegionId = localStorage.getItem(STORAGE_KEYS.REGION);
      if (savedRegionId === 'all') return null;
      if (savedRegionId) {
        const found = getRegionById(savedRegionId) || UZBEKISTAN_REGIONS.find(r => r.id === savedRegionId);
        if (found) return found;
      }
    } catch {
      // Ignored
    }
    return DEFAULT_REGION;
  });

  // Detection loading state
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectSource, setDetectSource] = useState(null); // 'gps' | 'ip' | 'manual'
  const [detectionError, setDetectionError] = useState(null);

  // Modal display states
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(() => {
    try {
      const hasOnboarded = localStorage.getItem(STORAGE_KEYS.ONBOARDED);
      return hasOnboarded !== 'true';
    } catch {
      return false;
    }
  });

  // Save changes to localStorage
  const persistLocation = useCallback((country, region) => {
    try {
      if (country) {
        localStorage.setItem(STORAGE_KEYS.COUNTRY, country.code || country.iso2);
      }
      if (region) {
        localStorage.setItem(STORAGE_KEYS.REGION, region.id);
      } else {
        localStorage.setItem(STORAGE_KEYS.REGION, 'all');
      }
      localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
      localStorage.setItem(STORAGE_KEYS.PROMPTED, 'true');
    } catch {
      // LocalStorage write error handling
    }
  }, []);

  // Set Manual Country
  const selectCountry = useCallback((country) => {
    setSelectedCountry(country);
    const countryRegions = getRegionsByCountry(country.code || country.iso2);
    // Agar davlatning viloyatlari bo'lsa, birinchisini yoki barchasini tanlash
    const initialRegion = countryRegions.length > 0 ? countryRegions[0] : null;
    setSelectedRegion(initialRegion);
    persistLocation(country, initialRegion);
    setDetectSource('manual');
    setDetectionError(null);
  }, [persistLocation]);

  // Set Manual Region
  const selectRegion = useCallback((region) => {
    if (region && region.countryId) {
      const parentCountry = matchCountryByCodeOrName(region.countryId);
      setSelectedCountry(parentCountry);
      setSelectedRegion(region);
      persistLocation(parentCountry, region);
    } else {
      setSelectedRegion(region);
      persistLocation(selectedCountry, region);
    }
    setDetectSource('manual');
    setDetectionError(null);
    setIsLocationModalOpen(false);
    setIsOnboarding(false);
  }, [selectedCountry, persistLocation]);

  // View All Regions in Uzbekistan
  const clearRegionFilter = useCallback(() => {
    setSelectedRegion(null);
    try {
      localStorage.setItem(STORAGE_KEYS.REGION, 'all');
    } catch {
      // Ignored
    }
  }, []);

  // IP-based Geolocation Fallback
  const detectViaIp = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      let data = null;
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        if (res.ok) {
          data = await res.json();
        }
      } catch {
        // Fallback to secondary free IP service
        try {
          const res2 = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
          if (res2.ok) {
            const raw2 = await res2.json();
            data = {
              country_code: raw2.countryCode,
              country_name: raw2.countryName,
              region: raw2.regionName,
              city: raw2.cityName,
              latitude: raw2.latitude,
              longitude: raw2.longitude
            };
          }
        } catch {
          // Secondary failed
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (data && data.country_code) {
        const country = matchCountryByCodeOrName(data.country_code);
        setSelectedCountry(country);

        if (country.code === 'UZ') {
          let matchedReg = null;
          if (data.region || data.city) {
            matchedReg = matchRegionByName(`${data.region || ''} ${data.city || ''}`);
          }
          if (!matchedReg && data.latitude && data.longitude) {
            const nearest = findNearestUzbekistanRegion(data.latitude, data.longitude);
            matchedReg = nearest.region;
          }
          const finalReg = matchedReg || DEFAULT_REGION;
          setSelectedRegion(finalReg);
          persistLocation(country, finalReg);
        } else {
          setSelectedRegion(null);
          persistLocation(country, null);
        }

        setDetectSource('ip');
        setDetectionError(null);
        return true;
      }
    } catch {
      // IP detection failed
    }
    return false;
  }, [persistLocation]);

  // Automatic Location Detection (Browser Geolocation + Reverse Geocoding + IP Fallback)
  const detectLocation = useCallback(async () => {
    setIsDetecting(true);
    setDetectionError(null);

    // Step 1: Check Browser Geolocation API
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 300000
          });
        });

        const { latitude, longitude } = position.coords;

        // Try reverse geocoding via BigDataCloud client API (free, fast, CORS-friendly)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=uz`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const countryCode = geoData.countryCode || 'UZ';
            const country = matchCountryByCodeOrName(countryCode);
            setSelectedCountry(country);

            if (country.code === 'UZ') {
              const subDiv = `${geoData.principalSubdivision || ''} ${geoData.city || ''} ${geoData.locality || ''}`;
              let matchedReg = matchRegionByName(subDiv);
              if (!matchedReg) {
                const nearest = findNearestUzbekistanRegion(latitude, longitude);
                matchedReg = nearest.region;
              }
              setSelectedRegion(matchedReg);
              persistLocation(country, matchedReg);
            } else {
              setSelectedRegion(null);
              persistLocation(country, null);
            }

            setDetectSource('gps');
            setIsLocationModalOpen(false);
            setIsOnboarding(false);
            setIsDetecting(false);
            return;
          }
        } catch {
          // Reverse geocoding fetch failed, fallback to coordinate calculation
        }

        // If coordinates match Uzbekistan territory (lat: 36.5-46.0, lon: 55.0-74.5)
        if (latitude >= 36.5 && latitude <= 46.0 && longitude >= 55.0 && longitude <= 74.5) {
          const nearest = findNearestUzbekistanRegion(latitude, longitude);
          const uz = COUNTRIES[0];
          setSelectedCountry(uz);
          setSelectedRegion(nearest.region);
          persistLocation(uz, nearest.region);
          setDetectSource('gps');
          setIsLocationModalOpen(false);
          setIsOnboarding(false);
          setIsDetecting(false);
          return;
        }
      } catch {
        // Geolocation denied or unavailable
      }
    }

    // Step 2: Fallback to IP Geolocation
    const ipSuccess = await detectViaIp();
    if (ipSuccess) {
      setIsLocationModalOpen(false);
      setIsOnboarding(false);
      setIsDetecting(false);
      return;
    }

    // Step 3: Both failed -> Show helpful message and guide user to manual selection
    setDetectionError(
      "Joylashuvingizni avtomatik aniqlab bo'lmadi. Iltimos, quyidagi ro'yxatdan o'zingizga qulay hududni tanlang."
    );
    setIsDetecting(false);
  }, [detectViaIp, persistLocation]);

  // Open and Close helper modals
  const openLocationModal = useCallback(() => {
    setDetectionError(null);
    setIsLocationModalOpen(true);
  }, []);

  const closeLocationModal = useCallback(() => {
    setIsLocationModalOpen(false);
    setIsOnboarding(false);
    try {
      localStorage.setItem(STORAGE_KEYS.PROMPTED, 'true');
    } catch {
      // Ignored
    }
  }, []);

  const dismissOnboarding = useCallback(() => {
    setIsOnboarding(false);
    setIsLocationModalOpen(false);
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
      localStorage.setItem(STORAGE_KEYS.PROMPTED, 'true');
    } catch {
      // Ignored
    }
  }, []);

  return {
    selectedCountry,
    selectedRegion,
    isDetecting,
    detectSource,
    detectionError,
    isLocationModalOpen,
    isOnboarding,
    isHttps,
    allRegions: UZBEKISTAN_REGIONS,
    allCountries: COUNTRIES,
    detectLocation,
    selectCountry,
    selectRegion,
    clearRegionFilter,
    openLocationModal,
    closeLocationModal,
    dismissOnboarding
  };
};
