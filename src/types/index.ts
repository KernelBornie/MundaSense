export type Role = 'admin' | 'farmer' | 'seller' | 'customer' | 'transporter';

export type HealthStatus = 'healthy' | 'watch' | 'alert';
export type RiskLevel = 'LOW' | 'WATCH' | 'HIGH';

export type Province =
  | 'Central'
  | 'Copperbelt'
  | 'Eastern'
  | 'Luapula'
  | 'Lusaka'
  | 'Muchinga'
  | 'Northern'
  | 'North-Western'
  | 'Southern'
  | 'Western';

export type CropType =
  | 'Maize'
  | 'Groundnuts'
  | 'Soybeans'
  | 'Sunflower'
  | 'Cotton'
  | 'Cassava'
  | 'Sorghum'
  | 'Millet'
  | 'Wheat'
  | 'Rice'
  | 'Coffee'
  | 'Beans'
  | 'Tea'
  | 'Other';

export interface User {
  id: number;
  email: string;
  phone: string;
  full_name: string;
  role: Role;
  village?: string;
  district?: string;
  province?: Province;
  ziamis_id?: string;
  language: string;
}

export interface SensorHub {
  id: number;
  hub_code: string;
  name: string;
  province: Province;
  district: string;
  latitude: number;
  longitude: number;
  coverage_radius_km: number;
  battery: number;
  battery_voltage?: number;
  solar_v: number;
  solar_input_voltage?: number;
  signal_dbm: number;
  gsm_signal_dbm?: number;
  farms_count?: number;
  uptime_h: number;
  last_seen: string;
}

export interface SensorReading {
  id: number;
  hub_id: number;
  soil_moisture_15cm: number;
  soil_moisture_30cm: number;
  soil_moisture_60cm: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  recorded_at: string;
}

export interface Farm {
  id: number;
  farmer_id: number;
  hub_id: number;
  ziamis_id: string;
  name: string;
  phone: string;
  village: string;
  district: string;
  province: Province;
  latitude: number;
  longitude: number;
  crop: CropType;
  crop_stage: string;
  soil_type: string;
  area_hectares: number;
  soil_moisture: number;
  health_status: HealthStatus;
  disease_risk: RiskLevel;
  language: string;
  created_at: string;
}

export type AdvisoryCategory = 'Irrigation' | 'Pest' | 'Disease' | 'Weather' | 'Storage' | 'Market';

export interface Advisory {
  id: number;
  farm_id: number;
  farm_name: string;
  village: string;
  province: Province;
  crop: CropType;
  channel: 'SMS' | 'USSD' | 'IVR' | 'WEB';
  category: AdvisoryCategory;
  message: string;
  language: string;
  status: 'queued' | 'sent' | 'delivered';
  created_at: string;
}

export interface CropHealthReport {
  id: number;
  farm_id: number;
  farm_name?: string;
  image_url: string;
  crop: string;
  predicted_disease: string;
  confidence: number;
  severity: 'none' | 'low' | 'moderate' | 'high' | 'unknown';
  risk_level: RiskLevel;
  symptoms: string;
  recommendation: string;
  needs_expert_review: boolean;
  reviewed_by_officer: boolean;
  created_at: string;
}

export interface StorageUnit {
  id: number;
  name: string;
  location: string;
  province: Province;
  crop: CropType;
  bags: number;
  capacity: number;
  capacity_bags?: number;
  grain_moisture: number;
  moisture_percent?: number;
  temperature: number;
  temperature_c?: number;
  air_humidity: number;
  humidity_percent?: number;
  status: 'ok' | 'watch' | 'critical';
  aflatoxin_risk?: 'LOW' | 'WATCH' | 'HIGH';
  updated_at: string;
}

export interface MarketplaceListing {
  id: number;
  seller_id: number;
  seller_name: string;
  crop: CropType;
  variety?: string;
  grade: string;
  quantity_kg: number;
  price_per_kg_zmw: number;
  village: string;
  district: string;
  province: Province;
  description: string;
  thumbnail_url?: string;
  status: 'available' | 'reserved' | 'sold';
  created_at: string;
}

export interface Order {
  id: number;
  listing_id: number;
  crop: CropType;
  buyer_id: number;
  buyer_name: string;
  seller_name: string;
  quantity_kg: number;
  total_zmw: number;
  delivery_address: string;
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface TransportRequest {
  id: number;
  customer_id?: number;
  customer_name?: string;
  requester_id?: number;
  requester_name?: string;
  requester_phone?: string;
  order_id?: number;
  crop?: string;
  pickup_location: string;
  dropoff_location: string;
  cargo_description?: string;
  weight_kg: number;
  pickup_date?: string;
  budget_zmw: number;
  status: 'open' | 'assigned' | 'in_transit' | 'delivered';
  created_at: string;
}

export interface TransportBid {
  id: number;
  request_id: number;
  transporter_id: number;
  transporter_name: string;
  transporter_phone: string;
  price_zmw: number;
  vehicle?: string;
  vehicle_type?: string;
  eta_hours: number;
  note?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface SMSMessage {
  id: number;
  phone: string;
  direction: 'in' | 'out';
  message: string;
  category: string;
  status: 'sent' | 'delivered' | 'received';
  created_at: string;
}

export interface SystemStats {
  totalFarms: number;
  healthyFarms: number;
  watchFarms: number;
  alertFarms: number;
  avgSoilMoisture: number;
  diseaseRiskOverview: RiskLevel;
  storageAlerts: number;
  openOrders: number;
  transportRequests: number;
  provinces: Record<Province, number>;
}
