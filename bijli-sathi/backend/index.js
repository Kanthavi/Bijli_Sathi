const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─ Health check ─
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Bijli Sathi API is running" });
});

// ─ Tariff Data ─
const TARIFFS = [
  { name: "Peak", start: 6, end: 10, rate: 8.5 },
  { name: "Normal", start: 10, end: 18, rate: 6.0 },
  { name: "Peak", start: 18, end: 22, rate: 8.5 },
  { name: "Off-Peak", start: 22, end: 6, rate: 3.5 },
];

function getCurrentTariff() {
  const h = new Date().getHours();
  for (const t of TARIFFS) {
    const s = t.start % 24, e = t.end % 24;
    if (e > s) { if (h >= s && h < e) return t; }
    else { if (h >= s || h < e) return t; }
  }
  return TARIFFS[1];
}

// ─ Routes ─
app.get("/api/tariff", (req, res) => {
  res.json(getCurrentTariff());
});

app.get("/api/tariff/all", (req, res) => {
  res.json(TARIFFS);
});

app.post("/api/usage", (req, res) => {
  const { kwh, hours } = req.body;
  if (!kwh || !hours) return res.status(400).json({ error: "kwh and hours required" });
  const tariff = getCurrentTariff();
  const cost = kwh * tariff.rate * hours;
  const co2 = kwh * hours * 0.82;
  res.json({
    kwh,
    hours,
    tariff: tariff.name,
    rate: tariff.rate,
    cost: +cost.toFixed(2),
    co2kg: +co2.toFixed(2),
  });
});

app.post("/api/optimize", (req, res) => {
  const { applianceName, kw, currentHour } = req.body;
  const cheapRate = 3.5;
  const currentTariff = getCurrentTariff();
  const saving = Math.max(0, (currentTariff.rate - cheapRate) * kw);
  res.json({
    appliance: applianceName,
    currentRate: currentTariff.rate,
    offPeakRate: cheapRate,
    savingPerHour: +saving.toFixed(2),
    savingPerMonth: +(saving * 4 * 30).toFixed(0),
    recommendation: saving > 0 ? "Shift to Off-Peak (10PM–6AM)" : "Already at cheapest rate!",
  });
});

app.listen(PORT, () => {
  console.log(`✅ Bijli Sathi backend running on http://localhost:${PORT}`);
});
