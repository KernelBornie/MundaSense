/**
 * MundaSense — Real Treatment Database
 * Zambian smallholder context. Products available at:
 *   - Msekera Cooperative Depot (Chipata)
 *   - National Milling agri-stores
 *   - ZAMSEED outlets
 *   - Champion Agro, Ozone Agro, Farm Depot
 *
 * All prices in ZMW (2026 estimates).
 * All doses calibrated to 1-hectare standard plots.
 *
 * Sources: ZARI recommendations, FAO IPM guidelines, Zambia Ministry
 * of Agriculture crop manuals, and regional agronomist input.
 */

export interface TreatmentOption {
  type: 'chemical' | 'organic' | 'cultural' | 'biological';
  product: string;
  activeIngredient: string;
  dosePerHectare: string;
  applicationMethod: string;
  interval: string;
  phi: number;              // Pre-harvest interval in days
  estimatedCostZMW: number; // Cost per hectare
  availability: string;     // Where to buy in Zambia
  safetyNote: string;
  effectiveness: 'excellent' | 'good' | 'moderate';
}

export interface DiseaseTreatmentPlan {
  disease: string;
  pathogen: string;
  immediateActions: string[];
  chemicalOptions: TreatmentOption[];
  organicOptions: TreatmentOption[];
  culturalControls: string[];
  prevention: string[];
  economicThreshold: string;
  yieldLossIfUntreated: string;
  spreadRisk: 'low' | 'moderate' | 'high' | 'very high';
}

