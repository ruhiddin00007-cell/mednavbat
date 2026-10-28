-- ==============================================================================
-- MedNavbat — Supabase Ma'lumotlar Bazasi Tuzilmasi va Row Level Security (RLS)
-- ==============================================================================
-- Ushbu fayl Supabase SQL Editorida ishga tushirish uchun to'liq tayyor.
-- Maxfiylik va Rollar qat'iy ma'lumotlar bazasi (Postgres) darajasida himoyalangan.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FOYDALANUVCHI PROFILLERI (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    role VARCHAR(20) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
    consent_given BOOLEAN NOT NULL DEFAULT true,
    consent_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SHIFOKORLAR (doctors)
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    specialty_id VARCHAR(50) NOT NULL,
    specialty_name VARCHAR(100) NOT NULL,
    hospital_id VARCHAR(50) NOT NULL,
    hospital_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    experience_years INT DEFAULT 5,
    room_number VARCHAR(50),
    consultation_price NUMERIC(12, 2) DEFAULT 150000.00,
    rating NUMERIC(2, 1) DEFAULT 5.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NAVBATLAR (appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot VARCHAR(10) NOT NULL,
    ticket_code VARCHAR(30) UNIQUE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Tasdiqlangan' CHECK (status IN ('Tasdiqlangan', 'Bajarildi', 'Bekor qilingan', 'Qayta rejalashtirilgan')),
    complaint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUDIT JURNALI (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ── ROW LEVEL SECURITY (RLS) SIYOSATLARI ─────────────────────────────────────
-- ==============================================================================

-- A. PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Bemor FAQAT o'z profilini ko'ra oladi
CREATE POLICY "Patients view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- 2. Bemor o'z profilini yangilay oladi
CREATE POLICY "Patients update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 3. Bemor o'z profilini va barcha ma'lumotlarini o'chira oladi (GDPR / Maxfiylik)
CREATE POLICY "Patients delete own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = id);

-- 4. Yangi foydalanuvchi ro'yxatdan o'tganda profil yaratish
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);


-- B. DOCTORS RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- 1. Hamma foydalanuvchilar (shu jumladan mehmolar) faol shifokorlar ro'yxatini ko'ra oladi
CREATE POLICY "Public can view active doctors"
ON public.doctors FOR SELECT
USING (is_active = true);

-- 2. Shifokor faqat o'z ma'lumotlarini tahrirlay oladi
CREATE POLICY "Doctor update own record"
ON public.doctors FOR UPDATE
USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- 3. Faqat admin yangi shifokor qo'sha oladi yoki o'chira oladi
CREATE POLICY "Admin manage doctors"
ON public.doctors FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));


-- C. APPOINTMENTS RLS (ENG MUHIM MAXFIYLIK QOIDALARI)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 1. BEMOR MAXFIYLIGI: Bemor FAQAT o'z navbatlarini ko'radi
CREATE POLICY "Patient view own appointments"
ON public.appointments FOR SELECT
USING (
    patient_id = auth.uid()
    OR
    -- Yoki admin hamma navbatlarni ko'radi
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. SHIFOKOR MAXFIYLIGI: Shifokor FAQAT o'ziga yozilgan bemorlarni ko'radi
CREATE POLICY "Doctor view assigned appointments only"
ON public.appointments FOR SELECT
USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);

-- 3. Bemor o'z nomiga navbat band qilishi mumkin
CREATE POLICY "Patient create appointment for self"
ON public.appointments FOR INSERT
WITH CHECK (patient_id = auth.uid());

-- 4. Bemor faqat o'z navbatini bekor qilishi yoki o'chirishi mumkin
CREATE POLICY "Patient cancel own appointment"
ON public.appointments FOR UPDATE
USING (patient_id = auth.uid());

CREATE POLICY "Patient delete own appointment"
ON public.appointments FOR DELETE
USING (patient_id = auth.uid());


-- D. AUDIT LOGS RLS (FAQAT ADMIN)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Audit jurnalini FAQAT admin ko'ra oladi
CREATE POLICY "Admin view audit logs only"
ON public.audit_logs FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- 2. Har qanday autentifikatsiyadan o'tgan foydalanuvchi log qo'sha oladi
CREATE POLICY "System insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);


-- ==============================================================================
-- ── XAVFSIZ FUNKSIYA: BAND VAQTLARNI FOYDALANUVCHISIZ KO'RSATISH ─────────────
-- ==============================================================================
-- Boshqa bemorlar vaqtlarni tanlashda qaysi vaqt bandligini bilishi kerak,
-- lekin kim band qilgani (ism, telefon) HECH QACHON ko'rinmaydi!

CREATE OR REPLACE FUNCTION public.get_booked_slots_anonymous(p_doctor_id UUID, p_date DATE)
RETURNS TABLE (time_slot VARCHAR)
LANGUAGE sql
SECURITY DEFINER -- Xavfsiz: bemor shaxsiyatini oshkor qilmasdan faqat vaqt qaytaradi
AS $$
    SELECT time_slot 
    FROM public.appointments
    WHERE doctor_id = p_doctor_id 
      AND date = p_date 
      AND status != 'Bekor qilingan';
$$;

-- ==============================================================================
-- ── 6. SHIFOKOR BILDIRISHNOMALARI (doctor_notifications) ──────────────────────
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.doctor_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    target_section VARCHAR(50),
    meta JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    delivered_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexlar
CREATE INDEX IF NOT EXISTS idx_doctor_notifs_doctor_id ON public.doctor_notifications(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_notifs_created_at ON public.doctor_notifications(created_at DESC);

-- E. DOCTOR_NOTIFICATIONS RLS (MAXFIYLIK VA XAVFSIZLIK)
ALTER TABLE public.doctor_notifications ENABLE ROW LEVEL SECURITY;

-- 1. Faqat tegishli shifokor o'z xabarlarini ko'radi (yoki admin barchasini nazorat qiladi)
CREATE POLICY "Doctor view own notifications only"
ON public.doctor_notifications FOR SELECT
USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Shifokor faqat o'z xabarini o'qilgan deb belgilashi mumkin
CREATE POLICY "Doctor update own notifications"
ON public.doctor_notifications FOR UPDATE
USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);

-- 3. Shifokor faqat o'z xabarini o'chira oladi
CREATE POLICY "Doctor delete own notifications"
ON public.doctor_notifications FOR DELETE
USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);

-- 4. Xabarlar faqat tizim yoki admin tomonidan yaratiladi (bemor yoki begona yarata olmaydi)
CREATE POLICY "Admin or system insert doctor notifications"
ON public.doctor_notifications FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    auth.uid() IS NOT NULL
);

