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
