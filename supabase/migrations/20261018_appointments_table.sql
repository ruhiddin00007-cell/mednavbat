-- ============================================================================
-- Med navbat — Navbatlar Jadvali, Unikal Slot Cheklovi va RLS Siyosatlari (Supabase)
-- ============================================================================
-- Ushbu SQL skriptni Supabase Dashboard -> SQL Editor bo'limida ishga tushiring.

-- 1. APPOINTMENTS (NAVBATLAR) JADVALINI YARATISH
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null,
  doctor_id text not null,
  doctor_name text not null,
  specialty_name text not null,
  hospital_name text not null,
  patient_name text not null,
  patient_phone text not null,
  appointment_date date not null,
  time_slot text not null,
  status text not null default 'Tasdiqlangan',
  symptoms text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.appointments is 'Med navbat platformasidagi bemorlar navbatlari';

-- 2. DOUBLE BOOKING OLDINI OLISH UCHUN UNIKAL CHEKLOV (INDEX)
-- Faol (bekor qilinmagan) navbatlar uchun: bitta shifokor + bitta sana + bitta vaqt slotiga
-- bir vaqtning o'zida FAQAT bitta bemor yozilishi mumkin!
create unique index if not exists unique_doctor_active_slot
  on public.appointments (doctor_id, appointment_date, time_slot)
  where (status != 'Bekor qilingan');

-- Tezkor qidiruv indekslari
create index if not exists idx_appointments_date_doc 
  on public.appointments (doctor_id, appointment_date);

create index if not exists idx_appointments_phone 
  on public.appointments (patient_phone);

-- 3. ROW LEVEL SECURITY (RLS) YOQISH
alter table public.appointments enable row level security;

-- Mavjud siyosatlarni tozalash (qayta ishga tushirilganda xato bermasligi uchun)
drop policy if exists "Navbatlarni hamma ko'rishi mumkin" on public.appointments;
drop policy if exists "Hamma navbat olishi mumkin" on public.appointments;
drop policy if exists "Navbatni bekor qilish yoki yangilash" on public.appointments;

-- Ommaviy siyosatlar (Bemorlar uchun ochiq portal)
-- a) Bo'sh va band vaqtlarni aniqlash uchun barcha faol navbatlarni hamma o'qiy oladi
create policy "Navbatlarni hamma ko'rishi mumkin"
  on public.appointments for select
  using (true);

-- b) Har qanday bemor yangi navbat qo'sha oladi (agar slot bo'sh bo'lsa)
create policy "Hamma navbat olishi mumkin"
  on public.appointments for insert
  with check (true);

-- c) Navbatni bekor qilish uchun yangilash
create policy "Navbatni bekor qilish yoki yangilash"
  on public.appointments for update
  using (true);

-- 4. REALTIME YOQISH (Ixtiyoriy: agar Realtime yoqilsa, o'zgarishlar darhol brauzerda aks etadi)
alter publication supabase_realtime add table public.appointments;
