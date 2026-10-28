/**
 * MedNavbat — Supabase Client Configuration & Doctor Auth Handlers
 * ─────────────────────────────────────────────────────────────────
 * DIQQAT VA XAVFSIZLIK:
 * 1. Faqat VITE_SUPABASE_URL va VITE_SUPABASE_ANON_KEY ishlatiladi.
 * 2. service_role kaliti HECH QACHON frontendga qo'yilmaydi!
 * 3. Parollar logga yozilmaydi va saqlanmaydi.
 */

import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

// Supabase to'g'ri sozlanganligini tekshirish
export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('your_supabase_url') && 
    !supabaseAnonKey.includes('your_supabase_anon_key')
  );
};

// Supabase mijozini yaratish (agar env bo'lmasa xavfsiz fallback bilan)
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    })
  : createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-anon-key',
      {
        auth: {
          persistSession: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined
        }
      }
    );

/**
 * 1. Shifokor Ro'yxatdan O'tishi (signUp)
 * Metadata: ism, telefon, mutaxassislik, litsenziya, shifoxona, role='doctor'
 */
export async function signUpDoctor({
  email,
  password,
  fullName,
  phone,
  specialtyId,
  specialtyName,
  licenseNo,
  hospitalName = '',
  experienceYears = 0,
  workDays = '',
  bio = '',
  avatar = ''
}) {
  if (!isSupabaseConfigured()) {
    console.warn('[SupabaseAuth] Supabase URL yoki Anon Key .env da topilmadi. Mock/Mahalliy rejimda ishlamoqda.');
    return {
      success: true,
      isMock: true,
      message: "Emailingizga tasdiqlash xati yuborildi (Demo rejim)",
      user: {
        email,
        user_metadata: { full_name: fullName, role: 'doctor' }
      }
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          role: 'doctor',
          full_name: fullName.trim(),
          phone: phone.trim(),
          specialty_id: specialtyId,
          specialty_name: specialtyName || specialtyId,
          license_no: licenseNo.trim(),
          hospital_name: hospitalName.trim(),
          experience_years: Number(experienceYears) || 0,
          work_days: workDays.trim(),
          bio: bio.trim(),
          avatar: avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80'
        },
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      console.error('[SupabaseAuth] signUp xatosi:', error.message);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data,
      user: data.user,
      session: data.session,
      message: "Emailingizga tasdiqlash xati yuborildi"
    };
  } catch (err) {
    console.error('[SupabaseAuth] Kutilmagan signUp xatosi:', err.message);
    return {
      success: false,
      error: "Ro'yxatdan o'tishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."
    };
  }
}

/**
 * 2. Shifokor Kirishi (signInWithPassword)
 * Umumiy xato: "Email yoki parol noto'g'ri yoki email tasdiqlanmagan"
 */
export async function signInDoctor({ email, password }) {
  if (!isSupabaseConfigured()) {
    console.warn('[SupabaseAuth] Supabase kalitlari yo\'q, mahalliy rejimda tekshiriladi.');
    return {
      success: false,
      isMock: true,
      error: "Email yoki parol noto'g'ri yoki email tasdiqlanmagan"
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) {
      // Xavfsizlik talabiga ko'ra: umumiy xabar qaytariladi
      console.warn('[SupabaseAuth] Kirish rad etildi (email/parol/tasdiq xatosi)');
      return {
        success: false,
        error: "Email yoki parol noto'g'ri yoki email tasdiqlanmagan"
      };
    }

    // Foydalanuvchi ma'lumotlarini olish
    const user = data.user;
    const metadata = user?.user_metadata || {};

    return {
      success: true,
      user,
      session: data.session,
      doctorProfile: {
        id: user.id,
        email: user.email,
        fullName: metadata.full_name || 'Dr. Shifokor',
        name: metadata.full_name || 'Dr. Shifokor',
        phone: metadata.phone || '',
        specialtyId: metadata.specialty_id || 'terapevt',
        specialtyName: metadata.specialty_name || 'Terapevt',
        licenseNo: metadata.license_no || '',
        hospitalName: metadata.hospital_name || '',
        experienceYears: metadata.experience_years || 0,
        avatar: metadata.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
        role: 'doctor',
        emailVerified: Boolean(user.email_confirmed_at)
      }
    };
  } catch (err) {
    console.error('[SupabaseAuth] Kutilmagan signIn xatosi:', err.message);
    return {
      success: false,
      error: "Email yoki parol noto'g'ri yoki email tasdiqlanmagan"
    };
  }
}

/**
 * 3. Tizimdan Chiqish (signOut)
 */
export async function signOutDoctor() {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[SupabaseAuth] Chiqishda xatolik:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('[SupabaseAuth] Kutilmagan signOut xatosi:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 4. Joriy Shifokor Sessiyasini Olish
 */
export async function getDoctorSession() {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session;
  } catch {
    return null;
  }
}
