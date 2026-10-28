-- ============================================================================
-- MedNavbat — Shifokorlar Jadvali, Trigger va RLS Siyosatlari (Supabase)
-- ============================================================================
-- Ushbu SQL skriptni Supabase Dashboard -> SQL Editor bo'limida ishga tushiring.

-- 1. DOCTORS JADVALINI YARATISH
create table if not exists public.doctors (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  phone text not null,
  specialty_id text not null default 'terapevt',
  specialty_name text,
  experience_years integer default 0,
  license_no text not null,
  hospital_name text default '',
  work_days text default '',
  bio text default '',
  avatar text default 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
  approved boolean not null default false, -- Admin tasdiqlamaguncha FALSE
  rating numeric(3, 2) default 5.0,
  review_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Izoh: Jadval ustunlari maqsadi
comment on table public.doctors is 'MedNavbat platformasidagi shifokorlar profili';
comment on column public.doctors.approved is 'Admin tomonidan litsenziya tekshirilganligi (boshlang''ich holat: false)';

-- 2. ROW LEVEL SECURITY (RLS) YOQISH
alter table public.doctors enable row level security;

-- Mavjud siyosatlarni tozalash (qayta ishga tushirishda xato bermasligi uchun)
drop policy if exists "Tasdiqlangan shifokorlarni hamma ko'rishi mumkin" on public.doctors;
drop policy if exists "Shifokor o'z profilini ko'rishi mumkin" on public.doctors;
drop policy if exists "Shifokor o'z profilini yangilashi mumkin" on public.doctors;
drop policy if exists "Service role to'liq huquqqa ega" on public.doctors;

-- RLS SIYOSATLARI:
-- a) Bemorlar va ommaviy foydalanuvchilar faqat admin tasdiqlagan shifokorlarni ko'radi
create policy "Tasdiqlangan shifokorlarni hamma ko'rishi mumkin"
  on public.doctors for select
  using (approved = true);

-- b) Shifokor o'z profilini ko'ra oladi (hatto approved = false bo'lsa ham)
create policy "Shifokor o'z profilini ko'rishi mumkin"
  on public.doctors for select
  using (auth.uid() = id);

-- c) Shifokor o'z ma'lumotlarini yangilashi mumkin (approved maydoni o'zgarmaydi)
create policy "Shifokor o'z profilini yangilashi mumkin"
  on public.doctors for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. TRIGGER FUNKSIYASI: auth.users -> public.doctors
-- Yangi foydalanuvchi signUp qilganda agar role = 'doctor' bo'lsa,
-- avtomatik tarzda public.doctors jadvaliga approved = false bilan yoziladi.
create or replace function public.handle_new_doctor()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Faqat shifokor roli bilan ro'yxatdan o'tganlarni yozish
  if (new.raw_user_meta_data->>'role') = 'doctor' then
    insert into public.doctors (
      id,
      email,
      full_name,
      phone,
      specialty_id,
      specialty_name,
      experience_years,
      license_no,
      hospital_name,
      work_days,
      bio,
      avatar,
      approved
    ) values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      coalesce(new.raw_user_meta_data->>'phone', ''),
      coalesce(new.raw_user_meta_data->>'specialty_id', 'terapevt'),
      coalesce(new.raw_user_meta_data->>'specialty_name', 'Terapevt'),
      coalesce((new.raw_user_meta_data->>'experience_years')::integer, 0),
      coalesce(new.raw_user_meta_data->>'license_no', ''),
      coalesce(new.raw_user_meta_data->>'hospital_name', ''),
      coalesce(new.raw_user_meta_data->>'work_days', ''),
      coalesce(new.raw_user_meta_data->>'bio', ''),
      coalesce(new.raw_user_meta_data->>'avatar', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80'),
      false -- MUHIM: Litsenziya admin tekshiruviga tushadi, approved = false
    )
    on conflict (id) do update set
      full_name = excluded.full_name,
      phone = excluded.phone,
      specialty_id = excluded.specialty_id,
      specialty_name = excluded.specialty_name,
      license_no = excluded.license_no,
      updated_at = timezone('utc'::text, now());
  end if;
  return new;
end;
$$;

-- Trigger'ni ulash
drop trigger if exists on_auth_user_created_doctor on auth.users;
create trigger on_auth_user_created_doctor
  after insert on auth.users
  for each row execute procedure public.handle_new_doctor();

-- 4. INDEKSLAR (Tezkor qidiruv uchun)
create index if not exists idx_doctors_approved on public.doctors(approved);
create index if not exists idx_doctors_specialty on public.doctors(specialty_id);
create index if not exists idx_doctors_email on public.doctors(email);
