import React, { useState, useEffect, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/patient/HeroBanner';
import { SpecialtiesSection } from './components/patient/SpecialtiesSection';
import { SpecialtyDoctorsView } from './components/patient/SpecialtyDoctorsView';
import { DoctorList } from './components/patient/DoctorList';
import { DoctorDetailModal } from './components/patient/DoctorDetailModal';
import { BookingModal } from './components/patient/BookingModal';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { PatientPortalView } from './components/patient/PatientPortalView';
import { VideoCallModal } from './components/patient/VideoCallModal';
import { AddDoctorModal } from './components/admin/AddDoctorModal';
import { AdminAuthGateModal } from './components/admin/AdminAuthGateModal';
import { AdminCardModal } from './components/admin/AdminCardModal';
import { AdminWithdrawModal } from './components/admin/AdminWithdrawModal';
import { AuthModal } from './components/auth/AuthModal';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import { MobileSimulatorFrame } from './components/MobileSimulatorFrame';
import { LocationSelector } from './components/LocationSelector';
import { AIChatWidget } from './components/ai/AIChatWidget';
import { RegistrationModal } from './components/registration/RegistrationModal';
import { ReviewModal } from './components/patient/ReviewModal';
import { UzbekistanMedicalFinder } from './components/patient/UzbekistanMedicalFinder';
import { UzbekistanMedicalMap } from './components/map/UzbekistanMedicalMap';
import { PatientProfileOnboarding } from './components/patient/PatientProfileOnboarding';
import { DoctorOnboardingPage } from './components/doctor/DoctorOnboardingPage';
import { DoctorAuthModal } from './components/doctor/DoctorAuthModal';
import { AdminLoginView } from './components/admin/AdminLoginView';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginView } from './components/auth/LoginView';

import { ShieldAlert, RefreshCw } from 'lucide-react';

// ── KOD AJRATISH (LAZY LOADING) ──
// Shifokor va Admin panellari kodi bemor brauzeriga dastlab yuklanmaydi. DevTools orqali ham topilmaydi.
const DoctorDashboard = React.lazy(() =>
  import('./components/doctor/DoctorDashboard').then(m => ({ default: m.DoctorDashboard }))
);
const AdminDashboard = React.lazy(() =>
  import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
);

