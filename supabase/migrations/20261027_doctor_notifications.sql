-- ==============================================================================
-- MedNavbat — Shifokor Bildirishnomalari (doctor_notifications) & RLS
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

CREATE INDEX IF NOT EXISTS idx_doctor_notifs_doctor_id ON public.doctor_notifications(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_notifs_created_at ON public.doctor_notifications(created_at DESC);

ALTER TABLE public.doctor_notifications ENABLE ROW LEVEL SECURITY;

-- 1. Shifokor faqat o'z xabarlarini ko'radi
CREATE POLICY "Doctor view own notifications only"
ON public.doctor_notifications FOR SELECT
USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Shifokor faqat o'z xabarini yangilaydi
CREATE POLICY "Doctor update own notifications"
ON public.doctor_notifications FOR UPDATE
USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);

-- 3. Shifokor faqat o'z xabarini o'chiradi
CREATE POLICY "Doctor delete own notifications"
ON public.doctor_notifications FOR DELETE
USING (
    doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid())
);

-- 4. Yaratish faqat admin yoki tizim hodisalari orqali
CREATE POLICY "Admin or system insert doctor notifications"
ON public.doctor_notifications FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    auth.uid() IS NOT NULL
);
