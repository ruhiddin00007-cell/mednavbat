-- ==============================================================================
-- MedNavbat — Shifokor Litsenziya Tekshiruvi, AI Baholash va Xavfsizlik Migratsiyasi
-- Sana: 2026-10-27
-- ==============================================================================
-- 1. Litsenziya raqami takrorlanmasligi (UNIQUE constraint)
-- 2. Shifokor statuslari: pending, needs_review, approved, rejected
-- 3. Pasport/selfie surati va AI tahlil ustunlari (confidence score, is_suspicious)
-- 4. Himoyalangan hujjatlar ombori (Storage Bucket RLS)
-- 5. Audit Log jadvali (kim, qachon, nima qildi)
-- ==============================================================================

-- 1. DOCTOR_APPLICATIONS VA DOCTORS JADVALLARIGA UNIQUE CONSTRAINT QO'YISH
-- a) Litsenziya raqami bazada takrorlanmasligi shart (bir raqam bilan 2-chi akkaunt ochib bo'lmaydi)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_doctor_applications_license_number'
    ) THEN
        ALTER TABLE public.doctor_applications 
            ADD CONSTRAINT uq_doctor_applications_license_number UNIQUE (license_number);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_doctors_license_number'
    ) THEN
        ALTER TABLE public.doctors 
            ADD CONSTRAINT uq_doctors_license_number UNIQUE (license_number);
    END IF;
END $$;

-- 2. STATUS CHECK CHEKLOVINI YANGILASH ('pending', 'needs_review', 'approved', 'rejected')
ALTER TABLE public.doctor_applications DROP CONSTRAINT IF EXISTS doctor_applications_status_check;
ALTER TABLE public.doctor_applications 
    ADD CONSTRAINT doctor_applications_status_check 
    CHECK (status IN ('pending', 'pending_verification', 'needs_review', 'approved', 'rejected'));

ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS doctors_status_check;
ALTER TABLE public.doctors 
    ADD CONSTRAINT doctors_status_check 
    CHECK (status IN ('pending', 'pending_verification', 'needs_review', 'approved', 'rejected'));

-- 3. YANGI USTUNLARNI QO'SHISH (Pasport fayli, AI baholash va ishonch bali)
ALTER TABLE public.doctor_applications
    ADD COLUMN IF NOT EXISTS passport_file_url TEXT,
    ADD COLUMN IF NOT EXISTS ai_confidence_score INT CHECK (ai_confidence_score BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS ai_is_suspicious BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS ai_ocr_name_match BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS ai_tamper_risk VARCHAR(20) DEFAULT 'low',
    ADD COLUMN IF NOT EXISTS ai_reasons TEXT[];

ALTER TABLE public.doctors
    ADD COLUMN IF NOT EXISTS passport_file_url TEXT,
    ADD COLUMN IF NOT EXISTS ai_confidence_score INT,
    ADD COLUMN IF NOT EXISTS ai_is_suspicious BOOLEAN DEFAULT false;

-- 4. AUDIT LOG JADVALI (Barcha tasdiqlash va rad etish harakatlari uchun)
CREATE TABLE IF NOT EXISTS public.doctor_verification_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id VARCHAR(100) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'approve_doctor', 'reject_doctor', 'ai_evaluated', 'status_change'
    doctor_id VARCHAR(100) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log uchun indexlar
CREATE INDEX IF NOT EXISTS idx_audit_logs_doctor_id ON public.doctor_verification_audit_logs(doctor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.doctor_verification_audit_logs(created_at DESC);

-- RLS yoqish
ALTER TABLE public.doctor_verification_audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit log siyosatlari: Faqat admin o'qiy oladi, hech kim o'chira yoki tahrir qila olmaydi (Immutable log)
CREATE POLICY "Admin can view all audit logs"
ON public.doctor_verification_audit_logs FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "System and admin can insert audit logs"
ON public.doctor_verification_audit_logs FOR INSERT
WITH CHECK (true);

-- 5. HIMOYALANGAN HUJJATLAR SAQLASH OMBORI (STORAGE BUCKET)
-- Hujjatlar (litsenziya, diplom, pasport) ochiq papkada bo'lmasligi kerak
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-documents-secure', 'doctor-documents-secure', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage RLS siyosatlari
CREATE POLICY "Doctor can upload own documents to secure bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'doctor-documents-secure' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Doctor can read own documents in secure bucket"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'doctor-documents-secure' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admin can read and review all documents in secure bucket"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'doctor-documents-secure' 
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
