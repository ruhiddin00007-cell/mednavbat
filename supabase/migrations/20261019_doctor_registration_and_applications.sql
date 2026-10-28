-- ==============================================================================
-- MedNavbat — Shifokor Ro'yxatdan O'tishi va Arizalarni Tasdiqlash Migratsiyasi
-- Sana: 2026-10-19
-- ==============================================================================
-- 1. Shifokor arizalari jadvali (doctor_applications)
-- 2. doctors jadvaliga yangi holat ustunlari
-- 3. Qat'iy Row Level Security (RLS) siyosatlari
-- ==============================================================================

-- 1. SHIFOKOR ARIZALARI JADVALI
CREATE TABLE IF NOT EXISTS public.doctor_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id VARCHAR(100) NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    full_name VARCHAR(250) NOT NULL,
    birth_date DATE NOT NULL,
    phone VARCHAR(30) NOT NULL UNIQUE,
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    email VARCHAR(150) NOT NULL UNIQUE,
    specialty_id VARCHAR(50) NOT NULL,
    specialty_name VARCHAR(150) NOT NULL,
    experience_years INT NOT NULL DEFAULT 0,
    diploma_number VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    license_expiry DATE NOT NULL,
    hospital_name VARCHAR(250) NOT NULL,
    hospital_region VARCHAR(150),
    hospital_address TEXT,
    diploma_file_url TEXT NOT NULL,
    license_file_url TEXT NOT NULL,
    avatar_url TEXT,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_verification' 
        CHECK (status IN ('pending_verification', 'approved', 'rejected')),
    rejection_reason TEXT,
    work_schedule_days TEXT[] DEFAULT ARRAY['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma'],
    available_slots TEXT[] DEFAULT ARRAY['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    room_number VARCHAR(50) DEFAULT '101-xona',
    price NUMERIC(12, 2) DEFAULT 150000.00,
    consent_personal_data BOOLEAN NOT NULL DEFAULT true,
    consent_terms BOOLEAN NOT NULL DEFAULT true,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. DOCTORS JADVALINI YANGILASH (Holat va litsenziya ustunlari)
ALTER TABLE public.doctors 
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'approved' CHECK (status IN ('pending_verification', 'approved', 'rejected')),
    ADD COLUMN IF NOT EXISTS license_verified BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS license_status VARCHAR(30) DEFAULT 'verified' CHECK (license_status IN ('under_review', 'verified', 'rejected')),
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS diploma_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS license_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS license_expiry DATE;

-- 3. ROW LEVEL SECURITY (RLS) YOQISH
ALTER TABLE public.doctor_applications ENABLE ROW LEVEL SECURITY;

-- 4. RLS SIYOSATLARI

-- A. SHIFOKOR O'Z ARIZASINI KO'RISHI MUMKIN
CREATE POLICY "Doctor can view own application"
ON public.doctor_applications FOR SELECT
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- B. YANGI SHIFOKOR FAQAT "KUTILMOQDA" HOLATIDA ARIZA TOPSHIRA OLADI
-- (Foydalanuvchi o'zini o'zi 'approved' yoki 'admin' qila olmaydi!)
CREATE POLICY "Doctor can submit pending application"
ON public.doctor_applications FOR INSERT
WITH CHECK (
    status = 'pending_verification'
);

-- C. RAD ETILGAN SHIFOKOR O'Z ARIZASINI TUZATIB QAYTA YUBORA OLADI (Resubmit)
CREATE POLICY "Doctor can resubmit rejected application"
ON public.doctor_applications FOR UPDATE
USING (auth.uid() = user_id AND status = 'rejected')
WITH CHECK (status = 'pending_verification');

-- D. FAQAT ADMIN STATUS VA ISH JADVALINI TASDIQLAY/O'ZGARTIRA OLADI
CREATE POLICY "Admin can manage all applications"
ON public.doctor_applications FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- E. BEMORLAR VA JAMOATCHILIK: FAQAT TASDIQLANGAN SHIFOKORLARNI KO'RA OLADI
DROP POLICY IF EXISTS "Public can view active doctors" ON public.doctors;
CREATE POLICY "Public can view verified active doctors only"
ON public.doctors FOR SELECT
USING (is_active = true AND license_verified = true AND status = 'approved');

-- F. SHIFOKOR MAXFIYLIGI: Shifokor FAQAT o'zi tasdiqlangan bo'lsa bemorlar navbatini ko'radi
DROP POLICY IF EXISTS "Doctor view assigned appointments only" ON public.appointments;
CREATE POLICY "Doctor view assigned appointments only when approved"
ON public.appointments FOR SELECT
USING (
    doctor_id IN (
        SELECT id FROM public.doctors 
        WHERE user_id = auth.uid() 
          AND status = 'approved' 
          AND license_verified = true
    )
);
