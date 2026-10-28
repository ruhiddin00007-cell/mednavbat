import { describe, it } from 'node:test';
import assert from 'node:assert';

import { WORLD_LANGUAGES, findLanguageByCode, getSuggestedLanguageForCountry } from '../src/data/languagesConfig.js';
import { 
  searchLanguages, 
  normalizeLanguageSearchText, 
  calculateLevenshteinDistance 
} from '../src/utils/languageSearch.js';
import { 
  formatCurrencyByLocale, 
  formatDateByLocale, 
  getPluralCategory 
} from '../src/utils/i18nHelpers.js';
import { 
  MEDICAL_SPECIALTIES_GLOSSARY, 
  getStandardMedicalSpecialtyName,
  formatDoctorNameDisplay 
} from '../src/data/medicalGlossary.js';

describe('1. Jahon Tillari Ro\'yxati (languagesConfig)', () => {

  it('Kamida 50 ta asosiy til mavjud bo\'lishi kerak', () => {
    assert.ok(WORLD_LANGUAGES.length >= 50, `Kutilgan kamida 50 ta til, mavjud: ${WORLD_LANGUAGES.length}`);
  });

  it('Har bir til uchun BCP-47 kod, nomlar va yozuv yo\'nalishi to\'g\'ri saqlangan bo\'lishi kerak', () => {
    WORLD_LANGUAGES.forEach(lang => {
      assert.ok(lang.code, `Til kodi bo'sh: ${JSON.stringify(lang)}`);
      assert.ok(lang.nameNative, `Native nom bo'sh: ${lang.code}`);
      assert.ok(lang.nameEn, `Inglizcha nom bo'sh: ${lang.code}`);
      assert.ok(['ltr', 'rtl'].includes(lang.direction), `Noto'g'ri direction: ${lang.direction} (${lang.code})`);
      assert.strictEqual(typeof lang.isVerified, 'boolean');
      assert.strictEqual(typeof lang.isActive, 'boolean');
    });
  });

  it('O\'zbek (Lotin va Kirill), Rus, Ingliz, Qozoq, Turk, Arab, Xitoy tillari mavjud bo\'lishi kerak', () => {
    const codes = WORLD_LANGUAGES.map(l => l.code);
    const required = ['uz-Latn', 'uz-Cyrl', 'ru', 'en', 'kk', 'tr', 'ar', 'zh-Hans'];
    required.forEach(req => {
      assert.ok(codes.includes(req), `Kerakli til topilmadi: ${req}`);
    });
  });
});

describe('2. Til Qidiruvi va Fuzzy Search (languageSearch)', () => {

  it('Kod bo\'yicha aniq topishi kerak ("ru", "uz", "en", "tr", "ar")', () => {
    const resRu = searchLanguages('ru');
    assert.strictEqual(resRu[0]?.code, 'ru');

    const resUz = searchLanguages('uz');
    assert.ok(['uz-Latn', 'uz-Cyrl'].includes(resUz[0]?.code));

    const resTr = searchLanguages('tr');
    assert.strictEqual(resTr[0]?.code, 'tr');

    const resAr = searchLanguages('ar');
    assert.strictEqual(resAr[0]?.code, 'ar');
  });

  it('Endonym (o\'z nomi) bo\'yicha topishi kerak ("русский", "english", "العربية", "türkçe")', () => {
    const resRu = searchLanguages('русский');
    assert.strictEqual(resRu[0]?.code, 'ru');

    const resEn = searchLanguages('english');
    assert.strictEqual(resEn[0]?.code, 'en');

    const resAr = searchLanguages('العربية');
    assert.strictEqual(resAr[0]?.code, 'ar');

    const resTr = searchLanguages('türkçe');
    assert.strictEqual(resTr[0]?.code, 'tr');
  });

  it('Diakritik belgilarga chidamli bo\'lishi kerak (ö, ç, ı farqsizligi: "turkce" -> Turkish)', () => {
    const resTr = searchLanguages('turkce');
    assert.strictEqual(resTr[0]?.code, 'tr');

    const resFr = searchLanguages('francais');
    assert.strictEqual(resFr[0]?.code, 'fr');
  });

  it('Apostrof farqlariga chidamli bo\'lishi kerak (\' ʻ ’ ` farqsizligi)', () => {
    const q1 = searchLanguages("o'zbek");
    const q2 = searchLanguages("oʻzbek");
    const q3 = searchLanguages("o’zbek");
    const q4 = searchLanguages("ozbek");

    assert.ok(q1.some(l => l.code.startsWith('uz')));
    assert.ok(q2.some(l => l.code.startsWith('uz')));
    assert.ok(q3.some(l => l.code.startsWith('uz')));
    assert.ok(q4.some(l => l.code.startsWith('uz')));
  });

  it('Xato yozuvga (typo / fuzzy match) chidamli bo\'lishi kerak ("ruski", "fransus")', () => {
    const resFr = searchLanguages('fransus');
    assert.ok(resFr.some(l => l.code === 'fr'));

    const resRu = searchLanguages('ruski');
    assert.ok(resRu.some(l => l.code === 'ru'));
  });
});

