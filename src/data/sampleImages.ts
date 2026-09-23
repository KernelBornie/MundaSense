import { RiskLevel } from '../types';

export interface SampleLeaf {
  id: string;
  name: string;
  crop: string;
  disease: string;
  imageUrl: string;
  expectedConfidence: number;
  expectedSeverity: 'none' | 'low' | 'moderate' | 'high' | 'unknown';
  expectedRisk: RiskLevel;
  symptoms: string;
  recommendation: string;
  needsExpertReview?: boolean;
}

export const SAMPLE_LEAVES: SampleLeaf[] = [
  {
    id: 'sample-maize-nclb',
    name: 'Maize: Northern Corn Leaf Blight',
    crop: 'Maize',
    disease: 'Northern Corn Leaf Blight (Exserohilum turcicum)',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%232d4427" width="400" height="300"/><path d="M50 150 C 120 40, 280 40, 350 150 C 280 260, 120 260, 50 150" fill="%23437335"/><path d="M120 130 C 140 120, 180 125, 210 135 C 180 145, 140 140, 120 130" fill="%23856d48"/><path d="M220 150 C 240 142, 280 145, 300 155 C 280 165, 240 160, 220 150" fill="%23856d48"/></svg>',
    expectedConfidence: 0.88,
    expectedSeverity: 'moderate',
    expectedRisk: 'WATCH',
    symptoms: 'Elongated greyish-green elliptical lesions parallel to leaf margins, turning tan as tissues desiccate.',
    recommendation: 'Remove heavily affected lower foliage. Apply azoxystrobin or propiconazole fungicide if lesion reaches ear leaf.',
    needsExpertReview: false,
  },
  {
    id: 'sample-maize-rust',
    name: 'Maize: Common Rust',
    crop: 'Maize',
    disease: 'Common Rust (Puccinia sorghi)',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%23243920" width="400" height="300"/><path d="M50 150 C 120 50, 280 50, 350 150 C 280 250, 120 250, 50 150" fill="%233e6931"/><circle cx="160" cy="130" r="7" fill="%23b8531d"/><circle cx="190" cy="140" r="6" fill="%23b8531d"/><circle cx="230" cy="125" r="8" fill="%23b8531d"/><circle cx="250" cy="155" r="7" fill="%23b8531d"/></svg>',
    expectedConfidence: 0.92,
    expectedSeverity: 'high',
    expectedRisk: 'HIGH',
    symptoms: 'Small, circular to elongate reddish-brown pustules erupting across upper and lower leaf surfaces.',
    recommendation: 'Alert local agro-extension officer. Apply triazole-based fungicide before canopy closure.',
    needsExpertReview: false,
  },
  {
    id: 'sample-groundnut-leafspot',
    name: 'Groundnut: Early Leaf Spot',
    crop: 'Groundnuts',
    disease: 'Early Leaf Spot (Cercospora arachidicola)',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%231a2e18" width="400" height="300"/><ellipse cx="200" cy="150" rx="140" ry="90" fill="%233b6e2d"/><circle cx="150" cy="130" r="14" fill="%234a2e12"/><circle cx="150" cy="130" r="18" stroke="%23dfbf3d" stroke-width="3" fill="none"/><circle cx="220" cy="160" r="12" fill="%234a2e12"/><circle cx="220" cy="160" r="16" stroke="%23dfbf3d" stroke-width="3" fill="none"/></svg>',
    expectedConfidence: 0.85,
    expectedSeverity: 'moderate',
    expectedRisk: 'WATCH',
    symptoms: 'Sub-circular dark brown necrotic spots encircled by a distinct bright yellow halo on upper leaf surfaces.',
    recommendation: 'Apply chlorothalonil or mancozeb at first sign of leaf spots. Maintain crop rotation with cereals.',
    needsExpertReview: false,
  },
  {
    id: 'sample-maize-healthy',
    name: 'Maize: Healthy Canopy',
    crop: 'Maize',
    disease: 'Healthy Canopy (No Pathogens Detected)',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%23152614" width="400" height="300"/><path d="M40 150 C 120 30, 280 30, 360 150 C 280 270, 120 270, 40 150" fill="%232e7d32"/><line x1="40" y1="150" x2="360" y2="150" stroke="%234caf50" stroke-width="4"/></svg>',
    expectedConfidence: 0.96,
    expectedSeverity: 'none',
    expectedRisk: 'LOW',
    symptoms: 'Vibrant green coloration with intact cellular margins and uniform vascular distribution.',
    recommendation: 'No chemical intervention required. Continue standard vegetative scouting and moisture management.',
    needsExpertReview: false,
  },
];
