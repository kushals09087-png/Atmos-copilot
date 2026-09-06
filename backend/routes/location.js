import { Router } from "express";

const router = Router();

router.get("/reverse", async (req, res, next) => {
  try {
    const lat = Number(req.query.lat), lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return res.status(400).json({message:"Invalid coordinates."});
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`;
    const r = await fetch(url, { headers: { "User-Agent": "Atmos-Copilot-SIH-Prototype/1.0" } });
    if (!r.ok) throw new Error("Reverse geocoding failed");
    const d = await r.json();
    const a = d.address || {};
    res.json({
      name: a.city || a.town || a.village || a.municipality || a.county || "Current location",
      area: a.suburb || a.neighbourhood || a.quarter || a.city_district || a.city || "Current area",
      state: a.state || "",
      country: a.country || "",
      lat, lon
    });
  } catch(e) { next(e); }
});

router.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.status(400).json({message:"Enter at least 2 characters."});
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("Location search failed");
    res.json(await r.json());
  } catch(e) { next(e); }
});

export default router;
