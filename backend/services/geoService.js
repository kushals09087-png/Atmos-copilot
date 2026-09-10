/**
 * Comprehensive Geographic Intelligence & Entity Resolution Engine for Atmos Sun Copilot
 */

export const KNOWN_CITIES = {
  // Karnataka Districts & Hubs (with common transliteration variants)
  "davanagere": { name: "Davanagere, Karnataka", lat: 14.4669, lon: 75.9269 },
  "davangere": { name: "Davanagere, Karnataka", lat: 14.4669, lon: 75.9269 },
  "bengaluru": { name: "Bengaluru, Karnataka", lat: 12.9716, lon: 77.5946 },
  "bangalore": { name: "Bengaluru, Karnataka", lat: 12.9716, lon: 77.5946 },
  "peenya": { name: "Peenya, Bengaluru, Karnataka", lat: 13.0285, lon: 77.5197 },
  "whitefield": { name: "Whitefield, Bengaluru, Karnataka", lat: 12.9698, lon: 77.7499 },
  "mysuru": { name: "Mysuru, Karnataka", lat: 12.2958, lon: 76.6394 },
  "mysore": { name: "Mysuru, Karnataka", lat: 12.2958, lon: 76.6394 },
  "mangaluru": { name: "Mangaluru, Karnataka", lat: 12.9141, lon: 74.8560 },
  "mangalore": { name: "Mangaluru, Karnataka", lat: 12.9141, lon: 74.8560 },
  "hubballi": { name: "Hubballi, Karnataka", lat: 15.3647, lon: 75.1240 },
  "hubli": { name: "Hubli, Karnataka", lat: 15.3647, lon: 75.1240 },
  "dharwad": { name: "Dharwad, Karnataka", lat: 15.4589, lon: 75.0078 },
  "belagavi": { name: "Belagavi, Karnataka", lat: 15.8497, lon: 74.4977 },
  "belgaum": { name: "Belgaum, Karnataka", lat: 15.8497, lon: 74.4977 },
  "kalaburagi": { name: "Kalaburagi, Karnataka", lat: 17.3297, lon: 76.8343 },
  "gulbarga": { name: "Gulbarga, Karnataka", lat: 17.3297, lon: 76.8343 },
  "shivamogga": { name: "Shivamogga, Karnataka", lat: 13.9299, lon: 75.5681 },
  "shimoga": { name: "Shimoga, Karnataka", lat: 13.9299, lon: 75.5681 },
  "tumakuru": { name: "Tumakuru, Karnataka", lat: 13.3409, lon: 77.1006 },
  "tumkur": { name: "Tumkur, Karnataka", lat: 13.3409, lon: 77.1006 },
  "ballari": { name: "Ballari, Karnataka", lat: 15.1394, lon: 76.9214 },
  "bellary": { name: "Bellary, Karnataka", lat: 15.1394, lon: 76.9214 },
  "vijayapura": { name: "Vijayapura, Karnataka", lat: 16.8302, lon: 75.7100 },
  "bijapur": { name: "Bijapur, Karnataka", lat: 16.8302, lon: 75.7100 },
  "bidar": { name: "Bidar, Karnataka", lat: 17.9104, lon: 77.5199 },
  "raichur": { name: "Raichur, Karnataka", lat: 16.2120, lon: 77.3439 },
  "bagalkote": { name: "Bagalkote, Karnataka", lat: 16.1691, lon: 75.6615 },
  "bagalkot": { name: "Bagalkot, Karnataka", lat: 16.1691, lon: 75.6615 },
  "gadag": { name: "Gadag, Karnataka", lat: 15.4167, lon: 75.6167 },
  "haveri": { name: "Haveri, Karnataka", lat: 14.7977, lon: 75.4024 },
  "koppal": { name: "Koppal, Karnataka", lat: 15.3468, lon: 76.1557 },
  "chitradurga": { name: "Chitradurga, Karnataka", lat: 14.2251, lon: 76.3980 },
  "hassan": { name: "Hassan, Karnataka", lat: 13.0033, lon: 76.1004 },
  "chikkamagaluru": { name: "Chikkamagaluru, Karnataka", lat: 13.3161, lon: 75.7720 },
  "chikmagalur": { name: "Chikmagalur, Karnataka", lat: 13.3161, lon: 75.7720 },
  "udupi": { name: "Udupi, Karnataka", lat: 13.3409, lon: 74.7421 },
  "manipal": { name: "Manipal, Karnataka", lat: 13.3525, lon: 74.7864 },
  "karwar": { name: "Karwar, Karnataka", lat: 14.8185, lon: 74.1350 },
  "sirsi": { name: "Sirsi, Karnataka", lat: 14.6207, lon: 74.8355 },
  "gokarna": { name: "Gokarna, Karnataka", lat: 14.5479, lon: 74.3188 },
  "madikeri": { name: "Madikeri, Coorg, Karnataka", lat: 12.4244, lon: 75.7382 },
  "coorg": { name: "Coorg, Karnataka", lat: 12.3375, lon: 75.8069 },
  "mandya": { name: "Mandya, Karnataka", lat: 12.5218, lon: 76.8951 },
  "chamarajanagar": { name: "Chamarajanagar, Karnataka", lat: 11.9261, lon: 76.9437 },
  "ramanagara": { name: "Ramanagara, Karnataka", lat: 12.7150, lon: 77.2810 },
  "chikkaballapur": { name: "Chikkaballapur, Karnataka", lat: 13.4325, lon: 77.7275 },
  "kolar": { name: "Kolar, Karnataka", lat: 13.1367, lon: 78.1291 },
  "yadgir": { name: "Yadgir, Karnataka", lat: 16.7697, lon: 77.1378 },
  "hospet": { name: "Hosapete, Karnataka", lat: 15.2689, lon: 76.3909 },
  "hosapete": { name: "Hosapete, Karnataka", lat: 15.2689, lon: 76.3909 },
  "hampi": { name: "Hampi, Karnataka", lat: 15.3350, lon: 76.4600 },

  // Indian Metros & State Capitals
  "delhi": { name: "New Delhi, Delhi", lat: 28.6139, lon: 77.2090 },
  "new delhi": { name: "New Delhi, Delhi", lat: 28.6139, lon: 77.2090 },
  "mumbai": { name: "Mumbai, Maharashtra", lat: 19.0760, lon: 72.8777 },
  "bombay": { name: "Mumbai, Maharashtra", lat: 19.0760, lon: 72.8777 },
  "pune": { name: "Pune, Maharashtra", lat: 18.5204, lon: 73.8567 },
  "nagpur": { name: "Nagpur, Maharashtra", lat: 21.1458, lon: 79.0882 },
  "chennai": { name: "Chennai, Tamil Nadu", lat: 13.0827, lon: 80.2707 },
  "madras": { name: "Chennai, Tamil Nadu", lat: 13.0827, lon: 80.2707 },
  "coimbatore": { name: "Coimbatore, Tamil Nadu", lat: 11.0168, lon: 76.9558 },
  "madurai": { name: "Madurai, Tamil Nadu", lat: 9.9252, lon: 78.1198 },
  "hyderabad": { name: "Hyderabad, Telangana", lat: 17.3850, lon: 78.4867 },
  "secunderabad": { name: "Secunderabad, Telangana", lat: 17.4399, lon: 78.4983 },
  "kolkata": { name: "Kolkata, West Bengal", lat: 22.5726, lon: 88.3639 },
  "calcutta": { name: "Kolkata, West Bengal", lat: 22.5726, lon: 88.3639 },
  "ahmedabad": { name: "Ahmedabad, Gujarat", lat: 23.0225, lon: 72.5714 },
  "surat": { name: "Surat, Gujarat", lat: 21.1702, lon: 72.8311 },
  "jaipur": { name: "Jaipur, Rajasthan", lat: 26.9124, lon: 75.7873 },
  "lucknow": { name: "Lucknow, Uttar Pradesh", lat: 26.8467, lon: 80.9462 },
  "kanpur": { name: "Kanpur, Uttar Pradesh", lat: 26.4499, lon: 80.3319 },
  "varanasi": { name: "Varanasi, Uttar Pradesh", lat: 25.3176, lon: 82.9739 },
  "kashi": { name: "Varanasi, Uttar Pradesh", lat: 25.3176, lon: 82.9739 },
  "patna": { name: "Patna, Bihar", lat: 25.5941, lon: 85.1376 },
  "bhopal": { name: "Bhopal, Madhya Pradesh", lat: 23.2599, lon: 77.4126 },
  "indore": { name: "Indore, Madhya Pradesh", lat: 22.7196, lon: 75.8577 },
  "chandigarh": { name: "Chandigarh", lat: 30.7333, lon: 76.7794 },
  "srinagar": { name: "Srinagar, Jammu & Kashmir", lat: 34.0837, lon: 74.7973 },
  "shimla": { name: "Shimla, Himachal Pradesh", lat: 31.1048, lon: 77.1734 },
  "dehradun": { name: "Dehradun, Uttarakhand", lat: 30.3165, lon: 78.0322 },
  "kochi": { name: "Kochi, Kerala", lat: 9.9312, lon: 76.2673 },
  "cochin": { name: "Kochi, Kerala", lat: 9.9312, lon: 76.2673 },
  "thiruvananthapuram": { name: "Thiruvananthapuram, Kerala", lat: 8.5241, lon: 76.9366 },
  "trivandrum": { name: "Thiruvananthapuram, Kerala", lat: 8.5241, lon: 76.9366 },
  "kozhikode": { name: "Kozhikode, Kerala", lat: 11.2588, lon: 75.7804 },
  "goa": { name: "Goa", lat: 15.2993, lon: 74.1240 },
  "panaji": { name: "Panaji, Goa", lat: 15.4909, lon: 73.8278 },
  "visakhapatnam": { name: "Visakhapatnam, Andhra Pradesh", lat: 17.6868, lon: 83.2185 },
  "vizag": { name: "Visakhapatnam, Andhra Pradesh", lat: 17.6868, lon: 83.2185 },
  "vijayawada": { name: "Vijayawada, Andhra Pradesh", lat: 16.5062, lon: 80.6480 },
  "guwahati": { name: "Guwahati, Assam", lat: 26.1445, lon: 91.7362 },
  "bhubaneswar": { name: "Bhubaneswar, Odisha", lat: 20.2961, lon: 85.8245 },
  "ranchi": { name: "Ranchi, Jharkhand", lat: 23.3441, lon: 85.3096 },
  "raipur": { name: "Raipur, Chhattisgarh", lat: 21.2514, lon: 81.6296 },

  // Global Hubs
  "london": { name: "London, United Kingdom", lat: 51.5074, lon: -0.1278 },
  "new york": { name: "New York, USA", lat: 40.7128, lon: -74.0060 },
  "nyc": { name: "New York, USA", lat: 40.7128, lon: -74.0060 },
  "tokyo": { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
  "paris": { name: "Paris, France", lat: 48.8566, lon: 2.3522 },
  "dubai": { name: "Dubai, UAE", lat: 25.2048, lon: 55.2708 },
  "singapore": { name: "Singapore", lat: 1.3521, lon: 103.8198 },
  "sydney": { name: "Sydney, Australia", lat: -33.8688, lon: 151.2093 },
  "berlin": { name: "Berlin, Germany", lat: 52.5200, lon: 13.4050 },
  "toronto": { name: "Toronto, Canada", lat: 43.6532, lon: -79.3832 },
  "los angeles": { name: "Los Angeles, USA", lat: 34.0522, lon: -118.2437 },
  "san francisco": { name: "San Francisco, USA", lat: 37.7749, lon: -122.4194 },
  "chicago": { name: "Chicago, USA", lat: 41.8781, lon: -87.6298 },
  "rome": { name: "Rome, Italy", lat: 41.9028, lon: 12.4964 },
  "madrid": { name: "Madrid, Spain", lat: 40.4168, lon: -3.7038 },
  "bangkok": { name: "Bangkok, Thailand", lat: 13.7563, lon: 100.5018 }
};

const IGNORED_PHRASES = new Set([
  "the next", "the morning", "the evening", "the afternoon", "the night",
  "my area", "this area", "my city", "this place", "here", "current location",
  "celsius", "fahrenheit", "km/h", "tomorrow", "today", "yesterday",
  "12 hours", "24 hours", "the week", "this week", "my location", "station"
]);

/**
 * Extract location candidate synchronously
 */
export function extractLocationFromQuery(query) {
  if (!query || typeof query !== "string") return null;
  const clean = query.trim();
  const lower = clean.toLowerCase();

  // 1. Match against known cities sorted by longest string first
  const sortedKeys = Object.keys(KNOWN_CITIES).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(lower)) {
      return KNOWN_CITIES[key];
    }
  }

  // 2. Pattern matching for prepositional clauses like "in Davanagere", "for Mumbai", "at Delhi"
  const prepRegex = /\b(?:in|at|for|around|of|near|to)\b\s+([a-zA-Z\s]{2,30}?)(?:\?|\.|\!|\s+today|\s+tomorrow|\s+right now|\s+now|\s+this week|$)/i;
  const match = lower.match(prepRegex);
  if (match && match[1]) {
    const candidate = match[1].trim();
    if (!IGNORED_PHRASES.has(candidate) && candidate.length >= 3) {
      return { candidate };
    }
  }

  return null;
}

