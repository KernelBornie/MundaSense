/**
 * MundaSense — Zambia Province & District Reference
 * All 10 provinces and 116 districts for dropdown filters.
 */

export interface ProvinceInfo {
  name: string;
  code: string;
  capital: string;
  districts: string[];
}

export const ZAMBIA_PROVINCES: ProvinceInfo[] = [
  {
    name: 'Central',
    code: 'CTR',
    capital: 'Kabwe',
    districts: [
      'Chibombo', 'Chisamba', 'Chitambo', 'Kabwe', 'Kapiri Mposhi',
      'Luano', 'Mkushi', 'Mumbwa', 'Ngabwe', 'Serenje', 'Shibuyunji',
    ],
  },
  {
    name: 'Copperbelt',
    code: 'CBT',
    capital: 'Ndola',
    districts: [
      'Chililabombwe', 'Chingola', 'Kalulushi', 'Kitwe', 'Luanshya',
      'Lufwanyama', 'Masaiti', 'Mpongwe', 'Mufulira', 'Ndola',
    ],
  },
  {
    name: 'Eastern',
    code: 'EAS',
    capital: 'Chipata',
    districts: [
      'Chadiza', 'Chasefu', 'Chipangali', 'Chipata', 'Kasenengwa',
      'Katete', 'Lumezi', 'Lundazi', 'Lusangazi', 'Mambwe',
      'Nyimba', 'Petauke', 'Sinda', 'Vubwi',
    ],
  },
  {
    name: 'Luapula',
    code: 'LUA',
    capital: 'Mansa',
    districts: [
      'Chembe', 'Chiengi', 'Chifunabuli', 'Chipili', 'Kawambwa',
      'Lunga', 'Mansa', 'Milenge', 'Mwansabombwe', 'Mwense',
      'Nchelenge', 'Samfya',
    ],
  },
  {
    name: 'Lusaka',
    code: 'LUS',
    capital: 'Lusaka',
    districts: [
      'Chilanga', 'Chongwe', 'Kafue', 'Luangwa', 'Lusaka', 'Rufunsa',
    ],
  },
  {
    name: 'Muchinga',
    code: 'MUC',
    capital: 'Chinsali',
    districts: [
      'Chinsali', 'Isoka', 'Kanchibiya', 'Lavushimanda', 'Mafinga',
      'Mpika', 'Nakonde', "Shiwang'andu",
    ],
  },
  {
    name: 'Northern',
    code: 'NOR',
    capital: 'Kasama',
    districts: [
      'Chilubi', 'Kaputa', 'Kasama', 'Lunte', 'Lupososhi',
      'Luwingu', 'Mbala', 'Mporokoso', 'Mpulungu', 'Mungwi',
      'Nsama', 'Senga Hill',
    ],
  },
  {
    name: 'North-Western',
    code: 'NWP',
    capital: 'Solwezi',
    districts: [
      'Chavuma', 'Ikelenge', 'Kabompo', 'Kalumbila', 'Kasempa',
      'Manyinga', 'Mufumbwe', 'Mwinilunga', 'Mushindamo', 'Solwezi',
      'Zambezi',
    ],
  },
  {
    name: 'Southern',
    code: 'SOU',
    capital: 'Choma',
    districts: [
      'Chikankata', 'Choma', 'Gwembe', 'Kalomo', 'Kazungula',
      'Livingstone', 'Mazabuka', 'Monze', 'Namwala', 'Pemba',
      'Sinazongwe', 'Siavonga', 'Zimba',
    ],
  },
  {
    name: 'Western',
    code: 'WES',
    capital: 'Mongu',
    districts: [
      'Kalabo', 'Kaoma', 'Limulunga', 'Luampa', 'Lukulu',
      'Mitete', 'Mongu', 'Mulobezi', 'Mwandi', 'Nalolo',
      'Nkeyema', 'Senanga', 'Sesheke', 'Shangombo', 'Sikongo', 'Sioma',
    ],
  },
];

/**
 * Flat list of province names for dropdowns.
 */
export const ZAMBIA_PROVINCE_LIST: string[] = ZAMBIA_PROVINCES.map((p) => p.name);

/**
 * Returns the list of districts for a given province.
 * Returns all districts if province name is empty or unknown.
 */
export function getDistrictsForProvince(province: string): string[] {
  if (!province) {
    return ZAMBIA_PROVINCES.flatMap((p) => p.districts);
  }
  const match = ZAMBIA_PROVINCES.find(
    (p) => p.name.toLowerCase() === province.toLowerCase()
  );
  return match ? match.districts : [];
}

/**
 * Returns province metadata by name.
 */
export function getProvinceInfo(province: string): ProvinceInfo | undefined {
  return ZAMBIA_PROVINCES.find(
    (p) => p.name.toLowerCase() === province.toLowerCase()
  );
}

/**
 * Total district count across all provinces (116).
 */
export const ZAMBIA_TOTAL_DISTRICTS: number = ZAMBIA_PROVINCES.reduce(
  (sum, p) => sum + p.districts.length,
  0
);

/**
 * Total province count (10).
 */
export const ZAMBIA_TOTAL_PROVINCES: number = ZAMBIA_PROVINCES.length;