describe('3. RTL Yo\'nalishi va Skriptlar', () => {

  it('Arab, Fors, Urdu va Ivrit tillari RTL bo\'lishi kerak', () => {
    const rtlCodes = ['ar', 'fa', 'ur', 'he'];
    rtlCodes.forEach(code => {
      const lang = findLanguageByCode(code);
      assert.ok(lang, `Til topilmadi: ${code}`);
      assert.strictEqual(lang.direction, 'rtl', `${code} yo'nalishi RTL bo'lishi kerak`);
    });
  });

  it('Lotin va Kirill yozuvidagi tillar LTR bo\'lishi kerak', () => {
    const ltrCodes = ['uz-Latn', 'uz-Cyrl', 'ru', 'en', 'de', 'fr'];
    ltrCodes.forEach(code => {
      const lang = findLanguageByCode(code);
      assert.ok(lang);
      assert.strictEqual(lang.direction, 'ltr');
    });
  });
});

describe('4. Avtomatik Taklif va Davlat Bog\'liqligi', () => {

  it('Davlat kodi bo\'yicha to\'g\'ri standart tilni taklif qilishi kerak', () => {
    assert.strictEqual(getSuggestedLanguageForCountry('UZ')?.code, 'uz-Latn');
    assert.strictEqual(getSuggestedLanguageForCountry('RU')?.code, 'ru');
    assert.strictEqual(getSuggestedLanguageForCountry('TR')?.code, 'tr');
    assert.strictEqual(getSuggestedLanguageForCountry('US')?.code, 'en');
    assert.strictEqual(getSuggestedLanguageForCountry('KZ')?.code, 'ru' || 'kk');
  });
});

describe('5. Intl Formatlash va Ko\'plik Shakllari (Plural Rules)', () => {

  it('CLDR plural rules to\'g\'ri kategoriya qaytarishi kerak', () => {
    // Inglizcha: 1 -> 'one', 2+ -> 'other'
    assert.strictEqual(getPluralCategory(1, 'en'), 'one');
    assert.strictEqual(getPluralCategory(5, 'en'), 'other');

    // Ruscha/Slavyancha: 1 -> 'one', 2 -> 'few', 5 -> 'many'
    assert.strictEqual(getPluralCategory(1, 'ru'), 'one');
    assert.strictEqual(getPluralCategory(2, 'ru'), 'few');
    assert.strictEqual(getPluralCategory(5, 'ru'), 'many');
  });

  it('Valyuta formati xatoliksiz ishlashi kerak', () => {
    const formatted = formatCurrencyByLocale(150000, 'UZS', 'uz-Latn');
    assert.ok(formatted.includes('150') || formatted.includes('so\'m') || formatted.includes('UZS'));
  });

  it('Sana formati xatoliksiz ishlashi kerak', () => {
    const testDate = new Date('2026-10-07T12:00:00Z');
    const formattedUz = formatDateByLocale(testDate, 'uz-Latn');
    const formattedEn = formatDateByLocale(testDate, 'en');
    assert.ok(formattedUz.length > 0);
    assert.ok(formattedEn.includes('2026'));
  });
});

describe('6. Tibbiy Glossariy va Shifokor Ismlari Qoidasi', () => {

  it('Asosiy tibbiy mutaxassisliklar barcha asosiy tillarda standartlashtirilgan bo\'lishi kerak', () => {
    const testSpecs = ['kardiolog', 'nevrolog', 'xirurg', 'lor', 'pediatr', 'terapevt'];
    testSpecs.forEach(spec => {
      const nameUz = getStandardMedicalSpecialtyName(spec, 'uz-Latn');
      const nameRu = getStandardMedicalSpecialtyName(spec, 'ru');
      const nameEn = getStandardMedicalSpecialtyName(spec, 'en');
      const nameAr = getStandardMedicalSpecialtyName(spec, 'ar');

      assert.ok(nameUz, `Mutaxassislik uz bo'sh: ${spec}`);
      assert.ok(nameRu, `Mutaxassislik ru bo'sh: ${spec}`);
      assert.ok(nameEn, `Mutaxassislik en bo'sh: ${spec}`);
      assert.ok(nameAr, `Mutaxassislik ar bo'sh: ${spec}`);
    });
  });

  it('Shifokor ismi hech qachon tarjima qilinmay, original ko\'rinishda saqlanishi kerak', () => {
    const doc = {
      fullName: 'Dr. Akmal Rahimov',
      name: 'Dr. Akmal Rahimov'
    };
    const displayed = formatDoctorNameDisplay(doc);
    assert.strictEqual(displayed, 'Dr. Akmal Rahimov');
  });
});
