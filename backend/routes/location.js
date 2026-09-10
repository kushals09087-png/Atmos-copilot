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

    const zoning =
      a.industrial ||
      a.commercial ||
      a.retail ||
      a.business ||
      a.office ||
      a.amenity ||
      a.quarter ||
      a.suburb ||
      a.neighbourhood ||
      a.residential ||
      a.village ||
      a.hamlet ||
      a.town ||
      a.road ||
      "";

    const admin =
      a.city ||
      a.county ||
      a.state_district ||
      a.city_district ||
      a.municipality ||
      "";

    const state = a.state || "";
    const country = a.country || "";

    const district = a.state_district || a.district || "";
    const taluk = a.county || "";
    const city = a.city || a.town || a.municipality || "";

    const parts = [];
    if (zoning) parts.push(zoning);
    if (city && (!zoning || !zoning.toLowerCase().includes(city.toLowerCase()))) {
      parts.push(city);
    } else if (district && (!zoning || !zoning.toLowerCase().includes(district.toLowerCase()))) {
      parts.push(district);
    } else if (taluk && (!zoning || !zoning.toLowerCase().includes(taluk.toLowerCase()))) {
      parts.push(taluk);
    }
    if (state && (!parts.some(p => p.toLowerCase().includes(state.toLowerCase())))) {
      parts.push(state);
    }

    const formatted = parts.length > 0 ? parts.join(", ") : (city || district || "Detected Station");

    res.json({
      name: zoning || city || district || "Current location",
      area: district || taluk || city || "Current area",
      zoning,
      city: city || district || taluk || "Current Area",
      district,
      taluk,
      formatted,
      state,
      country,
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
