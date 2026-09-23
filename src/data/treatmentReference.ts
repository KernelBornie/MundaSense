export interface TreatmentOption {
  type: 'chemical' | 'organic' | 'cultural' | 'biological';
  product: string;
  activeIngredient: string;
  dosePerHectare: string;
  applicationMethod: string;
  interval: string;
  phi: number;
  estimatedCostZMW: number;
  availability: string;
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

export const ZAMBIAN_AGRO_DEALERS = [
  { name: 'Msekera Cooperative Depot', location: 'Chipata, Eastern', phone: '+260970000100' },
  { name: 'Champion Agro', location: 'Lusaka + regional', phone: '+260970000101' },
  { name: 'Ozone Agro', location: 'Lusaka + Chipata', phone: '+260970000102' },
  { name: 'Farm Depot', location: 'Multiple provinces', phone: '+260970000103' },
  { name: 'ZAMSEED Outlets', location: 'National', phone: '+260970000104' },
  { name: 'National Milling Agri-Stores', location: 'Lusaka + Copperbelt', phone: '+260970000105' },
];

export const SAFETY_GUIDELINES = [
  'Always wear gloves, mask, and long sleeves when applying chemicals.',
  'Never eat, drink, or smoke during application.',
  'Spray in early morning or late afternoon — never in midday heat.',
  'Wash hands and clothes thoroughly after each application.',
  'Keep all chemicals out of reach of children.',
  'Never mix chemicals in food containers.',
  'Observe pre-harvest intervals (PHI) strictly before eating or selling.',
  'Dispose of empty containers safely — never reuse for water.',
];
