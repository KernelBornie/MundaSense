export interface SampleLeaf {
  id: string;
  name: string;
  crop: 'Maize' | 'Tomato' | 'Soybean' | 'Groundnut';
  disease: string;
  expectedConfidence: number;
  expectedSeverity: 'none' | 'low' | 'moderate' | 'high' | 'unknown';
  expectedRisk: 'LOW' | 'WATCH' | 'HIGH';
  symptoms: string;
  recommendation: string;
  needsExpertReview: boolean;
  accentColor: string;
  description: string;
}

export const SAMPLE_LEAVES: SampleLeaf[] = [
  {
    id: 'sample-maize-blight',
    name: 'Maize Northern Leaf Blight',
    crop: 'Maize',
    disease: 'Northern Corn Leaf Blight (Exserohilum turcicum)',
    expectedConfidence: 0.87,
    expectedSeverity: 'moderate',
    expectedRisk: 'WATCH',
    symptoms: 'Distinct elongated greyish-green to tan cigar-shaped lesions (3–15 cm) extending parallel to leaf veins.',
    recommendation: 'Inspect surrounding plants. Remove severely affected lower foliage to curb spore dispersal. Request extension officer verification.',
    needsExpertReview: false,
    accentColor: '#b45309',
    description: 'Field photo captured at Msekera Research Station after heavy overcast week.',
  },
  {
    id: 'sample-maize-rust',
    name: 'Maize Common Rust',
    crop: 'Maize',
    disease: 'Common Rust (Puccinia sorghi)',
    expectedConfidence: 0.91,
    expectedSeverity: 'high',
    expectedRisk: 'HIGH',
    symptoms: 'Numerous small, powdery cinnamon-brown pustules erupting across both upper and lower leaf surfaces with surrounding chlorosis.',
    recommendation: 'Urgent: Apply approved strobilurin or triazole fungicide if spreading to ear leaf during grain fill. Alert cooperative extension officer.',
    needsExpertReview: false,
    accentColor: '#dc2626',
    description: 'Common airborne fungal infection prevalent in humid cool mornings of Eastern Province.',
  },
  {
    id: 'sample-maize-gray-spot',
    name: 'Maize Gray Leaf Spot',
    crop: 'Maize',
    disease: 'Gray Leaf Spot (Cercospora zeae-maydis)',
    expectedConfidence: 0.84,
    expectedSeverity: 'moderate',
    expectedRisk: 'WATCH',
    symptoms: 'Narrow, rectangular tan to gray lesions sharply delimited by lateral leaf veins, forming distinct blocky patterns.',
    recommendation: 'Plan crop rotation with pulses for next season. Avoid leaving untilled residue on infected plots. Monitor upper canopy.',
    needsExpertReview: false,
    accentColor: '#d97706',
    description: 'Characteristic blocky lesions bounded by parallel veins.',
  },
  {
    id: 'sample-maize-armyworm',
    name: 'Fall Armyworm Feeding Damage',
    crop: 'Maize',
    disease: 'Fall Armyworm (Spodoptera frugiperda)',
    expectedConfidence: 0.89,
    expectedSeverity: 'high',
    expectedRisk: 'HIGH',
    symptoms: 'Ragged windowpane leaf chewing, pinhole perforations, and sawdust-like moist brown frass packed deep in the central whorl.',
    recommendation: 'Immediately scout 20 plants across 5 spots in the field. Apply bio-rational neem extract or approved pheromone traps; consult extension officer.',
    needsExpertReview: false,
    accentColor: '#ef4444',
    description: 'Destructive pest damage common across Zambian smallholder maize fields.',
  },
  {
    id: 'sample-maize-healthy',
    name: 'Healthy Maize Canopy',
    crop: 'Maize',
    disease: 'Healthy / No Disease Detected',
    expectedConfidence: 0.95,
    expectedSeverity: 'none',
    expectedRisk: 'LOW',
    symptoms: 'Uniform deep green chlorophyll pigmentation, intact cuticle, no fungal pustules, necrotic spots, or pest chewing.',
    recommendation: 'No action required. Maintain balanced topdressing fertilizer (Urea / CAN) and monitor weekly.',
    needsExpertReview: false,
    accentColor: '#16a34a',
    description: 'Vigorous vegetative maize leaf with clear vascular bundle lines.',
  },
  {
    id: 'sample-tomato-early-blight',
    name: 'Tomato Early Blight',
    crop: 'Tomato',
    disease: 'Early Blight (Alternaria solani)',
    expectedConfidence: 0.82,
    expectedSeverity: 'moderate',
    expectedRisk: 'WATCH',
    symptoms: 'Concentric dark brown bullseye target-pattern rings on mature lower leaves with surrounding chlorotic halo.',
    recommendation: 'Strip off infected bottom leaves up to 30cm off the ground. Avoid overhead watering to keep foliage dry. Apply copper-based protectant.',
    needsExpertReview: false,
    accentColor: '#ea580c',
    description: 'Frequent foliar disease affecting horticultural plots along the Chongwe river basin.',
  },
  {
    id: 'sample-tomato-late-blight',
    name: 'Tomato Late Blight (Urgent)',
    crop: 'Tomato',
    disease: 'Late Blight (Phytophthora infestans)',
    expectedConfidence: 0.88,
    expectedSeverity: 'high',
    expectedRisk: 'HIGH',
    symptoms: 'Rapidly expanding water-soaked greasy olive-brown lesions with fuzzy white mildew sporulation on the underside.',
    recommendation: 'URGENT: Highly infectious oomycete pathogen. Remove and bury infected plants immediately. Spray systemic fungicide across entire plot today.',
    needsExpertReview: true,
    accentColor: '#b91c1c',
    description: 'High devastation risk during prolonged misty weather.',
  },
  {
    id: 'sample-unknown-leaf',
    name: 'Atypical Lesion (Low Confidence)',
    crop: 'Maize',
    disease: 'Unknown / Low Confidence Lesion',
    expectedConfidence: 0.54,
    expectedSeverity: 'unknown',
    expectedRisk: 'WATCH',
    symptoms: 'Irregular marginal chlorosis and sun-scorch with non-specific necrotic tissue, possible mechanical injury or nutrient imbalance.',
    recommendation: 'AI screening confidence is below diagnostic threshold (54%). Do not spray blindly. Physical extension officer inspection required.',
    needsExpertReview: true,
    accentColor: '#8b5cf6',
    description: 'Demonstrates safe failure behavior: escalates to human officer rather than hallucinatory diagnosis.',
  },
];
