export interface CropInfo {
  crop: string;
  diseases: string[];
}

export const CROP_DISEASE_DB: CropInfo[] = [
  { crop: 'Maize', diseases: ['Northern Corn Leaf Blight', 'Common Rust', 'Gray Leaf Spot', 'Fall Armyworm', 'Maize Streak Virus', 'Southern Corn Leaf Blight', 'Healthy'] },
  { crop: 'Groundnuts', diseases: ['Early Leaf Spot', 'Late Leaf Spot', 'Groundnut Rust', 'Groundnut Rosette', 'Collar Rot', 'Healthy'] },
  { crop: 'Soybeans', diseases: ['Soybean Rust', 'Bacterial Pustule', 'Frogeye Leaf Spot', 'Soybean Mosaic Virus', 'Healthy'] },
  { crop: 'Sunflower', diseases: ['Downy Mildew', 'Rust', 'Alternaria Leaf Spot', 'Head Rot', 'Healthy'] },
  { crop: 'Cotton', diseases: ['Bacterial Blight', 'Verticillium Wilt', 'Fusarium Wilt', 'Bollworm', 'Healthy'] },
  { crop: 'Tomato', diseases: ['Early Blight', 'Late Blight', 'Bacterial Spot', 'Tomato Yellow Leaf Curl Virus', 'Tomato Mosaic Virus', 'Leaf Mold', 'Healthy'] },
  { crop: 'Cassava', diseases: ['Cassava Mosaic Disease', 'Brown Streak', 'Bacterial Blight', 'Healthy'] },
  { crop: 'Banana', diseases: ['Panama Disease', 'Black Sigatoka', 'Bunchy Top Virus', 'Healthy'] },
  { crop: 'Sorghum', diseases: ['Anthracnose', 'Head Smut', 'Grain Mold', 'Healthy'] },
  { crop: 'Rice', diseases: ['Rice Blast', 'Bacterial Leaf Blight', 'Brown Spot', 'Healthy'] },
  { crop: 'Cowpea', diseases: ['Cowpea Mosaic Virus', 'Bacterial Blight', 'Healthy'] },
  { crop: 'Bambara', diseases: ['Leaf Spot', 'Healthy'] },
  { crop: 'Potato', diseases: ['Late Blight', 'Early Blight', 'Bacterial Wilt', 'Healthy'] },
  { crop: 'Onion', diseases: ['Purple Blotch', 'Downy Mildew', 'Neck Rot', 'Healthy'] },
  { crop: 'Cabbage', diseases: ['Black Rot', 'Diamondback Moth', 'Clubroot', 'Healthy'] },
  { crop: 'Citrus', diseases: ['Citrus Greening (HLB)', 'Citrus Canker', 'Black Spot', 'Healthy'] },
  { crop: 'Mango', diseases: ['Anthracnose', 'Powdery Mildew', 'Bacterial Black Spot', 'Healthy'] },
  { crop: 'Papaya', diseases: ['Papaya Ringspot Virus', 'Powdery Mildew', 'Anthracnose', 'Healthy'] },
  { crop: 'Wheat', diseases: ['Stem Rust', 'Leaf Rust', 'Septoria Leaf Blotch', 'Healthy'] },
  { crop: 'Beans', diseases: ['Bean Common Mosaic Virus', 'Angular Leaf Spot', 'Rust', 'Healthy'] },
  { crop: 'Sweet Potato', diseases: ['Sweet Potato Virus Disease', 'Weevil Damage', 'Healthy'] },
];

export function getCropNames(): string[] {
  return CROP_DISEASE_DB.map((c) => c.crop);
}

export function getDiseasesForCrop(crop: string): string[] {
  return CROP_DISEASE_DB.find((c) => c.crop === crop)?.diseases || [];
}
