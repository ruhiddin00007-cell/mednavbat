/**
 * usePWAInstall — PWA O'rnatish Hooki
 * ─────────────────────────────────────
 * - beforeinstallprompt hodisasini global va mahalliy ushlaydi (Android / Chrome)
 * - Qurilma turini aniqlaydi: Android, iOS, yoki Desktop
 * - Ilova allaqachon o'rnatilganligini tekshiradi (standalone rejim)
 */
import { useState, useEffect } from 'react';

// Global ushlagich: hodisa sahifa ochilishi bilanoq React mount bo'lishidan oldin chaqirilsa ham yo'qolmasligi uchun
let cachedDeferredPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    cachedDeferredPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
  });

  window.addEventListener('appinstalled', () => {
    cachedDeferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-app-installed'));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(cachedDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop'); // 'android' | 'ios' | 'desktop'
  const [isInstallable, setIsInstallable] = useState(Boolean(cachedDeferredPrompt));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Qurilma turini aniqlash
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isAndroid) {
      setDeviceType('android');
    } else if (isIOS) {
      setDeviceType('ios');
    } else {
      setDeviceType('desktop');
    }

    // 2. Standalone rejimda ishlayotganligini tekshirish (o'rnatilgan PWA)
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.navigator.standalone === true ||
        document.referrer.startsWith('android-app://');
      setIsInstalled(Boolean(isStandalone));
    };

    checkStandalone();

    // 3. Agar global keshda prompt bo'lsa
    if (cachedDeferredPrompt) {
      setDeferredPrompt(cachedDeferredPrompt);
      setIsInstallable(true);
    }

    // 4. Hodisalarni tinglash
    const handlePromptAvailable = () => {
      if (cachedDeferredPrompt) {
        setDeferredPrompt(cachedDeferredPrompt);
        setIsInstallable(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
      cachedDeferredPrompt = null;
    };

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      cachedDeferredPrompt = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-app-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-app-installed', handleAppInstalled);
    };
  }, []);

  /**
   * Android / Chrome uchun tizimning rasmiy o'rnatish dialogini chiqarish
   * @returns {Promise<boolean>} — qabul qilindi yoki yo'q
   */
  const triggerInstallPrompt = async () => {
    const promptEvent = deferredPrompt || cachedDeferredPrompt;
    if (!promptEvent) return false;

    try {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setIsInstallable(false);
        cachedDeferredPrompt = null;
        return true;
      }
      return false;
    } catch (err) {
      console.warn('PWA install prompt error:', err);
      return false;
    }
  };

  return {
    deferredPrompt,
    isInstalled,
    deviceType,
    isInstallable,
    triggerInstallPrompt,
  };
}

export default usePWAInstall;
