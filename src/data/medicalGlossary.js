/**
 * MedNavbat Rasmiy Tibbiy Glossariy va Standart Atamalar Lug'ati
 * 
 * Tibbiy mutaxassisliklar nomlari barcha tillarda chalkashliksiz,
 * xalqaro tibbiy standartlarga (WHO, ICD-11, SNOMED CT) mos kelishi kerak.
 */

export const MEDICAL_SPECIALTIES_GLOSSARY = {
  kardiolog: {
    id: 'kardiolog',
    code_icd: 'SPEC-CARDIO',
    translations: {
      'uz-Latn': 'Kardiolog',
      'uz-Cyrl': 'Кардиолог',
      ru: 'Кардиолог',
      en: 'Cardiologist',
      tr: 'Kardiyolog',
      az: 'Kardioloq',
      kk: 'Кардиолог',
      ky: 'Кардиолог',
      tg: 'Кардиолог',
      tk: 'Kardiolog',
      ar: 'طبيب أمراض القلب',
      fa: 'متخصص قلب و عروق',
      ur: 'ماہر امراض قلب',
      he: 'קרדיולוג',
      'zh-Hans': '心血管内科专家 (心脏病专家)',
      'zh-Hant': '心臟內科專科醫生',
      hi: 'हृदय रोग विशेषज्ञ (कार्डियोलॉजिस्ट)',
      de: 'Kardiologe',
      fr: 'Cardiologue',
      es: 'Cardiólogo',
      it: 'Cardiologo',
      pt: 'Cardiologista',
      ja: '循環器内科医',
      ko: '순환기내과 전문의 (심장내과)'
    }
  },
  nevrolog: {
    id: 'nevrolog',
    code_icd: 'SPEC-NEURO',
    translations: {
      'uz-Latn': 'Nevrolog (Asab shifokori)',
      'uz-Cyrl': 'Невролог (Асаб шифокори)',
      ru: 'Невролог',
      en: 'Neurologist',
      tr: 'Nörolog',
      az: 'Nevroloq',
      kk: 'Невролог',
      ky: 'Невролог',
      tg: 'Невролог',
      tk: 'Newrolog',
      ar: 'طبيب أعصاب',
      fa: 'متخصص مغز و اعصاب',
      ur: 'ماہر امراض عصبی (نیورولوجسٹ)',
      he: 'נוירולוג',
      'zh-Hans': '神经内科专家',
      'zh-Hant': '神經內科專科醫生',
      hi: 'न्यूरोलॉजिस्ट (तंत्रिका तंत्र विशेषज्ञ)',
      de: 'Neurologe',
      fr: 'Neurologue',
      es: 'Neurólogo',
      it: 'Neurologo',
      pt: 'Neurologista',
      ja: '神経内科医',
      ko: '신경과 전문의'
    }
  },
  xirurg: {
    id: 'xirurg',
    code_icd: 'SPEC-SURG',
    translations: {
      'uz-Latn': 'Xirurg (Jarroh)',
      'uz-Cyrl': 'Хирург (Жарроҳ)',
      ru: 'Хирург',
      en: 'Surgeon',
      tr: 'Genel Cerrah',
      az: 'Cərrah',
      kk: 'Хирург',
      ky: 'Хирург',
      tg: 'Ҷарроҳ',
      tk: 'Hirurg',
      ar: 'جراح',
      fa: 'جراح عمومی',
      ur: 'سرجن',
      he: 'כירורג',
      'zh-Hans': '外科专家',
      'zh-Hant': '外科專科醫生',
      hi: 'शल्य चिकित्सक (सर्जन)',
      de: 'Chirurg',
      fr: 'Chirurgien',
      es: 'Cirujano',
      it: 'Chirurgo',
      pt: 'Cirurgião',
      ja: '外科医',
      ko: '외과 전문의'
    }
  },
  lor: {
    id: 'lor',
    code_icd: 'SPEC-ENT',
    translations: {
      'uz-Latn': 'LOR (Otorinolaringolog)',
      'uz-Cyrl': 'ЛОР (Оториноларинголог)',
      ru: 'ЛОР (Оториноларинголог)',
      en: 'ENT Specialist (Otolaryngologist)',
      tr: 'KBB Uzmanı (Kulak Burun Boğaz)',
      az: 'LOR (Qulaq Burun Boğaz)',
      kk: 'ЛОР (Оториноларинголог)',
      ky: 'ЛОР',
      tg: 'Оториноларинголог',
      tk: 'LOR',
      ar: 'طبيب أنف وأذن وحنجرة',
      fa: 'متخصص گوش، حلق و بینی',
      ur: 'ناک کان گلے کا ماہر (ای این ٹی)',
      he: 'רופא אף אוזן גרון',
      'zh-Hans': '耳鼻喉科专家',
      'zh-Hant': '耳鼻喉科專科醫生',
      hi: 'ईएनटी विशेषज्ञ (कान, नाक, गला)',
      de: 'HNO-Arzt',
      fr: 'ORL (Oto-rhino-laryngologiste)',
      es: 'Otorrinolaringólogo',
      it: 'Otorinolaringoiatra',
      pt: 'Otorrinolaringologista',
      ja: '耳鼻咽喉科医',
      ko: '이비인후과 전문의'
    }
  },
  pediatr: {
    id: 'pediatr',
    code_icd: 'SPEC-PED',
    translations: {
      'uz-Latn': 'Pediatr (Bolalar shifokori)',
      'uz-Cyrl': 'Педиатр (Болалар шифокори)',
      ru: 'Педиатр (Детский врач)',
      en: 'Pediatrician',
      tr: 'Çocuk Sağlığı ve Hastalıkları Uzmanı',
      az: 'Pediatr',
      kk: 'Педиатр',
      ky: 'Педиатр',
      tg: 'Педиатр',
      tk: 'Pediatr',
      ar: 'طبيب أطفال',
      fa: 'متخصص اطفال',
      ur: 'ماہر امراض اطفال (پیڈیاٹریشن)',
      he: 'רופא ילדים',
      'zh-Hans': '儿科专家',
      'zh-Hant': '兒科專科醫生',
      hi: 'बाल रोग विशेषज्ञ (पीडियाट्रिशियन)',
      de: 'Kinderarzt (Pädiater)',
      fr: 'Pédiatre',
      es: 'Pediatra',
      it: 'Pediatra',
      pt: 'Pediatra',
      ja: '小児科医',
      ko: '소아청소년과 전문의'
    }
  },
  terapevt: {
    id: 'terapevt',
    code_icd: 'SPEC-INTMED',
    translations: {
      'uz-Latn': 'Terapevt (Umumiy amaliyot shifokori)',
      'uz-Cyrl': 'Терапевт (Умумий амалиёт шифокори)',
      ru: 'Терапевт (Врач общей практики)',
      en: 'General Physician (Internist)',
      tr: 'Dahiliye Uzmanı (İç Hastalıkları)',
      az: 'Terapevt',
      kk: 'Терапевт',
      ky: 'Терапевт',
      tg: 'Терапевт',
      tk: 'Terapewt',
      ar: 'طبيب باطني عام',
      fa: 'متخصص بیماری‌های داخلی',
      ur: 'معالج عام (انٹرنسٹ)',
      he: 'רופא פנימי',
      'zh-Hans': '全科医师 / 内科专家',
      'zh-Hant': '內科專科醫生',
      hi: 'सामान्य चिकित्सक (फिजिशियन)',
      de: 'Internist / Allgemeinarzt',
      fr: 'Médecin Généraliste / Interniste',
      es: 'Médico General / Internista',
      it: 'Medico Internista',
      pt: 'Médico Clínico Geral',
      ja: '総合診療医 / 内科医',
      ko: '일반내과 전문의'
    }
  },
  stomatolog: {
    id: 'stomatolog',
    code_icd: 'SPEC-DENT',
    translations: {
      'uz-Latn': 'Stomatolog (Tish shifokori)',
      'uz-Cyrl': 'Стоматолог (Тиш шифокори)',
      ru: 'Стоматолог (Зубной врач)',
      en: 'Dentist / Dental Surgeon',
      tr: 'Diş Hekimi',
      az: 'Stomatoloq',
      kk: 'Стоматолог',
      ky: 'Стоматолог',
      tg: 'Дандонпизишк',
      tk: 'Stomatolog',
      ar: 'طبيب أسنان',
      fa: 'دندانپزشک',
      ur: 'دانتوں کا ڈاکٹر (ڈینٹسٹ)',
      he: 'רופא שיניים',
      'zh-Hans': '牙科医生',
      'zh-Hant': '牙科醫生',
      hi: 'दंत चिकित्सक (डेंटिस्ट)',
      de: 'Zahnarzt',
      fr: 'Dentiste',
      es: 'Dentista / Odontólogo',
      it: 'Dentista / Odontoiatra',
      pt: 'Dentista',
      ja: '歯科医師',
      ko: '치과의사'
    }
  },
  dermatolog: {
    id: 'dermatolog',
    code_icd: 'SPEC-DERM',
    translations: {
      'uz-Latn': 'Dermatolog (Teri shifokori)',
      'uz-Cyrl': 'Дерматолог (Тери шифокори)',
      ru: 'Дерматолог',
      en: 'Dermatologist',
      tr: 'Dermatolog (Cildiye)',
      az: 'Dermatoloq',
      kk: 'Дерматолог',
      ky: 'Дерматолог',
      tg: 'Дерматолог',
      tk: 'Dermatolog',
      ar: 'طبيب أمراض جلدية',
      fa: 'متخصص پوست و مو',
      ur: 'ماہر امراض جلد',
      he: 'רופא עור',
      'zh-Hans': '皮肤科专家',
      'zh-Hant': '皮膚科專科醫生',
      hi: 'त्वचा रोग विशेषज्ञ (डर्मेटोलॉजिस्ट)',
      de: 'Dermatologe (Hautarzt)',
      fr: 'Dermatologue',
      es: 'Dermatólogo',
      it: 'Dermatologo',
      pt: 'Dermatologista',
      ja: '皮膚科医',
      ko: '피부과 전문의'
    }
  },
  oftalmolog: {
    id: 'oftalmolog',
    code_icd: 'SPEC-OPHTH',
    translations: {
      'uz-Latn': 'Oftalmolog (Ko\'z shifokori)',
      'uz-Cyrl': 'Офтальмолог (Кўз шифокори)',
      ru: 'Офтальмолог (Окулист)',
      en: 'Ophthalmologist (Eye Specialist)',
      tr: 'Göz Hastalıkları Uzmanı',
      az: 'Oftalmoloq',
      kk: 'Офтальмолог',
      ky: 'Офтальмолог',
      tg: 'Офтальмолог',
      tk: 'Oftalmolog',
      ar: 'طبيب عيون',
      fa: 'متخصص چشم پزشکی',
      ur: 'ماہر امراض چشم',
      he: 'רופא עיניים',
      'zh-Hans': '眼科专家',
      'zh-Hant': '眼科專科醫生',
      hi: 'नेत्र रोग विशेषज्ञ',
      de: 'Augenarzt (Ophthalmologe)',
      fr: 'Ophtalmologiste',
      es: 'Oftalmólogo',
      it: 'Oculista / Oftalmologo',
      pt: 'Oftalmologista',
      ja: '眼科医',
      ko: '안과 전문의'
    }
  },
  ginekolog: {
    id: 'ginekolog',
    code_icd: 'SPEC-GYN',
    translations: {
      'uz-Latn': 'Ginekolog (Ayollar shifokori)',
      'uz-Cyrl': 'Гинеколог (Аёллар шифокори)',
      ru: 'Гинеколог',
      en: 'Gynecologist & Obstetrician',
      tr: 'Kadın Hastalıkları ve Doğum Uzmanı',
      az: 'Ginekoloq',
      kk: 'Гинеколог',
      ky: 'Гинеколог',
      tg: 'Гинеколог',
      tk: 'Ginekolog',
      ar: 'طبيبة نساء وتوليد',
      fa: 'متخصص زنان و زایمان',
      ur: 'ماہر امراض نسواں',
      he: 'גינקולוג',
      'zh-Hans': '妇产科专家',
      'zh-Hant': '婦產科專科醫生',
      hi: 'स्त्री रोग विशेषज्ञ (गाइनेकोलॉजिस्ट)',
      de: 'Gynäkologe (Frauenarzt)',
      fr: 'Gynécologue',
      es: 'Ginecólogo',
      it: 'Ginecologo',
      pt: 'Ginecologista',
      ja: '産婦人科医',
      ko: '산부인과 전문의'
    }
  },
  endokrinolog: {
    id: 'endokrinolog',
    code_icd: 'SPEC-ENDO',
    translations: {
      'uz-Latn': 'Endokrinolog (Gormon shifokori)',
      'uz-Cyrl': 'Эндокринолог',
      ru: 'Эндокринолог',
      en: 'Endocrinologist',
      tr: 'Endokrinoloji Uzmanı',
      az: 'Endokrinoloq',
      kk: 'Эндокринолог',
      ky: 'Эндокринолог',
      tg: 'Эндокринолог',
      tk: 'Endokrinolog',
      ar: 'طبيب الغدد الصماء والسكري',
      fa: 'متخصص غدد و متابولیسم',
      ur: 'ماہر امراض غدود (اینڈوکرائنولوجسٹ)',
      he: 'אנדוקרינולוג',
      'zh-Hans': '内分泌与代谢病科专家',
      'zh-Hant': '內分泌專科醫生',
      hi: 'एंडोक्राइनोलॉजिस्ट (हार्मोन विशेषज्ञ)',
      de: 'Endokrinologe',
      fr: 'Endocrinologue',
      es: 'Endocrinólogo',
      it: 'Endocrinologo',
      pt: 'Endocrinologista',
      ja: '内分泌内科医',
      ko: '내분비내과 전문의'
    }
  },
  urolog: {
    id: 'urolog',
    code_icd: 'SPEC-URO',
    translations: {
      'uz-Latn': 'Urolog',
      'uz-Cyrl': 'Уролог',
      ru: 'Уролог',
      en: 'Urologist',
      tr: 'Üroloji Uzmanı',
      az: 'Uroloq',
      kk: 'Уролог',
      ky: 'Уролог',
      tg: 'Уролог',
      tk: 'Urolog',
      ar: 'طبيب مسالك بولية',
      fa: 'متخصص اورولوژی (مجاری ادراری)',
      ur: 'ماہر امراض پیشاب و مثانہ',
      he: 'אורולוג',
      'zh-Hans': '泌尿外科专家',
      'zh-Hant': '泌尿外科專科醫生',
      hi: 'मूत्र रोग विशेषज्ञ (यूरोलॉजिस्ट)',
      de: 'Urologe',
      fr: 'Urologue',
      es: 'Urólogo',
      it: 'Urologo',
      pt: 'Urologista',
      ja: '泌尿器科医',
      ko: '비뇨의학과 전문의'
    }
  }
};

/**
 * Berilgan mutaxassislik uchun tilga mos standart atamani olish.
 * Fallback zanjiri: Tanlangan til -> uz-Latn -> uz -> ru -> en
 */
export const getStandardMedicalSpecialtyName = (specialtyId, currentLang = 'uz-Latn') => {
  if (!specialtyId) return '';
  const specKey = specialtyId.toLowerCase().trim();
  const entry = MEDICAL_SPECIALTIES_GLOSSARY[specKey];
  if (!entry) return specialtyId;

  const t = entry.translations;
  return t[currentLang] || 
         t[currentLang.split('-')[0]] || 
         t['uz-Latn'] || 
         t['ru'] || 
         t['en'] || 
         specialtyId;
};

/**
 * Shifokor ismlari qoidasi:
 * Qoida bo'yicha shifokorlarning asl ismi (full name) HECH QACHON tarjima qilinmaydi.
 * Faqat original shaklida taqdim etiladi.
 */
export const formatDoctorNameDisplay = (doctor) => {
  if (!doctor) return '';
  return doctor.fullName || doctor.name || '';
};
