import { supabase, isSupabaseConfigured } from '../config/supabaseClient.js';
import { notifyNewAppointment, notifyAppointmentCancelled } from './doctorNotificationService.js';

const LOCAL_STORAGE_KEY = 'mednavbat_appointments';

const memoryStorage = new Map();

const getStorageItem = (key) => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return memoryStorage.get(key) || null;
};

const setStorageItem = (key, val) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, val);
  } else {
    memoryStorage.set(key, String(val));
  }
};

/**
 * Mahalliy keshdagi navbatlarni olish
 */
export const getLocalAppointments = () => {
  try {
    const saved = getStorageItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Local appointments o\'qishda xatolik:', e);
    return [];
  }
};

/**
 * Mahalliy keshga saqlash
 */
export const saveLocalAppointments = (appointments) => {
  try {
    setStorageItem(LOCAL_STORAGE_KEY, JSON.stringify(appointments));
  } catch (e) {
    console.error('Local appointments saqlashda xatolik:', e);
  }
};

/**
 * Shifokor va sana bo'yicha band bo'lgan vaqt slotlarini olish
 */
export const fetchOccupiedSlots = async (doctorId, date) => {
  if (!doctorId || !date) return [];

  // 1. Agar Supabase sozlangan bo'lsa, haqiqiy bazadan o'qiymiz
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('time_slot')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', date)
        .neq('status', 'Bekor qilingan');

      if (!error && Array.isArray(data)) {
        return data.map(item => item.time_slot);
      }
      if (error) {
        console.warn('[Supabase Appointments] Slotlarni olishda xatolik:', error.message);
      }
    } catch (err) {
      console.warn('[Supabase Appointments] Ulanishda xatolik, mahalliy kesh ishlatiladi:', err);
    }
  }

  // 2. Mahalliy fallback
  const localList = getLocalAppointments();
  return localList
    .filter(a => a.doctorId === doctorId && a.date === date && a.status !== 'Bekor qilingan')
    .map(a => a.timeSlot);
};

/**
 * Yangi navbat yozish (Double Booking oldini oladi)
 */
export const bookNewAppointment = async (appointmentData) => {
  const {
    doctorId,
    doctorName,
    specialtyName,
    hospitalName,
    patientName,
    patientPhone,
    date,
    timeSlot,
    symptoms = ''
  } = appointmentData;

  const ticketCode = `MN-${Math.floor(1000 + Math.random() * 9000)}-${specialtyName ? specialtyName.substring(0, 3).toUpperCase() : 'MED'}`;
  const appointmentId = `NAV-${Date.now()}`;

  // 1. Agar Supabase sozlangan bo'lsa, bazaga yozamiz
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            ticket_code: ticketCode,
            doctor_id: doctorId,
            doctor_name: doctorName,
            specialty_name: specialtyName,
            hospital_name: hospitalName,
            patient_name: patientName,
            patient_phone: patientPhone,
            appointment_date: date,
            time_slot: timeSlot,
            status: 'Tasdiqlangan',
            symptoms: symptoms
          }
        ])
        .select()
        .single();

      if (error) {
        // Postgres 23505 = unique constraint violation (shifokor + sana + vaqt band)
        if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
          throw new Error('BAND_SLOT');
        }
        throw new Error(error.message);
      }

      const created = {
        id: data.id || appointmentId,
        ticketCode: data.ticket_code || ticketCode,
        doctorId,
        doctorName,
        specialtyName,
        hospitalName,
        patientName,
        patientPhone,
        date,
        timeSlot,
        status: 'Tasdiqlangan',
        symptoms,
        createdAt: data.created_at || new Date().toISOString()
      };

      // Mahalliy xotiraga ham qo'shib qo'yamiz (bemor o'z ro'yxatida ko'rishi uchun)
      const current = getLocalAppointments();
      saveLocalAppointments([created, ...current]);
      notifyNewAppointment(doctorId, created);

      return { success: true, appointment: created, source: 'supabase' };
    } catch (err) {
      if (err.message === 'BAND_SLOT') {
        return {
          success: false,
          isOccupied: true,
          error: "Ushbu vaqt boshqa bemor tomonidan band qilindi. Iltimos, boshqa vaqtni tanlang."
        };
      }
      console.warn('[Supabase] Navbat saqlashda xatolik:', err);
      // Agar bazada xatolik bo'lsa, pastdagi lokal tekshiruvga tushadi
    }
  }

  // 2. Mahalliy xotirada Double Booking tekshiruvi
  const current = getLocalAppointments();
  const isAlreadyBooked = current.some(
    a => a.doctorId === doctorId && a.date === date && a.timeSlot === timeSlot && a.status !== 'Bekor qilingan'
  );

  if (isAlreadyBooked) {
    return {
      success: false,
      isOccupied: true,
      error: "Ushbu vaqt boshqa bemor tomonidan band qilindi. Iltimos, boshqa vaqtni tanlang."
    };
  }

  const created = {
    id: appointmentId,
    ticketCode,
    doctorId,
    doctorName,
    specialtyName,
    hospitalName,
    patientName,
    patientPhone,
    date,
    timeSlot,
    status: 'Tasdiqlangan',
    symptoms,
    createdAt: new Date().toISOString()
  };

  saveLocalAppointments([created, ...current]);
  notifyNewAppointment(doctorId, created);
  return { success: true, appointment: created, source: 'local' };
};

/**
 * Navbatni bekor qilish (Vaqt qayta bo'sh bo'ladi)
 */
export const cancelExistingAppointment = async (appointmentId, ticketCode) => {
  // 1. Agar Supabase bo'lsa
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('appointments')
        .update({ status: 'Bekor qilingan' })
        .or(`id.eq.${appointmentId},ticket_code.eq.${ticketCode}`);
    } catch (err) {
      console.warn('[Supabase] Bekor qilishda xatolik:', err);
    }
  }

  // 2. Mahalliy keshni yangilash
  const current = getLocalAppointments();
  const targetApp = current.find(a => a.id === appointmentId || (ticketCode && a.ticketCode === ticketCode));

  const updated = current.map(a => {
    if (a.id === appointmentId || (ticketCode && a.ticketCode === ticketCode)) {
      return { ...a, status: 'Bekor qilingan' };
    }
    return a;
  });
  saveLocalAppointments(updated);

  if (targetApp && targetApp.doctorId) {
    notifyAppointmentCancelled(targetApp.doctorId, targetApp, 'bemor');
  }

  return { success: true };
};

/**
 * Realtime o'zgarishlarni kuzatish (boshqa odam band qilganda slot darhol yopiladi)
 */
export const subscribeToSlotChanges = (onUpdate) => {
  if (!isSupabaseConfigured()) return () => {};

  try {
    const channel = supabase
      .channel('realtime:appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          if (typeof onUpdate === 'function') {
            onUpdate(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime ulanish xatosi:', err);
    return () => {};
  }
};
