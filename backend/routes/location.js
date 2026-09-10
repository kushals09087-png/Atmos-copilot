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

    // 1. Specific landmark / POI / shop / building / amenity
    const poi =
      a.building ||
      a.amenity ||
      a.shop ||
      a.office ||
      a.tourism ||
      a.leisure ||
      a.historic ||
      a.place ||
      "";

    // 2. Exact street or road with house number
    const houseNum = a.house_number ? `#${a.house_number}` : "";
    const road = a.road || a.pedestrian || a.street || a.footway || "";
    const thoroughfare = [houseNum, road].filter(Boolean).join(" ");

    // 3. Colony / Suburb / Neighbourhood / Quarter
    const suburb =
      a.suburb ||
      a.neighbourhood ||
      a.quarter ||
      a.residential ||
      a.commercial ||
      a.industrial ||
      a.village ||
      a.hamlet ||
      "";

    // 4. Administrative City / Town
    const city = a.city || a.town || a.municipality || "";
    const district = a.state_district || a.district || a.county || "";
    const state = a.state || "";
    const postcode = a.postcode || "";

    const parts = [];
    if (poi) parts.push(poi);
    if (thoroughfare && !parts.some(p => p.toLowerCase().includes(thoroughfare.toLowerCase()))) {
      parts.push(thoroughfare);
    }
    if (suburb && !parts.some(p => p.toLowerCase().includes(suburb.toLowerCase()))) {
      parts.push(suburb);
    }
    const adminCity = city || district;
    if (adminCity && !parts.some(p => p.toLowerCase().includes(adminCity.toLowerCase()))) {
      parts.push(adminCity);
    }
    if (state && !parts.some(p => p.toLowerCase().includes(state.toLowerCase()))) {
      parts.push(state);
    }

    const formatted = parts.length > 0 ? parts.join(", ") : (d.display_name || "Detected Station");

    res.json({
      name: poi || thoroughfare || suburb || city || district || "Current location",
      area: suburb || district || city || "Current area",
      poi,
      thoroughfare,
      suburb,
      city: city || district || "Current Area",
      district,
      formatted,
      postcode,
      state,
      country: a.country || "",
      lat, lon,
      rawAddress: a
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

router.get("/ip", async (req, res, next) => {
  try {
    let geo = null;
    // Primary: ipapi.co
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const r = await fetch("https://ipapi.co/json/", {
        headers: { "User-Agent": "Atmos-Copilot/1.0" },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (r.ok) {
        const d = await r.json();
        if (d.latitude && d.longitude) {
          geo = {
            lat: parseFloat(d.latitude),
            lon: parseFloat(d.longitude),
            city: d.city,
            region: d.region,
            country: d.country_name,
            formatted: [d.city, d.region, d.country_name].filter(Boolean).join(", "),
            source: "ip_ipapi"
          };
        }
      }
    } catch (e1) {}

    // Secondary: ipwho.is
    if (!geo) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const r2 = await fetch("https://ipwho.is/", { signal: controller.signal });
        clearTimeout(timeout);
        if (r2.ok) {
          const d2 = await r2.json();
          if (d2.latitude && d2.longitude) {
            geo = {
              lat: parseFloat(d2.latitude),
              lon: parseFloat(d2.longitude),
              city: d2.city,
              region: d2.region,
              country: d2.country,
              formatted: [d2.city, d2.region, d2.country].filter(Boolean).join(", "),
              source: "ip_ipwhois"
            };
          }
        }
      } catch (e2) {}
    }

    if (geo) {
      return res.json(geo);
    }

    // Default station fallback
    res.json({
      lat: 12.9716,
      lon: 77.5946,
      city: "Bengaluru",
      region: "Karnataka",
      country: "India",
      formatted: "Bengaluru, Karnataka (Station HQ)",
      source: "ip_default"
    });
  } catch (err) {
    next(err);
  }
});

export default router;
