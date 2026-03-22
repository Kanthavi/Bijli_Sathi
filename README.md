# ⚡ Bijli Sathi – AI Energy Optimization Assistant
### Hackathon-Ready Prototype | India Smart Energy Platform

---

## 🏗️ Architecture Overview

```
bijli-sathi/
├── bijli-sathi-app.html          # ← Complete runnable web app (demo)
├── README.md                     # ← This file
├── supabase/
│   └── schema.sql                # ← Full PostgreSQL schema + seed data
└── src/
    ├── engine/
    │   ├── optimizationEngine.js  # ← Rule-based optimizer + tariff logic
    │   └── chatbotEngine.js       # ← AI chatbot (no external API)
    ├── screens/                   # ← React Native screens (production)
    │   ├── DashboardScreen.jsx
    │   ├── OptimizerScreen.jsx
    │   ├── SmartPlugsScreen.jsx
    │   ├── AssistantScreen.jsx
    │   ├── BillPredictorScreen.jsx
    │   ├── CarbonScreen.jsx
    │   └── RewardsScreen.jsx
    ├── components/                # ← Shared UI components
    │   ├── LiveMeter.jsx
    │   ├── TariffBadge.jsx
    │   ├── ApplianceBar.jsx
    │   ├── RecCard.jsx
    │   └── ChatBubble.jsx
    ├── hooks/
    │   ├── useRealtimeMeter.js    # ← Supabase Realtime hook
    │   └── useOptimizer.js        # ← Optimization engine hook
    └── data/
        └── seedData.js            # ← Demo/development data
```

---

## ⚡ Core Features

| Feature | Implementation | Notes |
|---|---|---|
| Smart Meter Simulation | JavaScript time-series generator | Updates every 3s |
| Indian ToD Tariff | Rule-based slot detection | Delhi BSES rates |
| Optimization Engine | Deterministic savings formula | Fully explainable |
| AI Assistant | Keyword-intent NLU | No external API |
| Bill Predictor | Linear projection + shock detection | 15% threshold |
| Carbon Tracker | 0.82 kg CO₂/kWh formula | Trees + km metrics |
| Gamification | Score + badge system | City leaderboard |
| Smart Plugs | Simulated toggle + schedule UI | Visual only |
| Notifications | Rule-triggered alerts | 7 notification types |

---

## 🧮 Rule-Based Optimization Engine

### Tariff Slots (Delhi BSES)
```
Peak     6:00–10:00   ₹8.50/unit   (Morning peak)
Normal  10:00–18:00   ₹6.00/unit   (Daytime)
Peak    18:00–22:00   ₹8.50/unit   (Evening peak)
Off-Peak 22:00–06:00  ₹3.50/unit   (Night — cheapest)
```

### Savings Formula (Always Shown to User)
```
Savings = (rate_current − rate_cheapest) × kWh_rating × duration_hours

Example: AC shifted from Peak → Off-Peak
= (₹8.50 − ₹3.50) × 1.5 kW × 4 hours
= ₹5.00 × 1.5 × 4
= ₹30.00/day saved
= ₹900/month potential
```

### Carbon Formula
```
CO₂ (kg) = kWh × 0.82          (India grid factor)
Trees     = CO₂ / 21             (kg absorbed/tree/year)
Car km    = CO₂ / 0.12           (kg CO₂/km petrol car)
```

### Bill Shock Detection
```
if (projected_bill / last_month_bill) > 1.15:
    trigger WARNING notification
    show ⚠️ alert on dashboard
```

---

## 🗄️ Database Schema

### Tables
1. **users** — Profile + energy score + savings + carbon
2. **appliances** — Device catalog with power ratings + scheduling
3. **tariff_slots** — ToD tariff tiers by time window
4. **meter_readings** — Time-series kWh data (Realtime enabled)
5. **savings_logs** — Audit trail of optimization outcomes
6. **notifications** — Smart alert history
7. **badges** — Earned gamification achievements

### Supabase Realtime
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE meter_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## 🤖 Chatbot Intent Engine

No ML. No external API. Pure rule-based NLU:

