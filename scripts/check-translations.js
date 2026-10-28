/**
 * CI / CD Tarjima Kalitlarini Tekshirish Skripti (check-translations.js)
 * 
 * Ushbu skript barcha locale JSON fayllarini asosiy referens (uz.json) bilan qiyoslaydi.
 * - Har bir tildagi yetishmayotgan (missing) kalitlar
 * - Ortiqcha (unused/orphan) kalitlar
 * - Foiz hisobidagi qamrov darajasini chiqaradi.
 * 
 * Ishga tushirish: node scripts/check-translations.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.resolve(__dirname, '../src/locales');
const BASE_LOCALE_FILE = 'uz.json';

/**
 * Nested JSON obyektidan kalitlar ro'yxatini flatten qilish (masalan "nav.online")
 */
function flattenObjectKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(flattenObjectKeys(value, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

function runCheck() {
  console.log('====================================================');
  console.log('🔍 MEDNAVBAT i18n Tarjima Kalitlarini Tekshirish (CI)');
  console.log('====================================================\n');

  const baseFilePath = path.join(LOCALES_DIR, BASE_LOCALE_FILE);
  if (!fs.existsSync(baseFilePath)) {
    console.error(`❌ Asosiy tarjima fayli topilmadi: ${baseFilePath}`);
    process.exit(1);
  }

  const baseContent = JSON.parse(fs.readFileSync(baseFilePath, 'utf8'));
  const baseKeys = flattenObjectKeys(baseContent);
  const baseKeySet = new Set(baseKeys);

  console.log(`📌 Asosiy til (Referens): ${BASE_LOCALE_FILE} (Jami kalitlar: ${baseKeys.length})\n`);

  const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json') && f !== BASE_LOCALE_FILE);

  let hasCriticalErrors = false;
  const summaryReport = [];

  for (const file of files) {
    const filePath = path.join(LOCALES_DIR, file);
    let content = {};
    try {
      content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error(`❌ ${file} faylida JSON sintaksis xatosi:`, err.message);
      hasCriticalErrors = true;
      continue;
    }

    const currentKeys = flattenObjectKeys(content);
    const currentKeySet = new Set(currentKeys);

    // Yetishmayotgan kalitlar
    const missingKeys = baseKeys.filter(k => !currentKeySet.has(k));
    // Ortiqcha kalitlar
    const orphanKeys = currentKeys.filter(k => !baseKeySet.has(k));

    const matchedCount = baseKeys.length - missingKeys.length;
    const coveragePercent = ((matchedCount / baseKeys.length) * 100).toFixed(1);

    summaryReport.push({
      file,
      total: currentKeys.length,
      missing: missingKeys.length,
      orphan: orphanKeys.length,
      coverage: `${coveragePercent}%`,
      missingList: missingKeys.slice(0, 5) // birinchi 5 tasi
    });

    console.log(`📄 Fayl: ${file}`);
    console.log(`   - Tarjima qamrovi: ${coveragePercent}% (${matchedCount}/${baseKeys.length})`);
    if (missingKeys.length > 0) {
      console.log(`   - Yetishmayotgan kalitlar: ${missingKeys.length} ta (Fallback orqali ishlaydi)`);
      if (missingKeys.length <= 5) {
        console.log(`     Misollar: ${missingKeys.join(', ')}`);
      }
    }
    if (orphanKeys.length > 0) {
      console.log(`   - Ortiqcha/maxsus kalitlar: ${orphanKeys.length} ta`);
    }
    console.log('');
  }

  console.log('----------------------------------------------------');
  console.log('📊 UMUMIY XULOSA:');
  console.table(summaryReport.map(r => ({
    'Fayl': r.file,
    'Qamrov': r.coverage,
    'Yetishmayotgan': r.missing,
    'Ortiqcha': r.orphan
  })));

  if (hasCriticalErrors) {
    console.error('\n❌ Tekshiruvda jiddiy sintaksis xatoliklar aniqlandi!');
    process.exit(1);
  } else {
    console.log('\n✅ Barcha tarjima fayllari sintaktik jihatdan to\'g\'ri va fallback zanjiriga tayyor!');
    process.exit(0);
  }
}

runCheck();
