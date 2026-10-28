-- ==============================================================================
-- MedNavbat: Qat'iy Rol va RLS (Row Level Security) Siyosatlari
-- Sana: 2026-10-27
-- Maqsad:
--   1. Bemor faqat o'z profili va o'z navbatlarini o'qiy/yoza oladi.
--   2. Shifokor faqat o'ziga yozilgan bemorlar va o'z navbatlarini o'qiy oladi.
--   3. Administrator barcha ma'lumotlarni boshqara oladi.
--   4. 'role' ustunini foydalanuvchilar o'zlari o'zgartira olmaydi (faqat admin).
--   5. Bemor shifokor yoki admin jadvallari/funksiyalariga murojaat qila olmaydi.
-- ==============================================================================

-- 1. PROFILES / USERS JADVALI VA RLS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
    full_name TEXT,
    phone VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(10),
    region TEXT,
    blood_group VARCHAR(20),
    chronic_diseases TEXT,
    allergies TEXT,
    consent_given BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Bemor faqat o'z profilini o'qishi mumkin
CREATE POLICY "patient_read_own_profile" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Bemor faqat o'z profilini yangilashi mumkin (Lekin role o'zgarmaydi!)
CREATE POLICY "patient_update_own_profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ROL O'ZGARISHINI QAT'IY BLOKLASH TRIGGERI (Faqat admin o'zgartira oladi)
CREATE OR REPLACE FUNCTION public.prevent_role_tampering()
RETURNS TRIGGER AS $$
BEGIN
    -- Agar rolni o'zgartirishga urinish bo'lsa
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Faqat joriy foydalanuvchi admin bo'lsagina ruxsat
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Xatolik (403 Forbidden): Foydalanuvchi rolni o''zgartira olmaydi! Faqat administrator vakolatiga ega.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_tampering ON public.profiles;
CREATE TRIGGER trg_prevent_role_tampering
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_tampering();


-- 2. APPOINTMENTS (NAVBATLAR) JADVALI VA RLS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    specialty TEXT,
    status VARCHAR(30) DEFAULT 'Kutilmoqda',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Bemor faqat o'z navbatlarini ko'radi
CREATE POLICY "patient_read_own_appointments" ON public.appointments
    FOR SELECT
    USING (
        auth.uid() = patient_id OR 
        auth.uid() = doctor_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Bemor faqat o'z nomidan navbat yarata oladi
CREATE POLICY "patient_create_own_appointment" ON public.appointments
    FOR INSERT
    WITH CHECK (
        auth.uid() = patient_id AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patient')
    );

-- Navbatni faqat bemor (o'zinikini), shifokor (o'zinikini) yoki admin tahrirlashi mumkin
CREATE POLICY "modify_appointment_authorized_roles" ON public.appointments
    FOR UPDATE
    USING (
        auth.uid() = patient_id OR 
        auth.uid() = doctor_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );


-- 3. DOCTOR_ATTENDANCE (SHIFOKOR DAVOMATI) VA RLS
CREATE TABLE IF NOT EXISTS public.doctor_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'checked_in', 'absent'
    check_in_time TIMESTAMPTZ,
    absent_reason VARCHAR(50),
    absent_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doctor_attendance ENABLE ROW LEVEL SECURITY;

-- Bemorlar davomat jadvalini umuman ko'ra olmaydi!
-- Faqat shifokor o'z davomatini va admin barcha davomatlarni ko'radi
CREATE POLICY "doctor_and_admin_attendance_select" ON public.doctor_attendance
    FOR SELECT
    USING (
        auth.uid() = doctor_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Faqat shifokor o'zi uchun davomat belgilay oladi
CREATE POLICY "doctor_insert_own_attendance" ON public.doctor_attendance
    FOR INSERT
    WITH CHECK (
        auth.uid() = doctor_id AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'doctor')
    );


-- 4. DOCTOR_NOTIFICATIONS (SHIFOKOR XABARLARI) VA RLS
CREATE TABLE IF NOT EXISTS public.doctor_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doctor_notifications ENABLE ROW LEVEL SECURITY;

-- Bemorlar shifokor xabarlarini ko'ra olmaydi!
CREATE POLICY "doctor_read_own_notifications" ON public.doctor_notifications
    FOR SELECT
    USING (
        auth.uid() = doctor_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "doctor_update_own_notifications" ON public.doctor_notifications
    FOR UPDATE
    USING (auth.uid() = doctor_id);