```
"why is my bill high"     → Bill analysis with top consumers
"which appliance"         → Power breakdown with percentages  
"save money / tips"       → Contextual savings recommendations
"tariff / rate"           → Current slot + all rates shown
"carbon / co2"            → Full carbon footprint calculation
"schedule"                → Optimal run windows per appliance
"score / badge"           → Gamification status
"predict / next month"    → Bill projection with trend
```

Responses are dynamically generated using real user data from STATE.

---

## 🎮 Gamification System

### Score Events
| Action | Points |
|---|---|
| Off-peak usage | +20 |
| Save ₹500 total | +50 |
| Reduce 10% consumption | +100 |
| Accept suggestion | +15 |
| Check bill | +5 |

### Badges
- ⚡ **Energy Saver** — Save ₹500 total
- 🌱 **Green Hero** — Save 10 kg CO₂
- 🏆 **Peak Avoider** — Reach 300 energy score
- 🦉 **Night Owl** — Off-peak 7-day streak
- 💰 **Bill Buster** — Save ₹1,000 total

---

## 🚀 Setup Guide

### 1. Run Demo
Simply open `bijli-sathi-app.html` in any browser — fully self-contained.

### 2. Supabase Setup
```bash
# Create project at supabase.com
# Run schema in SQL editor:
cat supabase/schema.sql | supabase db push
```

### 3. React Native / Expo Setup
```bash
npx create-expo-app bijli-sathi --template blank-typescript
cd bijli-sathi
npm install @supabase/supabase-js zustand expo-router
# Copy src/ files
# Add SUPABASE_URL and SUPABASE_ANON_KEY to .env
```

### 4. Supabase Realtime Hook
```javascript
// useRealtimeMeter.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtimeMeter(userId) {
  const [readings, setReadings] = useState([]);
  
  useEffect(() => {
    const channel = supabase
      .channel('meter-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'meter_readings',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setReadings(prev => [payload.new, ...prev].slice(0, 100));
      })
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [userId]);
  
  return readings;
}
```

---

## 📊 Sample Seed Data

### Appliances (demo user)
| Appliance | kW | Priority | Best Time |
|---|---|---|---|
| Air Conditioner | 1.50 | Medium | 10 PM–6 AM |
| Geyser | 2.00 | Medium | 5 AM–7 AM |
| Washing Machine | 0.80 | Low | 10 PM–6 AM |
| Refrigerator | 0.15 | Always On | — |
| LED TV | 0.10 | Medium | — |
| Microwave | 1.20 | Medium | 12–2 PM |
| Water Pump | 0.75 | Medium | 5–7 AM |
| Ceiling Fans (4x) | 0.24 | Always On | — |

---

## 🔌 Smart Plug Simulation

The Smart Plugs screen simulates IoT integration:
- **Toggle** appliances on/off (updates active load calculation)
- **Schedule** appliances for Off-Peak windows
- **Live cost** calculation per appliance at current tariff
- **Savings preview** shown when scheduling to Off-Peak

In production: Replace with real smart plug API (e.g., Tuya, Shelly, TP-Link Kasa).

---

## 🌱 Carbon Impact

India's electricity grid is coal-heavy (~70%), so the emission factor of **0.82 kg CO₂/kWh** is used (Central Electricity Authority, India).

Every kWh shifted from Peak to Off-Peak:
1. Reduces demand during high-stress grid periods
2. Enables better integration of renewable energy
3. Contributes to India's 2030 clean energy targets

---

## 🏆 Hackathon Highlights

✅ **Zero ML dependency** — All logic is deterministic and explainable  
✅ **Full cost transparency** — Every recommendation shows its formula  
✅ **Real Indian data** — BSES Delhi tariff structure, ₹ formatting  
✅ **Live simulation** — Meter updates every 3 seconds  
✅ **Production-ready schema** — Supabase + PostgreSQL  
✅ **Modular architecture** — Easy to extend  
✅ **Mobile-first thinking** — Designed for React Native Expo  

---

*Built for India's 300M+ electricity consumers.*  
*Every rupee saved matters. Bijli Sathi ⚡*
