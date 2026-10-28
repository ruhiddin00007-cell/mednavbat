/**
 * MedNavbat — O'zbekiston Tumanlari va Hududlari Ma'lumotlar Bazasi
 * ──────────────────────────────────────────────────────────────────
 * 14 ta ma'muriy hudud (12 viloyat + Toshkent shahar + Qoraqalpog'iston)
 * va ularning asosiy tumanlari hamda markaziy koordinatalari.
 */

export const UZBEKISTAN_DISTRICTS_BY_REGION = {
  tashkent_city: {
    regionName: 'Toshkent shahri',
    center: [41.3111, 69.2797],
    districts: [
      { id: 'chilonzor', name: 'Chilonzor tumani', lat: 41.2721, lng: 69.2045 },
      { id: 'yunusobod', name: 'Yunusobod tumani', lat: 41.3644, lng: 69.2872 },
      { id: 'mirzo_ulugbek', name: "Mirzo Ulug'bek tumani", lat: 41.3385, lng: 69.3347 },
      { id: 'mirobod', name: 'Mirobod tumani', lat: 41.2917, lng: 69.2811 },
      { id: 'yakkasaroy', name: 'Yakkasaroy tumani', lat: 41.2858, lng: 69.2522 },
      { id: 'shayxontohur', name: 'Shayxontohur tumani', lat: 41.3206, lng: 69.2319 },
      { id: 'olmazor', name: 'Olmazor tumani', lat: 41.3542, lng: 69.2239 },
      { id: 'uchtepa', name: 'Uchtepa tumani', lat: 41.2942, lng: 69.1772 },
      { id: 'sergeli', name: 'Sergeli tumani', lat: 41.2236, lng: 69.2217 },
      { id: 'yangihayot', name: 'Yangihayot tumani', lat: 41.1989, lng: 69.2011 },
      { id: 'yashnobod', name: 'Yashnobod tumani', lat: 41.2981, lng: 69.3456 },
      { id: 'bektemir', name: 'Bektemir tumani', lat: 41.2339, lng: 69.3361 }
    ]
  },
  tashkent_region: {
    regionName: 'Toshkent viloyati',
    center: [41.2500, 69.8000],
    districts: [
      { id: 'chirchiq', name: 'Chirchiq shahri', lat: 41.4689, lng: 69.5822 },
      { id: 'olmaliq', name: 'Olmaliq shahri', lat: 40.8542, lng: 69.5986 },
      { id: 'angren', name: 'Angren shahri', lat: 41.0167, lng: 70.1436 },
      { id: 'bekobod', name: 'Bekobod shahri', lat: 40.2167, lng: 69.2167 },
      { id: 'yangiyol', name: "Yangiyo'l shahri/tumani", lat: 41.1167, lng: 69.0500 },
      { id: 'qibray', name: 'Qibray tumani', lat: 41.3833, lng: 69.4500 },
      { id: 'zangiota', name: 'Zangiota tumani', lat: 41.2333, lng: 69.1500 },
      { id: 'bostonliq', name: "Bo'stonliq tumani", lat: 41.6000, lng: 69.9500 },
      { id: 'parkent', name: 'Parkent tumani', lat: 41.2944, lng: 69.6764 },
      { id: 'orta_chirchiq', name: "O'rta Chirchiq tumani", lat: 41.1500, lng: 69.3500 },
      { id: 'yuqori_chirchiq', name: 'Yuqori Chirchiq tumani', lat: 41.3000, lng: 69.6000 }
    ]
  },
  samarkand: {
    regionName: 'Samarqand viloyati',
    center: [39.6542, 66.9597],
    districts: [
      { id: 'samarkand_city', name: 'Samarqand shahri', lat: 39.6542, lng: 66.9597 },
      { id: 'kattaqorgon', name: "Kattaqo'rg'on shahri/tumani", lat: 39.9000, lng: 66.2500 },
      { id: 'urgut', name: 'Urgut tumani', lat: 39.4056, lng: 67.2431 },
      { id: 'pastdargom', name: "Pastdarg'om tumani", lat: 39.6667, lng: 66.6667 },
      { id: 'bulungur', name: "Bulung'ur tumani", lat: 39.7667, lng: 67.2667 },
      { id: 'toyloq', name: 'Toyloq tumani', lat: 39.5833, lng: 67.1000 },
      { id: 'payariq', name: 'Payariq tumani', lat: 40.0167, lng: 66.8500 },
      { id: 'oqdaryo', name: 'Oqdaryo tumani', lat: 39.8167, lng: 66.7167 },
      { id: 'narpay', name: 'Narpay tumani', lat: 39.9500, lng: 65.9500 },
      { id: 'ishtixon', name: 'Ishtixon tumani', lat: 39.9667, lng: 66.4833 }
    ]
  },
  fergana: {
    regionName: "Farg'ona viloyati",
    center: [40.3842, 71.7843],
    districts: [
      { id: 'fergana_city', name: "Farg'ona shahri", lat: 40.3842, lng: 71.7843 },
      { id: 'qoqon', name: "Qo'qon shahri", lat: 40.5286, lng: 70.9425 },
      { id: 'margilon', name: "Marg'ilon shahri", lat: 40.4722, lng: 71.7167 },
      { id: 'quvasoy', name: 'Quvasoy shahri', lat: 40.3000, lng: 71.9667 },
      { id: 'quva', name: 'Quva tumani', lat: 40.5167, lng: 72.0667 },
      { id: 'oltariq', name: "Oltiariq tumani", lat: 40.3833, lng: 71.4833 },
      { id: 'rishton', name: 'Rishton tumani', lat: 40.3583, lng: 71.2833 },
      { id: 'bagdod', name: "Bog'dod tumani", lat: 40.4833, lng: 71.2167 },
      { id: 'uchkoprik', name: "Uchko'prik tumani", lat: 40.5333, lng: 71.0500 },
      { id: 'beshariq', name: 'Beshariq tumani', lat: 40.4333, lng: 70.6167 }
    ]
  },
  andijan: {
    regionName: 'Andijon viloyati',
    center: [40.7821, 72.3442],
    districts: [
      { id: 'andijan_city', name: 'Andijon shahri', lat: 40.7821, lng: 72.3442 },
      { id: 'asaka', name: 'Asaka tumani', lat: 40.6417, lng: 72.2389 },
      { id: 'shahrixon', name: 'Shahrixon tumani', lat: 40.7167, lng: 72.0500 },
      { id: 'xonobod', name: 'Xonobod shahri', lat: 40.8000, lng: 73.0000 },
      { id: 'qorgontepa', name: "Qo'rg'ontepa tumani", lat: 40.7333, lng: 72.7667 },
      { id: 'paxtaobod', name: 'Paxtaobod tumani', lat: 40.9333, lng: 72.5000 },
      { id: 'oltinkol', name: "Oltinko'l tumani", lat: 40.7667, lng: 72.1833 },
      { id: 'marhamat', name: 'Marhamat tumani', lat: 40.5000, lng: 72.3333 }
    ]
  },
  namangan: {
    regionName: 'Namangan viloyati',
    center: [40.9983, 71.6726],
    districts: [
      { id: 'namangan_city', name: 'Namangan shahri', lat: 40.9983, lng: 71.6726 },
      { id: 'chust', name: 'Chust tumani', lat: 41.0000, lng: 71.2333 },
      { id: 'kosonsoy', name: 'Kosonsoy tumani', lat: 41.2500, lng: 71.5500 },
      { id: 'pop', name: 'Pop tumani', lat: 40.8667, lng: 71.1000 },
      { id: 'toraqorgon', name: "To'raqo'rg'on tumani", lat: 41.0000, lng: 71.5000 },
      { id: 'uchqorgon', name: "Uchqo'rg'on tumani", lat: 41.1167, lng: 72.0833 },
      { id: 'norin', name: 'Norin tumani', lat: 40.8833, lng: 71.8000 },
      { id: 'mingbuloq', name: 'Mingbuloq tumani', lat: 40.8333, lng: 71.5000 }
    ]
  },
  bukhara: {
    regionName: 'Buxoro viloyati',
    center: [39.7747, 64.4286],
    districts: [
      { id: 'bukhara_city', name: 'Buxoro shahri', lat: 39.7747, lng: 64.4286 },
      { id: 'kogon', name: 'Kogon shahri/tumani', lat: 39.7228, lng: 64.5517 },
      { id: 'gijduvon', name: "G'ijduvon tumani", lat: 40.1000, lng: 64.6667 },
      { id: 'vobkent', name: 'Vobkent tumani', lat: 40.0167, lng: 64.5167 },
      { id: 'shofirkon', name: 'Shofirkon tumani', lat: 40.1167, lng: 64.5000 },
      { id: 'romitan', name: 'Romitan tumani', lat: 39.9333, lng: 64.3833 },
      { id: 'jondor', name: 'Jondor tumani', lat: 39.7333, lng: 64.1833 },
      { id: 'olot', name: 'Olot tumani', lat: 39.4167, lng: 63.8000 }
    ]
  },
  khorezm: {
    regionName: 'Xorazm viloyati',
    center: [41.5500, 60.6333],
    districts: [
      { id: 'urganch_city', name: 'Urganch shahri', lat: 41.5500, lng: 60.6333 },
      { id: 'xiva', name: 'Xiva shahri/tumani', lat: 41.3783, lng: 60.3639 },
      { id: 'xonqa', name: 'Xonqa tumani', lat: 41.4667, lng: 60.7833 },
      { id: 'gurlan', name: 'Gurlan tumani', lat: 41.8333, lng: 60.4000 },
      { id: 'shovot', name: 'Shovot tumani', lat: 41.6500, lng: 60.3000 },
      { id: 'hazoasp', name: 'Hazorasp tumani', lat: 41.3167, lng: 61.0667 },
      { id: 'qoshkopir', name: "Qo'shko'pir tumani", lat: 41.5333, lng: 60.3500 }
    ]
  },
  kashkadarya: {
    regionName: 'Qashqadaryo viloyati',
    center: [38.8606, 65.7891],
    districts: [
      { id: 'qarshi_city', name: 'Qarshi shahri', lat: 38.8606, lng: 65.7891 },
      { id: 'shahrisabz', name: 'Shahrisabz shahri/tumani', lat: 39.0500, lng: 66.8333 },
      { id: 'kitob', name: 'Kitob tumani', lat: 39.1167, lng: 66.8833 },
      { id: 'koson', name: 'Koson tumani', lat: 39.0333, lng: 65.5833 },
      { id: 'guzor', name: "G'uzor tumani", lat: 38.6167, lng: 66.2500 },
      { id: 'kamashi', name: 'Qamashi tumani', lat: 38.8167, lng: 66.4667 },
      { id: 'chiroqchi', name: 'Chiroqchi tumani', lat: 39.0333, lng: 66.5667 },
      { id: 'nishon', name: 'Nishon tumani', lat: 38.6500, lng: 65.6833 }
    ]
  },
  surkhandarya: {
    regionName: 'Surxondaryo viloyati',
    center: [37.2286, 67.2753],
    districts: [
      { id: 'termiz_city', name: 'Termiz shahri', lat: 37.2286, lng: 67.2753 },
      { id: 'denov', name: 'Denov tumani', lat: 38.2667, lng: 67.9000 },
      { id: 'sherobod', name: 'Sherobod tumani', lat: 37.6667, lng: 67.0000 },
      { id: 'boysun', name: 'Boysun tumani', lat: 38.2000, lng: 67.2000 },
      { id: 'qumqorgon', name: "Qumqo'rg'on tumani", lat: 37.8167, lng: 67.5833 },
      { id: 'shorchi', name: "Sho'rchi tumani", lat: 38.0000, lng: 67.7833 },
      { id: 'jarqorgon', name: "Jarqo'rg'on tumani", lat: 37.5000, lng: 67.4167 },
      { id: 'sariosiyo', name: 'Sariosiyo tumani', lat: 38.4500, lng: 68.0333 }
    ]
  },
  jizzakh: {
    regionName: 'Jizzax viloyati',
    center: [40.1158, 67.8422],
    districts: [
      { id: 'jizzakh_city', name: 'Jizzax shahri', lat: 40.1158, lng: 67.8422 },
      { id: 'zomin', name: 'Zomin tumani', lat: 39.9667, lng: 68.4000 },
      { id: 'gallaorol', name: "G'allaorol tumani", lat: 40.0167, lng: 67.5833 },
      { id: 'dostlik', name: "Do'stlik tumani", lat: 40.5333, lng: 68.0333 },
      { id: 'paxtakor', name: 'Paxtakor tumani', lat: 40.3167, lng: 67.9500 },
      { id: 'zarbdor', name: 'Zarbdor tumani', lat: 40.0833, lng: 68.1667 },
      { id: 'sharof_rashidov', name: 'Sharof Rashidov tumani', lat: 40.1500, lng: 67.8000 }
    ]
  },
  navoiy: {
    regionName: 'Navoiy viloyati',
    center: [40.0844, 65.3792],
    districts: [
      { id: 'navoiy_city', name: 'Navoiy shahri', lat: 40.0844, lng: 65.3792 },
      { id: 'zarafshon', name: 'Zarafshon shahri', lat: 41.5714, lng: 64.2014 },
      { id: 'uchquduq', name: 'Uchquduq tumani', lat: 42.1500, lng: 63.5500 },
      { id: 'karmana', name: 'Karmana tumani', lat: 40.1333, lng: 65.3667 },
      { id: 'qiziltepa', name: 'Qiziltepa tumani', lat: 40.0333, lng: 64.8167 },
      { id: 'xatirchi', name: 'Xatirchi tumani', lat: 40.0167, lng: 65.9500 },
      { id: 'nurota', name: 'Nurota tumani', lat: 40.5667, lng: 65.6833 }
    ]
  },
  sirdaryo: {
    regionName: 'Sirdaryo viloyati',
    center: [40.8373, 68.6618],
    districts: [
      { id: 'guliston_city', name: 'Guliston shahri', lat: 40.4897, lng: 68.7842 },
      { id: 'shirin', name: 'Shirin shahri', lat: 40.2167, lng: 69.1333 },
      { id: 'yangiyer', name: 'Yangiyer shahri', lat: 40.2667, lng: 68.8167 },
      { id: 'sirdaryo_dist', name: 'Sirdaryo tumani', lat: 40.8373, lng: 68.6618 },
      { id: 'sayxunobod', name: 'Sayxunobod tumani', lat: 40.6667, lng: 68.9167 },
      { id: 'boyovut', name: 'Boyovut tumani', lat: 40.4000, lng: 69.0500 },
      { id: 'oqoltin', name: 'Oqoltin tumani', lat: 40.5000, lng: 68.4167 },
      { id: 'mirzaobod', name: 'Mirzaobod tumani', lat: 40.5000, lng: 68.6667 }
    ]
  },
  karakalpakstan: {
    regionName: "Qoraqalpog'iston Respublikasi",
    center: [42.4602, 59.6166],
    districts: [
      { id: 'nukus_city', name: 'Nukus shahri', lat: 42.4602, lng: 59.6166 },
      { id: 'qongirot', name: "Qo'ng'irot tumani", lat: 43.0500, lng: 58.8333 },
      { id: 'beruniy', name: 'Beruniy tumani', lat: 41.6833, lng: 60.7500 },
      { id: 'tortkol', name: "To'rtko'l tumani", lat: 41.5500, lng: 61.0000 },
      { id: 'amudaryo', name: 'Amudaryo tumani', lat: 42.1167, lng: 60.1000 },
      { id: 'xojayli', name: "Xo'jayli tumani", lat: 42.4000, lng: 59.4500 },
      { id: 'chimboy', name: 'Chimboy tumani', lat: 42.9333, lng: 59.7667 },
      { id: 'shumanay', name: 'Shumanay tumani', lat: 42.6000, lng: 59.1333 }
    ]
  }
};

/**
 * Hudud ID bo'yicha tumanlar ro'yxatini olish
 */
export function getDistrictsByRegion(regionId) {
  if (!regionId) return [];
  const entry = UZBEKISTAN_DISTRICTS_BY_REGION[regionId];
  return entry ? entry.districts : [];
}

/**
 * Hudud markazi koordinatasini olish
 */
export function getRegionCenterCoords(regionId) {
  const entry = UZBEKISTAN_DISTRICTS_BY_REGION[regionId];
  return entry ? entry.center : [41.3111, 69.2797];
}
