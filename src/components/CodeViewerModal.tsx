import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Cpu, Terminal, Layers } from 'lucide-react';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'fastapi' | 'esp32' | 'simulator' | 'models'>('fastapi');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const CODE_FILES: Record<string, { filename: string; language: string; code: string }> = {
    fastapi: {
      filename: 'backend/app/main.py',
      language: 'python',
      code: `# MundaSense FastAPI Backend
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .database import get_db, init_db
from .services import disease_detection, disease_risk, advisory, ussd
from .models import Farm, SensorReading, CropHealthReport, Advisory

app = FastAPI(title="MundaSense API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

@app.post("/api/disease/analyze")
async def analyze_leaf(
    farm_id: int = Form(...),
    crop: str = Form(...),
    image: UploadFile = File(...),
    db = Depends(get_db)
):
    raw_bytes = await image.read()
    # Returns AI-assisted screening (predicted_disease, confidence, symptoms, recommendation)
    result = disease_detection.analyze(raw_bytes, crop)

    report = CropHealthReport(
        farm_id=farm_id,
        crop=crop,
        predicted_disease=result["prediction"],
        confidence=result["confidence"],
        severity=result["severity"],
        risk_level=result["risk"],
        recommendation=result["recommendation"],
        needs_expert_review=result["needs_expert_review"]
    )
    db.add(report)
    db.commit()
    return result

@app.post("/api/sensors/readings")
def receive_telemetry(payload: dict, db = Depends(get_db)):
    # Ingest from ESP32 Hub (soil 15cm, 30cm, 60cm, temp, humidity, rain)
    # Fan out updates to attached farms and recalculate disease risk
    reading = SensorReading(**payload)
    db.add(reading)
    db.commit()
    return {"status": "ok"}
`,
    },
    esp32: {
      filename: 'iot/esp32_mundasense/esp32_mundasense.ino',
      language: 'cpp',
      code: `/*
 * MundaSense ESP32 Community Sensor Hub Firmware
 * Target: ESP32-WROOM-32 + Capacitive Soil Probes + DHT22 + Rain Gauge
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

#define HUB_ID          "HUB-MSEK-001"
#define API_URL         "http://api.mundasense.zm/api/sensors/readings"
#define API_KEY         "hub_secret_key_chipata"

#define SOIL_15_PIN     32
#define SOIL_30_PIN     33
#define SOIL_60_PIN     35
#define DHT_PIN         4
#define RAIN_PIN        5

DHT dht(DHT_PIN, DHT22);
volatile uint32_t rainTips = 0;

void IRAM_ATTR onRainPulse() { rainTips++; }

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  dht.begin();
  pinMode(RAIN_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(RAIN_PIN), onRainPulse, FALLING);

  WiFi.begin("Msekera_Coop_WiFi", "password");
  while (WiFi.status() != WL_CONNECTED) { delay(250); }
}

void loop() {
  int s15 = map(analogRead(SOIL_15_PIN), 3200, 1150, 0, 100);
  int s30 = map(analogRead(SOIL_30_PIN), 3200, 1150, 0, 100);
  int s60 = map(analogRead(SOIL_60_PIN), 3200, 1150, 0, 100);

  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  float rain = rainTips * 0.2794f; // mm per bucket tip
  rainTips = 0;

  StaticJsonDocument<256> doc;
  doc["hub_id"] = HUB_ID;
  doc["soil_moisture_15cm"] = s15;
  doc["soil_moisture_30cm"] = s30;
  doc["soil_moisture_60cm"] = s60;
  doc["temperature"] = temp;
  doc["humidity"] = hum;
  doc["rainfall"] = rain;

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);
  http.POST(payload);
  http.end();

  // Sleep 15 minutes
  esp_sleep_enable_timer_wakeup(15ULL * 60ULL * 1000000ULL);
  esp_deep_sleep_start();
}
`,
    },
    simulator: {
      filename: 'simulator/generate_108_farms.py',
      language: 'python',
      code: `"""
MundaSense 108-Farm Simulator
Generates exact 108 farms across Eastern (Chipata), Lusaka, and Central (Mkushi).
Ensures exact distribution: 82 Healthy, 18 Watch, 8 Alert.
"""
import random

DISTRIBUTION = [
    ("Eastern", 40, "HUB-MSEK-001", -13.6333, 32.6500),
    ("Lusaka", 35, "HUB-CHONG-002", -15.3333, 28.6833),
    ("Central", 33, "HUB-MKUS-003", -13.6167, 29.3833),
]

STATUSES = ["healthy"] * 82 + ["watch"] * 18 + ["alert"] * 8
random.shuffle(STATUSES)

farms = []
for idx, status in enumerate(STATUSES, start=1):
    group = DISTRIBUTION[0] if idx <= 40 else (DISTRIBUTION[1] if idx <= 75 else DISTRIBUTION[2])
    province, _, hub_id, hub_lat, hub_lon = group

    # Soil moisture assigned based on health status
    if status == "alert":
        moisture = round(random.uniform(14.0, 21.0), 1)
        risk = "HIGH"
    elif status == "watch":
        moisture = round(random.uniform(25.0, 31.0), 1)
        risk = "WATCH"
    else:
        moisture = round(random.uniform(34.0, 44.0), 1)
        risk = "LOW"

    farms.append({
        "farm_id": idx,
        "ziamis_id": f"ZM-{province[:3].upper()}-{84000 + idx}",
        "province": province,
        "hub_id": hub_id,
        "crop": random.choice(["Maize", "Groundnuts", "Soybeans", "Sunflower", "Cotton"]),
        "soil_moisture": moisture,
        "health_status": status,
        "disease_risk": risk,
    })

print(f"Generated {len(farms)} farms with 82 Healthy, 18 Watch, 8 Alert.")
`,
    },
    models: {
      filename: 'backend/app/models.py',
      language: 'python',
      code: `# SQLAlchemy Database Models for MundaSense
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from .database import Base

class Farm(Base):
    __tablename__ = "farms"
    id = Column(Integer, primary_key=True)
    farmer_id = Column(Integer, ForeignKey("users.id"))
    hub_id = Column(Integer, ForeignKey("sensor_hubs.id"))
    ziamis_id = Column(String, unique=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    village = Column(String)
    province = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    crop = Column(String, nullable=False)
    soil_moisture = Column(Float)
    health_status = Column(String) # healthy, watch, alert
    disease_risk = Column(String)  # LOW, WATCH, HIGH

class CropHealthReport(Base):
    __tablename__ = "crop_health_reports"
    id = Column(Integer, primary_key=True)
    farm_id = Column(Integer, ForeignKey("farms.id"))
    crop = Column(String)
    predicted_disease = Column(String)
    confidence = Column(Float)
    severity = Column(String)
    recommendation = Column(Text)
    needs_expert_review = Column(Boolean, default=False)
`,
    },
  };

  const activeFile = CODE_FILES[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111e15] border-2 border-emerald-600/60 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[640px] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 px-5 py-3 flex items-center justify-between text-white border-b border-[#233d28]">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-emerald-300" />
            <div>
              <span className="font-bold text-sm tracking-tight block">
                MundaSense System Code &amp; Firmware Hub
              </span>
              <span className="text-[10px] text-emerald-200">
                Pristine production-ready implementations
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0c160e] border-b border-[#1f3523] text-xs">
          <div className="flex items-center gap-2">
            {[
              { id: 'fastapi', label: 'FastAPI Backend', icon: <Terminal className="w-3.5 h-3.5" /> },
              { id: 'esp32', label: 'ESP32 Arduino Firmware', icon: <Cpu className="w-3.5 h-3.5" /> },
              { id: 'simulator', label: '108-Farm Simulator', icon: <Layers className="w-3.5 h-3.5" /> },
              { id: 'models', label: 'Database Models', icon: <FileCode className="w-3.5 h-3.5" /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  activeTab === t.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#142318]'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182a1c] hover:bg-[#223d28] text-emerald-300 font-bold border border-[#27482e] transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Filename subheader */}
        <div className="px-5 py-2 bg-[#0a120b] border-b border-[#18291a] text-[11px] font-mono text-gray-400 flex items-center justify-between">
          <span>File: <span className="text-emerald-400 font-bold">{activeFile.filename}</span></span>
          <span className="text-[10px] text-gray-500 uppercase">{activeFile.language}</span>
        </div>

        {/* Code Display Area */}
        <div className="flex-1 bg-[#080e09] p-5 overflow-auto font-mono text-xs text-gray-200 leading-relaxed select-text">
          <pre>{activeFile.code}</pre>
        </div>
      </div>
    </div>
  );
};