/**
 * Asynchronously resolve location from query (using local dictionary, Open-Meteo geocoding, or Nominatim)
 */
export async function resolveLocationAsync(query) {
  const syncMatch = extractLocationFromQuery(query);
  if (syncMatch && syncMatch.lat !== undefined && syncMatch.lon !== undefined) {
    return syncMatch;
  }
  const candidate = syncMatch?.candidate;
  if (!candidate) return null;

  // 1. Try Open-Meteo Geocoding
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidate)}&count=1&language=en&format=json`, {
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const r = data.results[0];
        const stateCountry = [r.admin1, r.country].filter(Boolean).join(", ");
        return {
          name: stateCountry ? `${r.name}, ${stateCountry}` : r.name,
          lat: r.latitude,
          lon: r.longitude
        };
      }
    }
  } catch {
    // Open-Meteo geocode timeout or fail, fall through to Nominatim
  }

  // 2. Fallback to OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(candidate)}&format=json&limit=1`, {
      headers: { "User-Agent": "Atmos-Copilot-App/1.0" },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const list = await res.json();
      if (list && list.length > 0) {
        const r = list[0];
        const segs = (r.display_name || "").split(",").map(s => s.trim()).slice(0, 3);
        return {
          name: segs.join(", ") || r.name,
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon)
        };
      }
    }
  } catch {
    // Nominatim fail
  }

  return null;
}

export function weatherCodeLabel(code, isDay = 1) {
  if (code === 0) return isDay ? "Sunny / Clear Sky" : "Clear Night";
  if (code === 1) return isDay ? "Mainly Sunny" : "Mainly Clear";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Foggy / Mist";
  if ([51, 53, 55].includes(code)) return "Light Drizzle";
  if ([56, 57].includes(code)) return "Freezing Drizzle";
  if ([61, 63].includes(code)) return "Moderate Rain";
  if ([65, 66, 67].includes(code)) return "Heavy Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow Showers";
  if ([80, 81, 82].includes(code)) return "Passing Showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm Alert";
  return "Partly Cloudy";
}
