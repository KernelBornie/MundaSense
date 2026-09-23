<div align="center">

# 🌾 MundaSense

**Smart Agriculture Platform for Zambian Smallholders**

*One community IoT hub serving 500+ farms across all 10 provinces · Web · USSD · SMS · Voice IVR*

Built for **GreenCode Hackathon Zambia 2026**

</div>

---

## 📖 Overview

MundaSense is a multi-task agriculture platform designed for smallholder farmers across Zambia. A single low-cost IoT sensor hub delivers field-level advisories, market access, and logistics to 100+ farms through four integrated communication channels — **web dashboard**, **USSD** (`*384*2873#`), **SMS**, and **Voice IVR** — in all 7 Zambian regional languages.

The platform also includes crop marketing in **ZMW**, transporter bidding, hermetic storage monitoring, and AI-assisted crop disease screening covering 20+ Zambian crops.

---

## ✨ Key Features

### 🌱 Nationwide Coverage
- **500+ farms** across all **10 Zambian provinces**
- **113 districts** with at least 4 farms each
- **15 community sensor hubs** (solar-powered, LoRaWAN)
- **47 agricultural depots** tracked on the map
- Coverage of every major crop: Maize, Groundnuts, Soybeans, Sunflower, Cotton, Cassava, Rice, and more

### 📡 IoT Sensor Network
- Solar-powered **ESP32 + LoRaWAN** community hub (BOM under $200)
- Covers an **8.5 km radius** serving 100+ smallholder farms per hub
- Measures soil moisture at **15 cm / 30 cm / 60 cm**, temperature, humidity, and rainfall
- Target cost: **under $2 per farm per season**

### 📱 Four Communication Channels
| Channel | Audience | Requirement |
|---|---|---|
| **Web Dashboard** | Cooperatives, extension officers, buyers | Any browser |
| **USSD** `*384*2873#` | Farmers with feature phones | No internet or data needed |
| **SMS** | Feature phones | Standard SMS rates |
| **Voice IVR** | Low-literacy farmers | Any phone call |

### 🗣️ 8 Languages
English · Bemba · Nyanja · Tonga · Lozi · Lunda · Luvale · Kaonde

### 🌽 AI-Assisted Disease Screening
- **20+ Zambian crops**, 130+ disease classes
- Covers maize, groundnuts, soybean, tomato, cassava, banana, cotton, sunflower, sorghum, rice, cowpea, and more
- Returns prediction, confidence, severity, symptoms, treatment, and prevention
- Auto-escalates to an extension officer when confidence falls below 75%

### 💰 Marketplace & Logistics
- **Crop listings in ZMW** with direct photo uploads
- Transporter bidding on haulage requests
- Real-time transport tracking
- Hermetic silo monitoring with aflatoxin alerts
- Full contact details (phone + email) on every listing

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/KernelBornie/MundaSense.git
cd MundaSense

# 2. Install dependencies
npm install

# 3. Configure environment (optional)
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Start the development server
npm run dev