export const TREATMENT_PLANS: Record<string, DiseaseTreatmentPlan> = {

  /* ============================================================
     MAIZE
     ============================================================ */
  'Northern Corn Leaf Blight': {
    disease: 'Northern Corn Leaf Blight',
    pathogen: 'Exserohilum turcicum',
    immediateActions: [
      'Remove and burn the 3–4 most affected lower leaves per plant.',
      'Stop overhead irrigation for 48 hours to reduce leaf wetness.',
      'Scout the field daily for lesion spread to ear leaf.',
    ],
    chemicalOptions: [
      {
        type: 'chemical',
        product: 'Amistar Xtra 280 SC',
        activeIngredient: 'Azoxystrobin 200 g/L + Cyproconazole 80 g/L',
        dosePerHectare: '0.8 L in 200 L water',
        applicationMethod: 'Foliar spray with knapsack at first sign before ear leaf emerges',
        interval: '14 days, max 2 applications per season',
        phi: 28,
        estimatedCostZMW: 420,
        availability: 'Champion Agro, Ozone Agro (Chipata)',
        safetyNote: 'Wear gloves and mask. Do not spray within 30m of water sources.',
        effectiveness: 'excellent',
      },
      {
        type: 'chemical',
        product: 'Tilt 250 EC',
        activeIngredient: 'Propiconazole 250 g/L',
        dosePerHectare: '0.5 L in 200 L water',
        applicationMethod: 'Foliar spray, full canopy coverage',
        interval: '14 days, max 3 applications',
        phi: 30,
        estimatedCostZMW: 380,
        availability: 'Farm Depot, ZAMSEED outlets',
        safetyNote: 'Toxic to fish. Do not contaminate rivers.',
        effectiveness: 'good',
      },
    ],
    organicOptions: [
      {
        type: 'organic',
        product: 'Neem oil extract (Azadirachtin 3%)',
        activeIngredient: 'Azadirachtin',
        dosePerHectare: '3 L in 200 L water + 0.5% soap',
        applicationMethod: 'Foliar spray every 7–10 days',
        interval: '7–10 days',
        phi: 0,
        estimatedCostZMW: 180,
        availability: 'Local agro-input shops, homemade from neem tree',
        safetyNote: 'Safe for humans and beneficial insects.',
        effectiveness: 'moderate',
      },
      {
        type: 'organic',
        product: 'Wood ash + water slurry',
        activeIngredient: 'Potassium carbonate',
        dosePerHectare: '5 kg ash in 20 L water, filtered',
        applicationMethod: 'Foliar spray on affected leaves',
        interval: 'Every 5 days',
        phi: 0,
        estimatedCostZMW: 0,
        availability: 'Free — household wood ash',
        safetyNote: 'Safe. Test on small area first — can burn young leaves.',
        effectiveness: 'moderate',
      },
    ],
    culturalControls: [
      'Rotate to groundnuts or soybeans next season — breaks the fungal cycle.',
      'Plough under crop residue after harvest to destroy overwintering spores.',
      'Plant resistant hybrids: SC647, Pan 53, MRI 624.',
      'Space plants 75 cm × 25 cm for airflow.',
    ],
    prevention: [
      'Use certified disease-free seed from ZAMSEED.',
      'Early planting (first 2 weeks of November) to escape late-season pressure.',
      'Balanced fertilization — avoid excess nitrogen.',
    ],
    economicThreshold: 'Treat when >30% of the ear-leaf area is affected or lesions are within 15 cm of the ear.',
    yieldLossIfUntreated: '15–40% grain yield reduction',
    spreadRisk: 'high',
  },

  'Common Rust': {
    disease: 'Common Rust',
    pathogen: 'Puccinia sorghi',
    immediateActions: [
      'Confirm rust is above the ear leaf before spraying.',
      'Remove rust-infected volunteer maize from field borders.',
      'Continue daily scouting — rust moves fast in humid weather.',
    ],
    chemicalOptions: [
      {
        type: 'chemical',
        product: 'Folicur 250 EW',
        activeIngredient: 'Tebuconazole 250 g/L',
        dosePerHectare: '1.0 L in 200 L water',
        applicationMethod: 'Foliar spray from first sign to milk stage',
        interval: '14 days, max 2 applications',
        phi: 21,
        estimatedCostZMW: 490,
        availability: 'Champion Agro, Farm Depot',
        safetyNote: 'Do not apply within 21 days of harvest.',
        effectiveness: 'excellent',
      },
      {
        type: 'chemical',
        product: 'Amistar 250 SC',
        activeIngredient: 'Azoxystrobin 250 g/L',
        dosePerHectare: '0.6 L in 200 L water',
        applicationMethod: 'Foliar spray',
        interval: '14 days',
        phi: 28,
        estimatedCostZMW: 450,
        availability: 'Ozone Agro, National Milling agri-stores',
        safetyNote: 'Rotate with triazoles to prevent resistance.',
        effectiveness: 'excellent',
      },
    ],
    organicOptions: [
      {
        type: 'organic',
        product: 'Potassium bicarbonate + horticultural oil',
        activeIngredient: 'KHCO3',
        dosePerHectare: '5 kg + 1 L oil in 200 L water',
        applicationMethod: 'Foliar spray at first pustule, repeat weekly',
        interval: '7 days',
        phi: 0,
        estimatedCostZMW: 150,
        availability: 'Specialty agro-shops in Lusaka',
        safetyNote: 'Safe for humans, bees, beneficials.',
        effectiveness: 'moderate',
      },
    ],
    culturalControls: [
      'Plant rust-resistant hybrids — Pan 53, SC 719.',
      'Early planting to avoid peak rust season (January–February).',
      'Avoid late-season nitrogen top-dressing — promotes succulent leaf tissue.',
    ],
    prevention: [
      'Use resistant varieties.',
      'Rotate to non-cereal crops.',
      'Monitor first with pheromone or spore traps.',
    ],
    economicThreshold: 'Treat when 50% of plants show pustules on the ear leaf or above.',
    yieldLossIfUntreated: '10–35% grain yield reduction',
    spreadRisk: 'very high',
  },

  'Fall Armyworm': {
    disease: 'Fall Armyworm',
    pathogen: 'Spodoptera frugiperda',
    immediateActions: [
      'Scout 20 plants in 5 spots across the field.',
      'Handpick larvae from whorls if infestation is <10% of plants.',
      'Apply treatment if 2+ larvae per plant in whorl stage.',
    ],
    chemicalOptions: [
      {
        type: 'chemical',
        product: 'Ampligo 150 ZC',
        activeIngredient: 'Chlorantraniliprole 100 g/L + Lambda-cyhalothrin 50 g/L',
        dosePerHectare: '0.4 L in 200 L water',
        applicationMethod: 'Directed spray into the whorl',
        interval: '10 days, max 2 applications',
        phi: 14,
        estimatedCostZMW: 520,
        availability: 'Champion Agro, Ozone Agro',
        safetyNote: 'Highly toxic to bees — spray after 5pm. Wear full PPE.',
        effectiveness: 'excellent',
      },
      {
        type: 'chemical',
        product: 'Karate 5 EC',
        activeIngredient: 'Lambda-cyhalothrin 50 g/L',
        dosePerHectare: '0.3 L in 200 L water',
        applicationMethod: 'Directed whorl spray at dusk',
        interval: '7–10 days',
        phi: 7,
        estimatedCostZMW: 220,
        availability: 'ZAMSEED, National Milling',
        safetyNote: 'Do not spray during flowering — kills pollinators.',
        effectiveness: 'good',
      },
    ],
    organicOptions: [
      {
        type: 'organic',
        product: 'Bt (Bacillus thuringiensis) kurstaki',
        activeIngredient: 'Bt kurstaki spores',
        dosePerHectare: '1 kg in 200 L water',
        applicationMethod: 'Whorl-directed spray at dusk',
        interval: '5 days, 3 applications',
        phi: 0,
        estimatedCostZMW: 240,
        availability: 'Specialty agro-shops, NGO programs',
        safetyNote: 'Safe for humans, bees, and beneficial insects.',
        effectiveness: 'good',
      },
      {
        type: 'organic',
        product: 'Neem seed kernel extract',
        activeIngredient: 'Azadirachtin',
        dosePerHectare: '50 g kernel powder per 1 L water, 200 L/ha',
        applicationMethod: 'Whorl-directed spray, evening',
        interval: '5–7 days',
        phi: 0,
        estimatedCostZMW: 80,
        availability: 'Homemade from neem tree, widely grown in Zambia',
        safetyNote: 'Safe. Effective on young larvae only.',
        effectiveness: 'moderate',
      },
      {
        type: 'organic',
        product: 'Sand + lime whorl application',
        activeIngredient: 'Physical abrasive',
        dosePerHectare: '1 teaspoon per whorl',
        applicationMethod: 'Hand application into the whorl',
        interval: 'After each rain',
        phi: 0,
        estimatedCostZMW: 0,
        availability: 'Free — from any river',
        safetyNote: 'Safe, labor-intensive, works for small plots.',
        effectiveness: 'moderate',
      },
    ],
    culturalControls: [
      'Push-pull intercropping: maize + desmodium + napier grass.',
      'Deep ploughing after harvest to bury pupae.',
      'Early planting, uniform stands.',
      'Encourage natural enemies: earwigs, ladybirds, parasitic wasps.',
    ],
    prevention: [
      'Monitor with pheromone traps — 4 traps per hectare.',
      'Plant Bt maize where permitted.',
      'Rotate with legumes.',
    ],
    economicThreshold: 'Treat when 20% of whorl-stage plants have fresh damage or 2+ larvae per plant.',
    yieldLossIfUntreated: '20–50% grain yield reduction',
    spreadRisk: 'very high',
  },

  'Maize Streak Virus': {
    disease: 'Maize Streak Virus',
    pathogen: 'MSV — leafhopper-vectored',
    immediateActions: [
      'Remove and burn all severely affected plants immediately.',
      'Apply insecticide to control leafhopper vectors on remaining plants.',
      'Report to extension officer for regional monitoring.',
    ],
    chemicalOptions: [
      {
        type: 'chemical',
        product: 'Confidor 200 SL',
        activeIngredient: 'Imidacloprid 200 g/L',
        dosePerHectare: '0.5 L in 200 L water',
        applicationMethod: 'Foliar spray, targets leafhopper vector',
        interval: '10 days',
        phi: 14,
        estimatedCostZMW: 340,
        availability: 'Champion Agro, Farm Depot',
        safetyNote: 'Systemic — do not use near flowering.',
        effectiveness: 'good',
      },
    ],
    organicOptions: [
      {
        type: 'organic',
        product: 'Reflective silver mulch',
        activeIngredient: 'Physical repellent',
        dosePerHectare: 'Full field coverage',
        applicationMethod: 'Ground cover between rows',
        interval: 'Season-long',
        phi: 0,
        estimatedCostZMW: 800,
        availability: 'Specialty suppliers, Lusaka',
        safetyNote: 'Safe. Repels leafhoppers, reduces virus transmission.',
        effectiveness: 'good',
      },
    ],
    culturalControls: [
      'Plant MSV-resistant varieties: SC 719, Pan 53, ZMS 616.',
      'Plant early and uniformly to avoid peak leafhopper season.',
      'Remove volunteer maize that hosts virus.',
    ],
    prevention: [
      'Certified MSV-resistant seed only.',
      'Community-wide synchronized planting to break leafhopper cycle.',
      'Intercrop with legumes to reduce leafhopper landing.',
    ],
    economicThreshold: 'No threshold — virus cannot be cured. Remove infected plants immediately to reduce spread.',
    yieldLossIfUntreated: '30–90% yield loss in susceptible varieties',
    spreadRisk: 'very high',
  },

  /* ============================================================
     GROUNDNUT
     ============================================================ */
  'Groundnut Rosette Virus': {
    disease: 'Groundnut Rosette Virus',
    pathogen: 'GRV + GRAV — aphid-vectored',
    immediateActions: [
      'Rogue out (remove) stunted, yellowed, rosette plants — burn them.',
      'Apply aphidicide immediately to protect remaining plants.',
      'Increase plant density to compensate for removed plants.',
    ],
    chemicalOptions: [
      {
        type: 'chemical',
        product: 'Actara 25 WG',
        activeIngredient: 'Thiamethoxam 250 g/kg',
        dosePerHectare: '200 g in 200 L water',
        applicationMethod: 'Foliar spray, targets aphid vector',
        interval: '10 days, max 2 applications',
        phi: 14,
        estimatedCostZMW: 380,
        availability: 'Ozone Agro, ZAMSEED',
        safetyNote: 'Systemic aphidicide. Toxic to bees — avoid flowering period.',
        effectiveness: 'excellent',
      },
    ],
    organicOptions: [
      {
        type: 'organic',
        product: 'Neem oil + soap spray',
        activeIngredient: 'Azadirachtin + surfactants',
        dosePerHectare: '3 L neem + 1 kg soap in 200 L water',
        applicationMethod: 'Foliar spray every 7 days',
        interval: '7 days',
        phi: 0,
        estimatedCostZMW: 120,
        availability: 'Local market, homemade',
        safetyNote: 'Safe.',
        effectiveness: 'moderate',
      },
    ],
    culturalControls: [
      'Plant early in dense rows — reduces aphid landing.',
      'Plant in 40 cm × 10 cm spacing to create dense canopy.',
      'Use groundnut varieties with rosette resistance: CG7, MGV4, MGV5.',
      'Intercrop with maize at 2:1 or 3:1 — reduces aphid movement.',
    ],
    prevention: [
      'Certified rosette-resistant seed.',
      'Early, uniform planting across community.',
      'Remove volunteer groundnuts between seasons.',
    ],
    economicThreshold: 'Immediate — no threshold. Virus cannot be cured; prevention and vector control are key.',
    yieldLossIfUntreated: '50–100% in susceptible varieties',
    spreadRisk: 'very high',
  },

  /* ============================================================
     TOMATO
     ============================================================ */
  'Late Blight': {
    disease: 'Late Blight',
    pathogen: 'Phytophthora infestans',
    immediateActions: [
      'URGENT: Uproot and burn all infected plants today. Do not compost.',
      'Apply preventative fungicide to all remaining healthy plants within 4 hours.',
      'Stop overhead irrigation immediately.',
      'Do not walk through infected rows then healthy rows — spores spread on clothing.',
    ],
    chemicalOptions: [
      {
        type: 'chemical',
        product: 'Ridomil Gold MZ 68 WG',
        activeIngredient: 'Metalaxyl-M 40 g/kg + Mancozeb 640 g/kg',
        dosePerHectare: '2.5 kg in 200 L water',
        applicationMethod: 'Full canopy foliar spray with knapsack',
        interval: '7 days during disease pressure, otherwise 14 days',
        phi: 7,
        estimatedCostZMW: 520,
        availability: 'Champion Agro, Farm Depot, National Milling',
        safetyNote: 'Wear full PPE. Do not apply within 7 days of harvest.',
        effectiveness: 'excellent',
      },
      {
        type: 'chemical',
        product: 'Ridomil Gold SL',
        activeIngredient: 'Metalaxyl-M 480 g/L',
        dosePerHectare: '1.0 L in 200 L water',
        applicationMethod: 'Soil drench at plant base',
        interval: '14 days',
        phi: 14,
        estimatedCostZMW: 480,
        availability: 'Ozone Agro',
        safetyNote: 'Soil-applied — avoids leaf residue.',
        effectiveness: 'good',
      },
    ],
    organicOptions: [
      {
        type: 'organic',
        product: 'Copper oxychloride 50 WP',
        activeIngredient: 'Copper oxychloride 500 g/kg',
        dosePerHectare: '3 kg in 200 L water',
        applicationMethod: 'Foliar spray every 7–10 days',
        interval: '7 days',
        phi: 3,
        estimatedCostZMW: 260,
        availability: 'ZAMSEED, local agro-shops',
        safetyNote: 'Copper accumulates in soil — do not exceed 6 kg/ha/season.',
        effectiveness: 'good',
      },
      {
        type: 'organic',
        product: 'Bordeaux mixture (home-made)',
        activeIngredient: 'Copper sulfate + lime',
        dosePerHectare: '1 kg copper sulfate + 1 kg lime in 100 L water',
        applicationMethod: 'Foliar spray weekly',
        interval: '7 days',
        phi: 3,
        estimatedCostZMW: 120,
        availability: 'Ingredients at agro-shops',
        safetyNote: 'Mix in plastic or clay container, not metal.',
        effectiveness: 'moderate',
      },
    ],
    culturalControls: [
      'Stake plants for airflow, remove lower leaves to 30 cm.',
      'Drip irrigate instead of overhead.',
      'Plant resistant varieties: Roma VF, Tanya, Money Maker.',
      'Wider spacing: 60 cm between plants.',
    ],
    prevention: [
      'Preventative copper spray every 10 days in cool wet weather.',
      'Remove and burn all crop residue at season end.',
      'Rotate with cereals for 2 seasons.',
    ],
    economicThreshold: 'Immediate — no threshold. Act on first lesion.',
    yieldLossIfUntreated: '80–100% in days',
    spreadRisk: 'very high',
  },

  'Tomato Yellow Leaf Curl Virus': {
    disease: 'Tomato Yellow Leaf Curl Virus',
    pathogen: 'TYLCV — whitefly-vectored',
    immediateActions: [
      'Remove and burn infected plants.',
      'Apply whitefly control immediately.',
      'Install yellow sticky traps to monitor vector pressure.',
    ],
    chemicalOptions: [
      {
        type: 'chemical',
        product: 'Confidor 200 SL',
        activeIngredient: 'Imidacloprid 200 g/L',
        dosePerHectare: '0.5 L in 200 L water',
        applicationMethod: 'Foliar spray or soil drench at transplanting',
        interval: '10 days',
        phi: 14,
        estimatedCostZMW: 340,
        availability: 'Champion Agro, Farm Depot',
        safetyNote: 'Systemic. Toxic to bees.',
        effectiveness: 'good',
      },
      {
        type: 'chemical',
        product: 'Movento 150 OD',
        activeIngredient: 'Spirotetramat 150 g/L',
        dosePerHectare: '1.0 L in 200 L water',
        applicationMethod: 'Foliar spray targeting whitefly nymphs',
        interval: '14 days',
        phi: 7,
        estimatedCostZMW: 890,
        availability: 'Specialty order via Lusaka',
        safetyNote: 'Best-in-class whitefly control. Expensive.',
        effectiveness: 'excellent',
      },
    ],
    organicOptions: [
      {
        type: 'organic',
        product: 'Yellow sticky traps',
        activeIngredient: 'Physical trap',
        dosePerHectare: '20 traps/ha',
        applicationMethod: 'Hang at plant top, replace every 3 weeks',
        interval: '3 weeks',
        phi: 0,
        estimatedCostZMW: 60,
        availability: 'Agro-shops',
        safetyNote: 'Safe. Monitoring and mass-trapping.',
        effectiveness: 'moderate',
      },
      {
        type: 'organic',
        product: 'Neem oil + kaolin clay',
        activeIngredient: 'Azadirachtin + kaolin',
        dosePerHectare: '3 L neem + 5 kg kaolin in 200 L water',
        applicationMethod: 'Foliar spray weekly',
        interval: '7 days',
        phi: 0,
        estimatedCostZMW: 180,
        availability: 'Agro-shops, some free',
        safetyNote: 'Safe. Repels whitefly, does not kill them.',
        effectiveness: 'moderate',
      },
    ],
    culturalControls: [
      'Use insect-proof netting (40 mesh) for seedling nurseries.',
      'Intercrop with maize as a barrier crop.',
      'Remove weed hosts: black nightshade, Datura.',
    ],
    prevention: [
      'Plant TYLCV-resistant varieties: Tengeru 2010, Tanya, Assila.',
      'Use reflective silver mulch.',
      'Rogue out infected plants early.',
    ],
    economicThreshold: 'Immediate on first sign. No recovery once infected.',
    yieldLossIfUntreated: '50–100%',
    spreadRisk: 'very high',
  },

  /* ============================================================
     CASSAVA
     ============================================================ */
  'Cassava Mosaic Disease': {
    disease: 'Cassava Mosaic Disease',
    pathogen: 'CMD — whitefly-vectored + infected cuttings',
    immediateActions: [
      'Rogue out severely affected plants (mosaic, distorted leaves).',
      'Do not take cuttings from infected plants for next season.',
      'Control whiteflies to reduce spread to healthy plants.',
    ],
    chemicalOptions: [
      {
        type: 'chemical',
        product: 'Confidor 200 SL',
        activeIngredient: 'Imidacloprid 200 g/L',
        dosePerHectare: '0.5 L in 200 L water',
        applicationMethod: 'Foliar spray on young plants, targets whitefly',
        interval: '14 days, max 2 applications',
        phi: 30,
        estimatedCostZMW: 340,
        availability: 'Champion Agro',
        safetyNote: 'Do not use on cassava intended for leaves (vegetable).',
        effectiveness: 'moderate',
      },
    ],
    organicOptions: [
      {
        type: 'organic',
        product: 'Neem oil + soap',
        activeIngredient: 'Azadirachtin',
        dosePerHectare: '3 L + 1 kg soap in 200 L water',
        applicationMethod: 'Foliar spray every 10 days',
        interval: '10 days',
        phi: 0,
        estimatedCostZMW: 120,
        availability: 'Local, homemade',
        safetyNote: 'Safe.',
        effectiveness: 'moderate',
      },
    ],
    culturalControls: [
      'Plant CMD-resistant varieties: Mweru, Chila, Safari, Kalawe.',
      'Use certified disease-free cuttings from ZARI or cooperative nurseries.',
      'Remove volunteer cassava that harbors virus.',
      'Community-wide roguing to break the cycle.',
    ],
    prevention: [
      'Source cuttings only from certified CMD-free mother plants.',
      'Treat cuttings with hot water (50°C for 10 minutes) before planting.',
      'Intercrop with maize or legumes to disrupt whitefly movement.',
    ],
    economicThreshold: 'Immediate on first appearance. No cure.',
    yieldLossIfUntreated: '40–70% root yield reduction',
    spreadRisk: 'very high',
  },

  /* ============================================================
     BANANA
     ============================================================ */
  'Panama Disease (Fusarium Wilt)': {
    disease: 'Panama Disease (Fusarium Wilt)',
    pathogen: 'Fusarium oxysporum f. sp. cubense (FOC)',
    immediateActions: [
      'QUARANTINE the affected area — do not move soil, tools, or suckers.',
      'Uproot and burn entire infected mats (all suckers, corm, roots).',
      'Disinfect tools (hoe, machete) with 10% bleach between plants.',
      'Report to Ministry of Agriculture — FOC Tropical Race 4 is a national emergency.',
    ],
    chemicalOptions: [
      {
        type: 'chemical',
        product: 'None effective',
        activeIngredient: 'FOC is soilborne and cannot be cured chemically',
        dosePerHectare: 'N/A',
        applicationMethod: 'N/A',
        interval: 'N/A',
        phi: 0,
        estimatedCostZMW: 0,
        availability: 'N/A',
        safetyNote: 'No chemical cure exists. Prevention is the only strategy.',
        effectiveness: 'moderate',
      },
    ],
    organicOptions: [
      {
        type: 'organic',
        product: 'Soil solarization',
        activeIngredient: 'Solar heat',
        dosePerHectare: 'Cover affected area with clear plastic for 6 weeks',
        applicationMethod: 'Full sun, wet soil, transparent polyethylene',
        interval: 'Once before replanting',
        phi: 0,
        estimatedCostZMW: 400,
        availability: 'Plastic sheeting at hardware stores',
        safetyNote: 'Safe. Kills pathogen in topsoil.',
        effectiveness: 'moderate',
      },
      {
        type: 'organic',
        product: 'Trichoderma harzianum biocontrol',
        activeIngredient: 'Trichoderma spores',
        dosePerHectare: '5 kg mixed into planting holes',
        applicationMethod: 'Apply at planting and 3 months after',
        interval: 'Every 3 months',
        phi: 0,
        estimatedCostZMW: 350,
        availability: 'Specialty suppliers, NGO programs',
        safetyNote: 'Safe. Suppresses FOC in soil.',
        effectiveness: 'moderate',
      },
    ],
    culturalControls: [
      'Plant resistant varieties: FHIA-01, FHIA-17, FHIA-25.',
      'Use clean tissue-culture plantlets only.',
      'Do not plant banana on old banana land.',
      'Footwear disinfection at field entrance.',
    ],
    prevention: [
      'Strict quarantine if TR4 is suspected — contact Ministry immediately.',
      'Plant in virgin soil or after 5+ years of non-banana rotation.',
      'Avoid planting susceptible Cavendish varieties.',
    ],
    economicThreshold: 'Immediate. One infected plant = destroy whole mat.',
    yieldLossIfUntreated: '100% over 3–5 years',
    spreadRisk: 'very high',
  },

  /* ============================================================
     FALLBACK for unlisted diseases
     ============================================================ */
};

