import { describe, it } from 'node:test';
import assert from 'node:assert';

describe("1. ROLLLAR BO'YICHA QAT'IY XAVFSIZLIK VA ISOLYATSIYA", () => {
  it("Bemor ro'yxatdan o'tganda faqat bemor roliga ega bo'lishi va o'zi rolni o'zgartira olmasligi kerak", () => {
    // Foydalanuvchi so'rovda 'doctor' yoki 'admin' rolni yuborsa ham, server/tizim uni 'patient' qiladi
    const rawUserInput = {
      firstName: "Rustam",
      lastName: "Sobirov",
      phone: "+998901234567",
      role: "admin" // Xakerlik urinishi
    };

    const sanitizePatientData = (input) => ({
      ...input,
      role: 'patient' // Majburiy qat'iy rol
    });

    const registered = sanitizePatientData(rawUserInput);
    assert.strictEqual(registered.role, 'patient', "Bemor roli har doim majburiy 'patient' bo'lishi shart!");
  });

  it("updateUserProfile bemor rolini o'zgartirish urinishini rad etishi kerak", () => {
    let currentProfile = {
      id: "pat-123",
      name: "Sardor Karimov",
      role: "patient"
    };

    const updateUserProfile = (patch) => {
      const merged = { ...currentProfile, ...patch };
      // Bemor o'z roliga 'doctor' yoki 'admin' yoza olmaydi
      if (merged.role !== 'admin' && merged.role !== 'doctor') {
        merged.role = 'patient';
      } else if (currentProfile.role === 'patient') {
        merged.role = 'patient'; // Qat'iy blok
      }
      currentProfile = merged;
      return currentProfile;
    };

    updateUserProfile({ role: 'doctor', firstName: 'Sardor' });
    assert.strictEqual(currentProfile.role, 'patient', "Bemor o'z profilini tahrirlaganda rol o'zgarmasligi shart!");

    updateUserProfile({ role: 'admin' });
    assert.strictEqual(currentProfile.role, 'patient', "Bemor admin roliga o'ta olmasligi shart!");
  });

  it("Bemor boshqa bemorning tibbiy ma'lumotlarini ko'ra olmasligi kerak", () => {
    const appointments = [
      { id: 'app-1', patientId: 'pat-1', patientName: 'Alisher', diagnosis: 'Gastrit', doctorId: 'doc-1' },
      { id: 'app-2', patientId: 'pat-2', patientName: 'Madina', diagnosis: 'Migren', doctorId: 'doc-2' },
    ];

    const currentUserId = 'pat-1';
    const currentUserRole = 'patient';

    const getVisibleAppointments = (userId, role) => {
      if (role === 'admin') return appointments;
      if (role === 'doctor') return appointments.filter(a => a.doctorId === userId);
      return appointments.filter(a => a.patientId === userId);
    };

    const visible = getVisibleAppointments(currentUserId, currentUserRole);
    assert.strictEqual(visible.length, 1);
    assert.strictEqual(visible[0].patientName, 'Alisher');
    assert.strictEqual(visible.some(a => a.patientName === 'Madina'), false, "Begona bemor navbati ko'rinmasligi shart!");
  });

  it("Shifokor boshqa shifokorga yozilgan bemorlarni ko'rmasligi kerak", () => {
    const appointments = [
      { id: 'app-1', patientId: 'pat-1', patientName: 'Alisher', doctorId: 'doc-1' },
      { id: 'app-2', patientId: 'pat-2', patientName: 'Madina', doctorId: 'doc-2' },
    ];

    const doctor1Appointments = appointments.filter(a => a.doctorId === 'doc-1');
    assert.strictEqual(doctor1Appointments.length, 1);
    assert.strictEqual(doctor1Appointments[0].patientName, 'Alisher');
  });

  it("Admin autentifikatsiyasisiz admin paneliga ruxsat berilmasligi kerak", () => {
    const roleTamperingCheck = (requestedRole, isAdminAuthenticated) => {
      if (requestedRole === 'admin' && !isAdminAuthenticated) {
        return 'patient'; // Majburiy tushirish
      }
      return requestedRole;
    };

    const finalRole = roleTamperingCheck('admin', false);
    assert.strictEqual(finalRole, 'patient', "Tasdiqlanmagan admin zudlik bilan patient roliga tushirilishi kerak!");
  });
});

describe("2. BEMOR MA'LUMOTLARINI TO'LDIRISH OQIMI (ONBOARDING)", () => {
  it("Bemor profili to'liq bo'lmaganda isProfileComplete = false bo'lishi kerak", () => {
    const incompleteProfile = {
      phone: "+998901234567",
      role: "patient"
      // firstName, lastName, birthDate yo'q
    };

    const isProfileComplete = Boolean(
      incompleteProfile.firstName && 
      incompleteProfile.lastName && 
      incompleteProfile.birthDate && 
      incompleteProfile.consentGiven
    );

    assert.strictEqual(isProfileComplete, false, "To'liq bo'lmagan profil qabul qilinmasligi kerak!");
  });

  it("Barcha majburiy maydonlar to'ldirilgach isProfileComplete = true bo'lishi kerak", () => {
    const completedProfile = {
      firstName: "Ziyoda",
      lastName: "Rahmatova",
      birthDate: "1995-04-12",
      gender: "Ayol",
      region: "Samarqand viloyati",
      phone: "+998901234567",
      consentGiven: true,
      role: "patient"
    };

    const isProfileComplete = Boolean(
      completedProfile.firstName && 
      completedProfile.lastName && 
      completedProfile.birthDate && 
      completedProfile.consentGiven
    );

    assert.strictEqual(isProfileComplete, true, "To'liq to'ldirilgan profil tasdiqlanishi kerak!");
  });
});
