import { Router } from "express";
import { getWeather } from "../services/weatherService.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ message: "Invalid coordinates." });
    }
    res.json(await getWeather(lat, lon));
  } catch (e) { next(e); }
});

export default router;