/**
 * Fetch a treatment plan. Falls back to a generic plan if not in DB.
 */
export function getTreatmentPlan(diseaseName: string): DiseaseTreatmentPlan {
  // Try exact match
  if (TREATMENT_PLANS[diseaseName]) return TREATMENT_PLANS[diseaseName];

  // Try fuzzy match on common names
  const lower = diseaseName.toLowerCase();
  for (const [key, plan] of Object.entries(TREATMENT_PLANS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return plan;
    }
  }

  // Generic fallback
  return {
    disease: diseaseName,
    pathogen: 'Unknown',
    immediateActions: [
      'Isolate and photograph the affected plant.',
      'Rogue out (remove) severely infected plants.',
      'Consult your local extension officer for confirmation.',
    ],
    chemicalOptions: [
      {
        type: 'chemical',
        product: 'Consult extension officer',
        activeIngredient: 'Requires diagnosis',
        dosePerHectare: 'N/A',
        applicationMethod: 'N/A',
        interval: 'N/A',
        phi: 0,
        estimatedCostZMW: 0,
        availability: 'N/A',
        safetyNote: 'Do not apply any chemical without proper diagnosis.',
        effectiveness: 'moderate',
      },
    ],
    organicOptions: [
      {
        type: 'organic',
        product: 'Copper oxychloride 50 WP',
        activeIngredient: 'Copper oxychloride',
        dosePerHectare: '3 kg in 200 L water',
        applicationMethod: 'Broad-spectrum foliar spray',
        interval: '7–10 days',
        phi: 3,
        estimatedCostZMW: 260,
        availability: 'ZAMSEED, local agro-shops',
        safetyNote: 'General-purpose fungicide. Test on small area first.',
        effectiveness: 'moderate',
      },
    ],
    culturalControls: [
      'Remove infected plant debris.',
      'Improve field airflow and drainage.',
      'Rotate to non-host crops next season.',
    ],
    prevention: [
      'Use certified seed or planting material.',
      'Maintain balanced soil fertility.',
      'Practice crop rotation.',
    ],
    economicThreshold: 'Consult extension officer.',
    yieldLossIfUntreated: 'Variable — depends on disease.',
    spreadRisk: 'moderate',
  };
}

/**
 * Estimate total cost of treating 1 hectare with the recommended plan.
 */
export function estimateTreatmentCost(diseaseName: string, hectares: number = 1): {
  chemical: number;
  organic: number;
  recommended: number;
} {
  const plan = getTreatmentPlan(diseaseName);
  const chemicalMin = Math.min(...plan.chemicalOptions.map(o => o.estimatedCostZMW).filter(c => c > 0), Infinity);
  const organicMin = Math.min(...plan.organicOptions.map(o => o.estimatedCostZMW).filter(c => c > 0), Infinity);

  return {
    chemical: isFinite(chemicalMin) ? chemicalMin * hectares : 0,
    organic: isFinite(organicMin) ? organicMin * hectares : 0,
    recommended: isFinite(organicMin) ? organicMin * hectares : (isFinite(chemicalMin) ? chemicalMin * hectares : 0),
  };
}