const MainContent = () => {
  const { 
    t,
    currentRole, 
    setCurrentRole,
    specialtyView, 
    setSpecialtyView, 
    openSpecialtyView, 
    isAdminAuthenticated, 
    isAuthenticated,
    userProfile,
    isProfileComplete,
    setActiveModal,
    isFastRegistrationOpen,
    closeFastRegistration,
    selectedCountry,
    selectedRegion,
    isLocationModalOpen,
    isOnboardingLocation,
    isDetectingLocation,
    locationDetectionError,
    isHttps,
    closeLocationModal,
    selectCountry,
    selectRegion,
    clearRegionFilter,
    detectLocation,
    activeModal,
    reviewModalAppointment,
    closeReviewModal,
    showToast
  } = useApp();

  // URL Routing Holati (/login, /doctor, /admin, /admin-kirish, /)
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window === 'undefined') return '/';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase().replace('#', '');
    if (path.includes('login') || hash.includes('login')) return '/login';
    if (path.includes('admin') || hash.includes('admin')) return '/admin';
    if (path.includes('doctor') || hash.includes('doctor')) return '/doctor';
    if (path.includes('patient') || hash.includes('patient')) return '/patient';
    return '/';
  });

  const [isDoctorAuthModalOpen, setIsDoctorAuthModalOpen] = useState(false);
  const [doctorAuthInitialMode, setDoctorAuthInitialMode] = useState('login');

  // URL o'zgarishini kuzatish
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase().replace('#', '');
      let nextRoute = '/';
      if (path.includes('login') || hash.includes('login')) {
        nextRoute = '/login';
      } else if (path.includes('admin') || hash.includes('admin')) {
        nextRoute = '/admin';
      } else if (path.includes('doctor') || hash.includes('doctor')) {
        nextRoute = '/doctor';
      } else if (path.includes('patient') || hash.includes('patient')) {
        nextRoute = '/patient';
      }
      setCurrentRoute(nextRoute);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateTo = (route) => {
    if (route === '/') {
      window.history.pushState(null, '', window.location.pathname === '/' ? '/' : window.location.origin);
      window.location.hash = '';
    } else {
      window.location.hash = route.replace('/', '#');
    }
    setCurrentRoute(route);
  };

  // ── ROL BO'YICHA QAT'IY YO'NALTIRISH VA BLOKIROVKA ──
  useEffect(() => {
    // 1. Agar bemor tizimga kirgan bo'lsa va /doctor yoki /admin-kirish yoki /admin manzilini qo'lda ochsa:
    if (isAuthenticated && currentRole === 'patient') {
      if (currentRoute === '/doctor') {
        showToast(t('toastMessages.patientOnlyDoctorWarning'), 'warning', 4500);
        navigateTo('/patient');
      } else if (currentRoute === '/admin' || currentRoute === '/admin-kirish') {
        showToast(t('toastMessages.patientOnlyAdminWarning'), 'error', 4500);
        navigateTo('/patient');
      }
    }

    // 2. Agar shifokor /admin-kirish yoki /admin ni qo'lda ochsa:
    if (isAuthenticated && currentRole === 'doctor' && (currentRoute === '/admin' || currentRoute === '/admin-kirish')) {
      showToast(t('toastMessages.doctorOnlyAdminWarning'), 'error', 4500);
      navigateTo('/doctor');
    }
  }, [currentRoute, isAuthenticated, currentRole]);

  const handleSpecialtySelect = (specId) => {
    openSpecialtyView(specId);
  };

  const handleBackFromSpecialty = () => {
    setSpecialtyView(null);
    setTimeout(() => {
      const el = document.getElementById('specialties-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 1. TIZIMGA KIRISH MARSHRUTI: /login
  // ══════════════════════════════════════════════════════════════════════════
  if (currentRoute === '/login') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1">
          <LoginView onNavigate={navigateTo} />
        </main>
        <Toast />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. ADMIN MARSHRUTI: /admin & /admin-kirish
  // ══════════════════════════════════════════════════════════════════════════
  if (currentRoute === '/admin' || currentRoute === '/admin-kirish') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1">
          <ProtectedRoute allowedRoles={['admin']} targetRoute="/admin" onNavigate={navigateTo}>
            <Suspense fallback={
              <div className="min-h-[70vh] flex items-center justify-center text-teal-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
            }>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        </main>
        <Toast />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. SHIFOKOR MARSHRUTI: /doctor
  // ══════════════════════════════════════════════════════════════════════════
  if (currentRoute === '/doctor') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1">
          <ProtectedRoute allowedRoles={['doctor']} targetRoute="/doctor" onNavigate={navigateTo}>
            <Suspense fallback={
              <div className="min-h-[70vh] flex items-center justify-center text-teal-500">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
            }>
              <DoctorDashboard />
            </Suspense>
          </ProtectedRoute>
        </main>
        <DoctorAuthModal
          isOpen={isDoctorAuthModalOpen}
          initialMode={doctorAuthInitialMode}
          onClose={() => setIsDoctorAuthModalOpen(false)}
        />
        <Toast />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 4. BEMOR KABINETI: /patient
  // ══════════════════════════════════════════════════════════════════════════
  if (currentRoute === '/patient') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1">
          <ProtectedRoute allowedRoles={['patient']} targetRoute="/patient" onNavigate={navigateTo}>
            <PatientPortalView onNavigate={navigateTo} />
          </ProtectedRoute>
        </main>
        <AuthModal />
        <BookingModal />
        <VideoCallModal />
        {activeModal === 'review' && reviewModalAppointment && (
          <ReviewModal
            appointment={reviewModalAppointment}
            onClose={closeReviewModal}
          />
        )}
        <Toast />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. BOSH SAHIFA: Bemor Portali (/)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-teal-500 selection:text-white transition-colors duration-200">
      <Navbar />

      <main className="flex-1">
        {/* Agar bemor 1-marta kirgan bo'lsa va profili hali to'liq emas bo'lsa: Majburiy Onboarding */}
        {isAuthenticated && currentRole === 'patient' && !isProfileComplete ? (
          <PatientProfileOnboarding />
        ) : (
          /* Oddiy bemor sahifalari */
          <>
            {specialtyView ? (
              <SpecialtyDoctorsView
                specialtyId={specialtyView}
                onBack={handleBackFromSpecialty}
              />
            ) : (
              <>
                <HeroBanner />
                <UzbekistanMedicalFinder />
                <UzbekistanMedicalMap />
                <SpecialtiesSection onSpecialtySelect={handleSpecialtySelect} />
                <DoctorList />
                <PatientDashboard />
              </>
            )}
          </>
        )}
      </main>

      {/* Footer faqat bemor portalida ko'rsatiladi */}
      {!specialtyView && <Footer />}

      {/* Interaktiv Modallar */}
      <AuthModal />
      <DoctorDetailModal />
      <BookingModal />
      <VideoCallModal />

      {/* Admin modallari faqat admin tasdiqlanganda render qilinadi */}
      {isAdminAuthenticated && (
        <>
          <AddDoctorModal />
          <AdminAuthGateModal />
          <AdminCardModal />
          <AdminWithdrawModal />
        </>
      )}

      {/* Shifokorni baholash modali */}
      {activeModal === 'review' && reviewModalAppointment && (
        <ReviewModal
          appointment={reviewModalAppointment}
          onClose={closeReviewModal}
        />
      )}

      {/* Tezkor 1-Daqiqalik Registratsiya Modali */}
      <RegistrationModal
        isOpen={isFastRegistrationOpen}
        onClose={closeFastRegistration}
        onComplete={() => {}}
      />

      {/* Global Location & Onboarding Modal */}
      <LocationSelector
        isOpen={isLocationModalOpen || isOnboardingLocation}
        isOnboarding={isOnboardingLocation}
        onClose={closeLocationModal}
        selectedCountry={selectedCountry}
        selectedRegion={selectedRegion}
        onSelectCountry={selectCountry}
        onSelectRegion={selectRegion}
        onClearRegion={clearRegionFilter}
        onDetectLocation={detectLocation}
        isDetecting={isDetectingLocation}
        detectionError={locationDetectionError}
        isHttps={isHttps}
      />

      {/* AI Chat Widget */}
      <AIChatWidget />

      {/* Toast Alerts */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MobileSimulatorFrame>
        <MainContent />
      </MobileSimulatorFrame>
    </AppProvider>
  );
}
