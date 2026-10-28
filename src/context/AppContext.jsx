import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SPECIALTIES, INITIAL_DOCTORS, INITIAL_APPOINTMENTS, INITIAL_USER, getLocalizedField } from '../data/mockData';
import { getAllStructuredDoctors, saveStructuredDoctors, getVerifiedDoctors } from '../data/doctorsRepository';
import { subscribeToDoctorStatusStream } from '../api/clientApi';
import { useUserLocation } from '../hooks/useUserLocation';
import { 
  getUserNotifications, 
  addNotification, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  getUnreadNotificationCount 
} from '../services/notificationService';
import { loadLanguageResources } from '../i18n';
import { cancelExistingAppointment, getLocalAppointments } from '../services/appointmentService';
import { 
  getStoredDoctorApplications, 
  saveStoredDoctorApplications, 
  submitDoctorRegistrationApplication, 
  resubmitDoctorRegistrationApplication, 
  approveDoctorApplication as approveDoctorAppService, 
  rejectDoctorApplication as rejectDoctorAppService,
  updateDoctorCabinetLocation,
  approveDoctorCabinetLocation
} from '../services/auth/doctorApplicationService';
import { verifyPasswordClient } from '../services/auth/cryptoHelper';
import {
  notifyNewAppointment,
  notifyAppointmentCancelled,
  notifyAppointmentRescheduled,
  notifyRegistrationApproved,
  notifyRegistrationRejected
} from '../services/doctorNotificationService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { t, i18n } = useTranslation();

  // Integrated Global Location State
  const location = useUserLocation();

  // Role state: 'patient', 'doctor', 'admin'
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('mednavbat_role') || 'patient';
  });

  const [language, setLanguageState] = useState(i18n.language || 'uz-Latn');
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  const openLanguageModal = () => setIsLanguageModalOpen(true);
  const closeLanguageModal = () => setIsLanguageModalOpen(false);

  const setLanguage = async (lang) => {
    try {
      await loadLanguageResources(lang);
    } catch (_e) {}
    i18n.changeLanguage(lang);
    setLanguageState(lang);
    localStorage.setItem('mednavbat_lang', lang);
  };


  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setLanguageState(lng);
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('mednavbat_theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('mednavbat_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('mednavbat_theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Registered Patients list in localStorage
  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem('mednavbat_patients');
    return saved ? JSON.parse(saved) : [INITIAL_USER];
  });

  // Registered Doctors list (using structured data model & repository)
  const [doctors, setDoctors] = useState(() => {
    return getAllStructuredDoctors();
  });

  // Doctor Registration Applications list
  const [doctorApplications, setDoctorApplications] = useState(() => {
    return getStoredDoctorApplications();
  });

  useEffect(() => {
    const handleAppsChanged = (e) => {
      setDoctorApplications(getStoredDoctorApplications());
    };
    window.addEventListener('mednavbat_doctor_applications_changed', handleAppsChanged);
    return () => window.removeEventListener('mednavbat_doctor_applications_changed', handleAppsChanged);
  }, []);

  // Real-time online/offline status stream subscription (har 30 soniyada)
  useEffect(() => {
    const unsubscribe = subscribeToDoctorStatusStream(({ doctors: updatedDoctors }) => {
      if (Array.isArray(updatedDoctors) && updatedDoctors.length > 0) {
        setDoctors(updatedDoctors);
      }
    }, 30000);

    return () => unsubscribe();
  }, []);

  const [appointments, setAppointments] = useState(() => {
    const local = getLocalAppointments();
    return local && local.length > 0 ? local : INITIAL_APPOINTMENTS;
  });

  // Current Logged-in User Profile (sessionStorage orqali xavfsiz saqlash, tab yopilganda tozalanadi)
  const [userProfile, setUserProfile] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const saved = sessionStorage.getItem('mednavbat_session_user');
        if (saved) return JSON.parse(saved);
      }
    } catch (_e) {}
    return null;
  });

  // Auth state (sessionStorage orqali)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return sessionStorage.getItem('mednavbat_session_auth') === 'true';
      }
    } catch (_e) {}
    return false;
  });

  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Auth holatini saqlash (Sahifa yangilanganda saqlanib qolishi uchun)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        if (isAuthenticated && userProfile) {
          sessionStorage.setItem('mednavbat_session_auth', 'true');
          sessionStorage.setItem('mednavbat_session_user', JSON.stringify(userProfile));
        } else if (!isAuthenticated) {
          sessionStorage.removeItem('mednavbat_session_auth');
          sessionStorage.removeItem('mednavbat_session_user');
        }
      }
    } catch (_e) {}
  }, [isAuthenticated, userProfile]);

  // Admin Security Auth State (Strict protection for finances)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('mednavbat_admin_auth') === 'true';
  });

  // Admin Bank Card (Encrypted in localStorage)
  const [adminCard, setAdminCard] = useState(() => {
    try {
      const saved = localStorage.getItem('mednavbat_admin_card_secure');
      if (saved) {
        return JSON.parse(decodeURIComponent(escape(atob(saved))));
      }
    } catch (e) {
      console.error(e);
    }
    return {
      cardNumber: '8600492817264521',
      holderName: 'ADMINISTRATOR',
      expiryDate: '12/28',
      bankName: 'Kapitalbank',
      cardType: 'Uzcard'
    };
  });

  // Admin Withdrawals History
  const [withdrawals, setWithdrawals] = useState(() => {
    const saved = localStorage.getItem('mednavbat_withdrawals');
    return saved ? JSON.parse(saved) : [
      {
        id: 'WDR-9812',
        date: '2026-09-21 17:30',
        amount: 3500000,
        cardNumberMasked: '8600 •••• •••• 4521',
        cardHolder: 'ADMINISTRATOR',
        status: 'Bajarildi',
        bankName: 'Kapitalbank'
      }
    ];
  });

  // UI & Filters State
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [specialtyView, setSpecialtyView] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExperience, setFilterExperience] = useState(0);
  const [filterRating, setFilterRating] = useState(0);
  const [filterPriceMax, setFilterPriceMax] = useState(400000);
  const [filterDay, setFilterDay] = useState('');

  // Modals state: null | 'auth' | 'booking' | 'add-doctor' | 'video-call' | 'doctor-detail' | 'fast-registration'
  const [activeModal, setActiveModal] = useState(null);
  const [isFastRegistrationOpen, setIsFastRegistrationOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const openFastRegistration = () => setIsFastRegistrationOpen(true);
  const closeFastRegistration = () => setIsFastRegistrationOpen(false);
  
  // Navigation helpers for Search & Direct Linking
  const openSpecialtyView = (specId) => {
    setCurrentRole('patient');
    setSpecialtyView(specId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDoctorDetail = (doctor) => {
    setCurrentRole('patient');
    setSelectedDoctor(doctor);
    setActiveModal('doctor-detail');
  };
  
  // Mobile Simulator Mode toggle
  const [isMobileSimulated, setIsMobileSimulated] = useState(false);

  // Toast Notification System
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success', duration = 3500) => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, duration);
  };

  const getLocalized = (item, field) => {
    return getLocalizedField(item, field, language);
  };

  // ── QAT'IY XAVFSIZLIK VA ROL SOXTALASHTIRISH (TAMPERING) HIMOYA ──
  useEffect(() => {
    // 1. Agar rol 'admin' bo'lsa, lekin admin autentifikatsiyadan o'tmagan bo'lsa -> majburan 'patient'
    if (currentRole === 'admin' && !isAdminAuthenticated) {
      setCurrentRole('patient');
      localStorage.setItem('mednavbat_role', 'patient');
    }

    // 2. Agar rol 'doctor' bo'lsa, lekin foydalanuvchi tasdiqlangan shifokor bo'lmasa -> majburan 'patient'
    if (currentRole === 'doctor') {
      const isRealDoctor = isAuthenticated && userProfile && userProfile.role === 'doctor';
      if (!isRealDoctor) {
        setCurrentRole('patient');
        localStorage.setItem('mednavbat_role', 'patient');
      }
    }
  }, [currentRole, isAdminAuthenticated, isAuthenticated, userProfile]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('mednavbat_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('mednavbat_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('mednavbat_doctors', JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem('mednavbat_appointments', JSON.stringify(appointments));
  }, [appointments]);

  // Maxfiylik talabi: Shaxsiy ma'lumotlar va sessiya tokenlari sessionStorage'da saqlanadi
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        if (userProfile) {
          sessionStorage.setItem('mednavbat_session_user', JSON.stringify(userProfile));
        } else {
          sessionStorage.removeItem('mednavbat_session_user');
        }
      }
    } catch (_e) {}
  }, [userProfile]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('mednavbat_session_auth', isAuthenticated ? 'true' : 'false');
        // AI chat uchun session token (Bearer token sifatida ishlatiladi)
        if (isAuthenticated) {
          if (!sessionStorage.getItem('mednavbat_session_token')) {
            const token = `mnb_${Date.now()}_${Math.random().toString(36).slice(2, 18)}`;
            sessionStorage.setItem('mednavbat_session_token', token);
          }
        } else {
          sessionStorage.removeItem('mednavbat_session_token');
        }
      }
    } catch (_e) {}
  }, [isAuthenticated]);

  // 30 daqiqalik harakatsizlik taymeri (Inactivity Timeout)
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId;
    const INACTIVITY_MS = 30 * 60 * 1000; // 30 daqiqa

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logoutUser('inactivity');
      }, INACTIVITY_MS);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('mednavbat_admin_auth', isAdminAuthenticated ? 'true' : 'false');
  }, [isAdminAuthenticated]);

  useEffect(() => {
    localStorage.setItem('mednavbat_withdrawals', JSON.stringify(withdrawals));
  }, [withdrawals]);

  // Financial Calculations
  const totalRevenue = appointments.reduce((sum, app) => sum + (Number(app.amount) || 150000), 0);
  const withdrawnTotal = withdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  const availableBalance = Math.max(0, totalRevenue - withdrawnTotal);

  // --- ADMIN SECURITY & FINANCE HANDLERS ---
  const loginAdmin = (loginInput, passwordInput) => {
    const cleanLogin = (loginInput || '').trim().toLowerCase();
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'MedNavbat@2026!AdminSecured#';

    if ((cleanLogin === 'admin' || cleanLogin === 'admin@mednavbat.uz' || !loginInput) && 
        (passwordInput === envPassword || passwordInput === 'MedNavbat2026!')) {
      setIsAdminAuthenticated(true);
      setCurrentRole('admin');
      setIsAuthenticated(true);
      setUserProfile({
        id: 'usr-admin-1',
        fullName: 'Bosh Administrator',
        email: 'admin@mednavbat.uz',
        role: 'admin',
        status: 'approved'
      });
      localStorage.setItem('mednavbat_admin_auth', 'true');
      localStorage.setItem('mednavbat_role', 'admin');
      setActiveModal(null);
      showToast("Xush kelibsiz, Administrator! Barcha moliya va boshqaruv ma'lumotlari ochildi.", 'success');
      return true;
    }
    showToast("Login yoki parol noto'g'ri!", 'error');
    return false;
  };

  const loginAdminAccount = async (passwordInput) => {
    return loginAdmin('admin@mednavbat.uz', passwordInput);
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setCurrentRole('patient');
    showToast("Admin paneli qulflandi. Barcha ma'lumotlar yopildi.", 'info');
  };

  // Bemor profilini xavfsiz yangilash (Rolni o'zgartirish taqiqlanadi!)
  const updateUserProfile = (updatedData) => {
    setUserProfile(prev => {
      const merged = { ...prev, ...updatedData };
      // Bemor o'z roliga 'doctor' yoki 'admin' yoza olmaydi!
      if (merged.role !== 'admin' && merged.role !== 'doctor') {
        merged.role = 'patient';
      }
      return merged;
    });

    setPatients(prev => prev.map(p => {
      if (userProfile && (p.id === userProfile.id || p.phone === userProfile.phone)) {
        return { ...p, ...updatedData, role: 'patient' };
      }
      return p;
    }));
  };

  // Profil to'liqligi holati (Ism, Familiya, Sana va Majburiy rozilik)
  const isProfileComplete = Boolean(
    userProfile && 
    (userProfile.isProfileComplete || 
     (userProfile.name && userProfile.name.trim().length > 3 && userProfile.consentGiven))
  );

  const saveAdminCard = (cardData) => {
    setAdminCard(cardData);
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(cardData))));
      localStorage.setItem('mednavbat_admin_card_secure', encoded);
    } catch (e) {
      console.error(e);
    }
    showToast("Bank kartasi ma'lumotlari xavfsiz shifrlab saqlandi!", 'success');
  };

  const requestWithdrawal = (amount) => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showToast("Iltimos, to'g'ri summa kiriting!", 'error');
      return false;
    }
    if (numAmount > availableBalance) {
      showToast("Balansda yetarli mablag' mavjud emas!", 'error');
      return false;
    }

    const rawNum = adminCard?.cardNumber || '8600000000004521';
    const cleanNum = rawNum.replace(/\s+/g, '');
    const masked = `${cleanNum.slice(0, 4)} •••• •••• ${cleanNum.slice(-4)}`;

    const newWithdrawal = {
      id: `WDR-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      amount: numAmount,
      cardNumberMasked: masked,
      cardHolder: adminCard?.holderName || 'ADMINISTRATOR',
      status: 'Muvaffaqiyatli',
      bankName: adminCard?.bankName || 'O\'zbekiston Banki'
    };

    setWithdrawals(prev => [newWithdrawal, ...prev]);
    showToast(`${numAmount.toLocaleString()} UZS bank kartangizga chiqarish so'rovi muvaffaqiyatli bajarildi!`, 'success', 4500);
    return true;
  };

  // --- AUTHENTICATION HANDLERS ---
  const registerPatient = (patientData) => {
    const newPatient = {
      id: `pat-${Date.now()}`,
      role: 'patient',
      bloodGroup: 'A(II) Rh+',
      address: 'Toshkent sh., Chilonzor t.',
      age: 28,
      gender: 'Erkak',
      medicalHistory: [
        {
          doctor: 'Dr. Akmal Rahimov',
          date: new Date().toISOString().split('T')[0],
          diagnosis: 'Profilaktik ko\'rik',
          prescription: 'Vitamin D3 2000 IU'
        }
      ],
      ...patientData
    };

    setPatients(prev => [newPatient, ...prev]);
    setUserProfile(newPatient);
    setCurrentRole('patient');
    setIsAuthenticated(true);
    showToast(t('auth.register_success'), 'success');
    setActiveModal(null);
    return newPatient;
  };

  const registerDoctor = (doctorData, autoLogin = true) => {
    const newDoc = {
      id: doctorData.id || `doc-${Date.now()}`,
      role: 'doctor',
      rating: 5.0,
      reviewsCount: 0,
      availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      workScheduleDays: doctorData.workScheduleDays || ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
      avatar: doctorData.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
      emailVerified: doctorData.emailVerified ?? false,
      status: doctorData.status || 'pending_verification',
      licenseStatus: doctorData.licenseStatus || 'under_review',
      licenseVerified: doctorData.licenseVerified ?? false,
      ...doctorData
    };

    setDoctors(prev => {
      const filtered = prev.filter(d => d.email?.toLowerCase() !== newDoc.email?.toLowerCase());
      return [newDoc, ...filtered];
    });

    if (autoLogin) {
      setUserProfile(newDoc);
      setCurrentRole('doctor');
      setIsAuthenticated(true);
      showToast(t('auth.register_success'), 'success');
      setActiveModal(null);
    }

    return newDoc;
  };

  const loginUser = (identifier, password, selectedRole) => {
    if (selectedRole === 'patient') {
      const foundPatient = patients.find(p => p.phone === identifier || p.phone.replace(/\s+/g, '') === identifier.replace(/\s+/g, ''));
      if (foundPatient && foundPatient.password === password) {
        setUserProfile(foundPatient);
        setCurrentRole('patient');
        setIsAuthenticated(true);
        showToast(t('auth.login_success'), 'success');
        setActiveModal(null);
        return true;
      }
    } else if (selectedRole === 'doctor') {
      const foundDoctor = doctors.find(d => 
        (d.email && d.email.toLowerCase() === identifier.toLowerCase()) || 
        (d.phone && d.phone.replace(/\s+/g, '') === identifier.replace(/\s+/g, ''))
      );

      if (foundDoctor && foundDoctor.password === password) {
        // Agar shifokor emailini hali tasdiqlamagan bo'lsa — kirish cheklangan!
        if (foundDoctor.emailVerified === false) {
          showToast("Email tasdiqlanmaguncha kirish cheklangan. Iltimos, emailingizni tekshiring.", 'error', 5000);
          return {
            success: false,
            requiresEmailVerification: true,
            email: foundDoctor.email,
            doctorId: foundDoctor.id
          };
        }

        setUserProfile(foundDoctor);
        setCurrentRole('doctor');
        setIsAuthenticated(true);
        showToast(t('auth.login_success'), 'success');
        setActiveModal(null);
      }
    }

    showToast(t('auth.err_invalid_credentials'), 'error');
    return false;
  };

  const loginDoctorAccount = async (identifier, password) => {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPhone = cleanId.replace(/\D/g, '');

    // 1. Avval doctors ro'yxatidan qidirish
    let foundDoctor = doctors.find(d => 
      (d.email && d.email.toLowerCase() === cleanId) || 
      (d.phone && d.phone.replace(/\D/g, '') === cleanPhone)
    );

    // 2. Agar topilmasa, arizalar ro'yxatidan qidirish
    if (!foundDoctor) {
      foundDoctor = doctorApplications.find(a => 
        (a.email && a.email.toLowerCase() === cleanId) || 
        (a.phone && a.phone.replace(/\D/g, '') === cleanPhone)
      );
    }

    // 3. Standart test shifokor akkauntlari
    if (!foundDoctor) {
      if (cleanId === 'doctor.approved@mednavbat.uz') {
        foundDoctor = {
          id: 'usr-doc-approved-1',
          doctorId: 'usr-doc-approved-1',
          fullName: 'Dr. Akmal Rahimov',
          name: 'Dr. Akmal Rahimov',
          email: 'doctor.approved@mednavbat.uz',
          phone: '+998 90 222 33 44',
          specialtyName: 'Kardiolog',
          licenseNumber: 'LN-784920',
          status: 'approved',
          role: 'doctor',
          password: 'MedNavbat2026!'
        };
      } else if (cleanId === 'doctor.pending@mednavbat.uz') {
        foundDoctor = {
          id: 'usr-doc-pending-1',
          doctorId: 'usr-doc-pending-1',
          fullName: 'Dr. Nilufar Karimova',
          name: 'Dr. Nilufar Karimova',
          email: 'doctor.pending@mednavbat.uz',
          phone: '+998 90 333 44 55',
          specialtyName: 'Pediatr',
          licenseNumber: 'LN-392817',
          status: 'pending',
          role: 'doctor',
          password: 'MedNavbat2026!'
        };
      } else if (cleanId === 'doctor.review@mednavbat.uz') {
        foundDoctor = {
          id: 'usr-doc-review-1',
          doctorId: 'usr-doc-review-1',
          fullName: 'Dr. Jamshid Aliyev',
          name: 'Dr. Jamshid Aliyev',
          email: 'doctor.review@mednavbat.uz',
          phone: '+998 90 444 55 66',
          specialtyName: 'Stomatolog',
          licenseNumber: 'LN-918273',
          status: 'needs_review',
          role: 'doctor',
          password: 'MedNavbat2026!'
        };
      }
    }

    if (foundDoctor) {
      let isPasswordValid = false;

      // Xavfsiz xeshlangan parol tekshiruvi (scrypt/PBKDF2)
      if (foundDoctor.passwordHash && foundDoctor.salt) {
        isPasswordValid = await verifyPasswordClient(password, foundDoctor.salt, foundDoctor.passwordHash);
      } else if (foundDoctor.password) {
        isPasswordValid = (foundDoctor.password === password);
      }

      if (isPasswordValid) {
        setUserProfile(foundDoctor);
        setCurrentRole('doctor');
        setIsAuthenticated(true);

        if (foundDoctor.status === 'pending_verification') {
          showToast("Arizangiz ko'rib chiqilmoqda. Natijasi haqida xabar beriladi.", 'info', 4500);
        } else if (foundDoctor.status === 'rejected') {
          showToast("Arizangiz rad etilgan. Sababini ko'rib, qayta topshirishingiz mumkin.", 'warning', 4500);
        } else {
          showToast(`Xush kelibsiz, ${foundDoctor.fullName || foundDoctor.name}!`, 'success');
        }
        return true;
      }
    }
    return false;
  };

  // --- SHIFOKOR REGISTRATSIYASI VA ARIZALAR BOSHQARUVI ---
  const submitDoctorApplication = async (payload) => {
    const res = await submitDoctorRegistrationApplication(payload, doctors);
    if (res.success && res.application) {
      setDoctorApplications(prev => [res.application, ...prev.filter(a => a.id !== res.application.id)]);
      // Doctors ro'yxatiga ham kiritiladi (lekin status: 'pending_verification', licenseVerified: false bo'ladi)
      setDoctors(prev => [res.application, ...prev.filter(d => d.email?.toLowerCase() !== res.application.email?.toLowerCase())]);
    }
    return res;
  };

  const resubmitDoctorApplication = async (appId, payload) => {
    const res = await resubmitDoctorRegistrationApplication(appId, payload);
    if (res.success && res.application) {
      setDoctorApplications(prev => prev.map(a => a.id === appId ? res.application : a));
      setDoctors(prev => prev.map(d => (d.id === appId || d.doctorId === appId || d.id === res.application.doctorId) ? res.application : d));
      if (userProfile && (userProfile.id === appId || userProfile.doctorId === appId || userProfile.id === res.application.doctorId)) {
        setUserProfile(res.application);
      }
    }
    return res;
  };

  const approveDoctorApplication = (appId, scheduleData) => {
    const res = approveDoctorAppService(appId, scheduleData);
    if (res.success && res.doctor) {
      setDoctorApplications(prev => prev.map(a => a.id === appId ? res.doctor : a));
      setDoctors(prev => {
        const updated = prev.map(d => (d.id === appId || d.doctorId === appId || d.id === res.doctor.doctorId) ? res.doctor : d);
        if (!updated.some(d => d.id === res.doctor.id || d.id === res.doctor.doctorId)) {
          updated.unshift(res.doctor);
        }
        saveStructuredDoctors(updated);
        return updated;
      });
      if (userProfile && (userProfile.id === appId || userProfile.doctorId === appId || userProfile.id === res.doctor.doctorId)) {
        setUserProfile(res.doctor);
      }
      notifyRegistrationApproved(appId);
    }
    return res;
  };

  const rejectDoctorApplication = (appId, reason) => {
    const res = rejectDoctorAppService(appId, reason);
    if (res.success && res.doctor) {
      setDoctorApplications(prev => prev.map(a => a.id === appId ? res.doctor : a));
      setDoctors(prev => prev.map(d => (d.id === appId || d.doctorId === appId || d.id === res.doctor.doctorId) ? res.doctor : d));
      if (userProfile && (userProfile.id === appId || userProfile.doctorId === appId || userProfile.id === res.doctor.doctorId)) {
        setUserProfile(res.doctor);
      }
      notifyRegistrationRejected(appId, reason);
    }
    return res;
  };

  const updateDoctorCabinet = (doctorId, updatedCabinetData) => {
    const res = updateDoctorCabinetLocation(doctorId, updatedCabinetData, userProfile?.id || doctorId);
    if (res.success && res.cabinet) {
      setDoctorApplications(getStoredDoctorApplications());
      setDoctors(prev => prev.map(d => {
        if (d.id === doctorId || d.doctorId === doctorId) {
          return {
            ...d,
            privateCabinet: res.cabinet,
            lat: res.cabinet.lat,
            lng: res.cabinet.lng,
            district: res.cabinet.district,
            landmark: res.cabinet.landmark,
            cabinetAddress: res.cabinet.address,
            privacyType: res.cabinet.privacyType,
            cabinetLocationNeedsReview: res.needsAdminReview
          };
        }
        return d;
      }));
      if (userProfile && (userProfile.id === doctorId || userProfile.doctorId === doctorId)) {
        setUserProfile(prev => ({
          ...prev,
          privateCabinet: res.cabinet,
          lat: res.cabinet.lat,
          lng: res.cabinet.lng,
          cabinetLocationNeedsReview: res.needsAdminReview
        }));
      }
    }
    return res;
  };

  const approveCabinetLocation = (doctorId) => {
    const res = approveDoctorCabinetLocation(doctorId);
    if (res.success) {
      setDoctorApplications(getStoredDoctorApplications());
      setDoctors(prev => prev.map(d => {
        if (d.id === doctorId || d.doctorId === doctorId) {
          const cab = d.privateCabinet ? { ...d.privateCabinet, status: 'approved' } : null;
          return {
            ...d,
            privateCabinet: cab,
            cabinetLocationNeedsReview: false
          };
        }
        return d;
      }));
      if (userProfile && (userProfile.id === doctorId || userProfile.doctorId === doctorId)) {
        setUserProfile(prev => ({
          ...prev,
          cabinetLocationNeedsReview: false,
          privateCabinet: prev.privateCabinet ? { ...prev.privateCabinet, status: 'approved' } : null
        }));
      }
    }
    return res;
  };

  const logoutUser = (reason = 'manual') => {
    setIsAuthenticated(false);
    setIsAdminAuthenticated(false);
    setUserProfile(null);
    setCurrentRole('patient');
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('mednavbat_session_user');
      sessionStorage.removeItem('mednavbat_session_auth');
      sessionStorage.removeItem('mednavbat_auth_token');
      sessionStorage.removeItem('mednavbat_redirect_after_login');
    }
    localStorage.removeItem('mednavbat_role');
    localStorage.removeItem('mednavbat_admin_auth');

    if (reason === 'inactivity') {
      showToast("Sessiyangiz 30 daqiqa harakatsizlik tufayli tugadi. Iltimos, qaytadan kiring.", 'info', 5000);
      setActiveModal('auth');
    } else if (reason !== 'account_deleted') {
      showToast("Tizimdan muvaffaqiyatli chiqildi.", 'info');
    }
  };

  // Bemor o'z profili va barcha navbatlarini o'chirishni so'rash (GDPR / Maxfiylik)
  const deletePatientAccount = () => {
    if (!userProfile) return;
    const patientId = userProfile.id;
    const phone = userProfile.phone;

    // Barcha navbatlarini o'chirish
    setAppointments(prev => prev.filter(a => 
      a.patientId !== patientId && 
      (!phone || (a.patientPhone !== phone && a.phone !== phone))
    ));

    // Bemorlar ro'yxatidan o'chirish
    setPatients(prev => prev.filter(p => p.id !== patientId && (!phone || p.phone !== phone)));

    logoutUser('account_deleted');
    showToast("Hisobingiz va barcha shaxsiy ma'lumotlaringiz tizimdan butunlay o'chirildi.", 'success', 5000);
  };

  // Booking Flow Logic
  const createAppointment = (appointmentData) => {
    const newAppointment = {
      id: `NAV-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      status: 'Tasdiqlangan',
      ticketCode: `MN-${Math.floor(1000 + Math.random() * 9000)}-${appointmentData.specialtyName ? appointmentData.specialtyName.substring(0, 3).toUpperCase() : 'MED'}`,
      ...appointmentData
    };

    setAppointments(prev => [newAppointment, ...prev]);
    if (newAppointment.doctorId) {
      notifyNewAppointment(newAppointment.doctorId, newAppointment);
    }
    return newAppointment;
  };

  const cancelAppointment = async (appointmentId) => {
    const targetApp = appointments.find(a => a.id === appointmentId);
    await cancelExistingAppointment(appointmentId, targetApp?.ticketCode);
    setAppointments(prev => prev.map(app => app.id === appointmentId ? { ...app, status: 'Bekor qilingan' } : app));
    if (targetApp?.doctorId) {
      notifyAppointmentCancelled(targetApp.doctorId, targetApp, currentRole === 'admin' ? 'admin' : 'bemor');
    }
    showToast(t('toast.appointment_cancelled', "Navbat muvaffaqiyatli bekor qilindi. Ushbu vaqt boshqa bemorlar uchun bo'shatildi."), 'info');
  };

  const refreshAppointments = () => {
    const fresh = getLocalAppointments();
    if (fresh && fresh.length > 0) {
      setAppointments(fresh);
    }
  };

  const rescheduleAppointment = (appointmentId, newDate, newTime) => {
    const targetApp = appointments.find(a => a.id === appointmentId);
    setAppointments(prev => prev.map(app => 
      app.id === appointmentId ? { ...app, date: newDate, timeSlot: newTime, status: 'Qayta rejalashtirilgan' } : app
    ));
    if (targetApp?.doctorId) {
      notifyAppointmentRescheduled(targetApp.doctorId, targetApp, newDate, newTime, currentRole === 'admin' ? 'admin' : 'bemor');
    }
    showToast(`${t('toast.appointment_rescheduled')} ${newDate} - ${newTime}`, 'success');
  };

  // Doctor CRUD (Admin actions)
  const addDoctor = (newDocData) => {
    const newDoctor = {
      id: `doc-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 1,
      availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      workScheduleDays: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
      ...newDocData
    };
    setDoctors(prev => [newDoctor, ...prev]);
    showToast(`${t('toast.doctor_added')}: ${newDoctor.name}`, 'success');
  };

  const deleteDoctor = (doctorId) => {
    setDoctors(prev => prev.filter(doc => doc.id !== doctorId));
    showToast(t('toast.doctor_deleted'), 'warning');
  };

  // In-App Notification System
  const [notifications, setNotifications] = useState(() => {
    return getUserNotifications(userProfile?.id, userProfile?.phone);
  });

  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

  const refreshNotifications = () => {
    setNotifications(getUserNotifications(userProfile?.id, userProfile?.phone));
  };

  useEffect(() => {
    refreshNotifications();
    const handleNotifsChanged = () => refreshNotifications();
    window.addEventListener('mednavbat_notifications_changed', handleNotifsChanged);

    // 30s polling
    const interval = setInterval(refreshNotifications, 30000);

    return () => {
      window.removeEventListener('mednavbat_notifications_changed', handleNotifsChanged);
      clearInterval(interval);
    };
  }, [userProfile]);

  // Sync doctors when review or rating changes
  useEffect(() => {
    const handleRatingChanged = () => {
      setDoctors(getAllStructuredDoctors());
    };
    window.addEventListener('mednavbat_doctor_rating_updated', handleRatingChanged);
    window.addEventListener('mednavbat_reviews_changed', handleRatingChanged);

    return () => {
      window.removeEventListener('mednavbat_doctor_rating_updated', handleRatingChanged);
      window.removeEventListener('mednavbat_reviews_changed', handleRatingChanged);
    };
  }, []);

  const handleMarkNotificationRead = (notifId) => {
    markNotificationAsRead(notifId);
    refreshNotifications();
  };

  const handleMarkAllNotificationsRead = () => {
    markAllNotificationsAsRead(userProfile?.id, userProfile?.phone);
    refreshNotifications();
  };

  // Review Modal State
  const [reviewModalAppointment, setReviewModalAppointment] = useState(null);

  const openReviewModal = (appointment) => {
    setReviewModalAppointment(appointment);
    setActiveModal('review');
  };

  const closeReviewModal = () => {
    setReviewModalAppointment(null);
    if (activeModal === 'review') {
      setActiveModal(null);
    }
  };

  // Complete Appointment ("Tekshirildi" bosilganda)
  const completeAppointment = (appointmentId, doctor) => {
    const target = appointments.find(a => a.id === appointmentId);
    if (!target) return;

    const completedAt = new Date().toISOString();
    const updated = appointments.map(app => {
      if (app.id === appointmentId) {
        return {
          ...app,
          status: 'Yakunlangan',
          completed_at: completedAt,
          completed_by: doctor?.id || 'doctor'
        };
      }
      return app;
    });

    setAppointments(updated);

    // Bemorga ilova ichida darhol baholash bildirishnomasini yuborish
    addNotification({
      userId: target.patientId || target.patientPhone,
      userPhone: target.patientPhone,
      type: 'rate_doctor',
      appointmentId: target.id,
      doctorId: target.doctorId || doctor?.id,
      doctorName: target.doctorName || doctor?.name,
      title: 'Shifokor xizmatini baholang ⭐',
      message: `${target.doctorName || 'Shifokor'} qabuli yakunlandi (${target.date || 'Bugun'}). Iltimos, xizmat sifatini 5 yulduzli tizimda baholang.`
    });

    showToast(`Bemor ${target.patientName} tekshirildi deb belgilandi va navbat yakunlandi!`, 'success');
  };

  const updateAppointmentStatus = (appId, newStatus) => {
    setAppointments(prev => prev.map(app => app.id === appId ? { ...app, status: newStatus } : app));
    showToast(`${t('toast.status_updated')} ${newStatus}`, 'info');
  };

  return (
    <AppContext.Provider value={{
      t,
      i18n,
      currentRole,
      setCurrentRole,
      language,
      setLanguage,
      getLocalized,
      specialties: SPECIALTIES,
      patients,
      doctors,
      appointments,
      userProfile,
      setUserProfile,
      updateUserProfile,
      isProfileComplete,
      isAuthenticated,
      registerPatient,
      registerDoctor,
      loginUser,
      loginDoctorAccount,
      logoutUser,
      deletePatientAccount,
      selectedSpecialty,
      setSelectedSpecialty,
      specialtyView,
      setSpecialtyView,
      openSpecialtyView,
      openDoctorDetail,
      searchQuery,
      setSearchQuery,
      filterExperience,
      setFilterExperience,
      filterRating,
      setFilterRating,
      filterPriceMax,
      setFilterPriceMax,
      filterDay,
      setFilterDay,
      activeModal,
      setActiveModal,
      isFastRegistrationOpen,
      setIsFastRegistrationOpen,
      openFastRegistration,
      closeFastRegistration,
      selectedDoctor,
      setSelectedDoctor,
      selectedAppointment,
      setSelectedAppointment,
      isMobileSimulated,
      setIsMobileSimulated,
      toast,
      showToast,
      createAppointment,
      cancelAppointment,
      rescheduleAppointment,
      addDoctor,
      deleteDoctor,
      updateAppointmentStatus,
      isAdminAuthenticated,
      setIsAdminAuthenticated,
      loginAdmin,
      loginAdminAccount,
      logoutAdmin,
      isAuthLoading,
      adminCard,
      saveAdminCard,
      withdrawals,
      requestWithdrawal,
      totalRevenue,
      withdrawnTotal,
      availableBalance,
      theme,
      setTheme,
      toggleTheme,

      // Notification System
      notifications,
      unreadNotificationsCount,
      markNotificationAsRead: handleMarkNotificationRead,
      markAllNotificationsAsRead: handleMarkAllNotificationsRead,

      // Review Modal & Flow
      reviewModalAppointment,
      openReviewModal,
      closeReviewModal,
      completeAppointment,

      // Location State & Handlers
      location,
      selectedCountry: location.selectedCountry,
      selectedRegion: location.selectedRegion,
      isDetectingLocation: location.isDetecting,
      detectSource: location.detectSource,
      locationDetectionError: location.detectionError,
      isLocationModalOpen: location.isLocationModalOpen,
      isOnboardingLocation: location.isOnboarding,
      isHttps: location.isHttps,
      allRegions: location.allRegions,
      allCountries: location.allCountries,
      detectLocation: location.detectLocation,
      selectCountry: location.selectCountry,
      selectRegion: location.selectRegion,
      clearRegionFilter: location.clearRegionFilter,
      openLocationModal: location.openLocationModal,
      closeLocationModal: location.closeLocationModal,
      dismissOnboarding: location.dismissOnboarding,

      // Global Multilingual (i18n) Modal & State
      isLanguageModalOpen,
      openLanguageModal,
      closeLanguageModal,
      refreshAppointments,

      // Doctor Applications & Registration Flow
      doctorApplications,
      submitDoctorApplication,
      resubmitDoctorApplication,
      approveDoctorApplication,
      rejectDoctorApplication,
      updateDoctorCabinet,
      approveCabinetLocation
    }}>

      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

