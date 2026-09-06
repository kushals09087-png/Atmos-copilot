import { Router } from "express";
import OpenAI from "openai";

const router = Router();

function generateMeteorologicalAnalysis(question, context) {
  const q = question.toLowerCase();
  const loc = context?.location?.name || context?.location?.area || "your area";
  const curr = context?.weather;
  const daily = context?.daily;
  const aqi = context?.airQuality;

  if (!curr) {
    return `I am Atmos AI. I don't have current weather telemetry loaded yet. Please open the Weather view for your location, or ask again once weather data is displayed.`;
  }

  const temp = Math.round(curr.temperature_2m ?? 25);
  const feelsLike = Math.round(curr.apparent_temperature ?? temp);
  const humidity = curr.relative_humidity_2m ?? 50;
  const wind = Math.round(curr.wind_speed_10m ?? 10);
  const rainProbToday = daily?.precipitation_probability_max?.[0] ?? (curr.precipitation > 0 ? 90 : 15);
  const rainProbTomorrow = daily?.precipitation_probability_max?.[1] ?? 20;
  const maxTempTomorrow = daily?.temperature_2m_max?.[1] ? Math.round(daily.temperature_2m_max[1]) : temp;
  const minTempTomorrow = daily?.temperature_2m_min?.[1] ? Math.round(daily.temperature_2m_min[1]) : temp - 5;
  const aqiVal = aqi?.european_aqi ?? aqi?.pm2_5 ?? 30;

  // Rain / Umbrella
  if (q.includes("rain") || q.includes("umbrella") || q.includes("precipitation") || q.includes("shower")) {
    if (q.includes("tomorrow")) {
      const advice = rainProbTomorrow >= 50
        ? `High chance (${rainProbTomorrow}%). We recommend carrying an umbrella or rain gear.`
        : rainProbTomorrow >= 25
        ? `Moderate chance (${rainProbTomorrow}%). Isolated showers are possible.`
        : `Low chance (${rainProbTomorrow}%). Expect mostly dry weather.`;
      return `🌧️ Rain Outlook for Tomorrow in ${loc}:\n\n${advice}\nTemperature is forecast between ${minTempTomorrow}°C and ${maxTempTomorrow}°C.`;
    }
    const advice = rainProbToday >= 50
      ? `Yes, rain is likely today with a ${rainProbToday}% chance of precipitation. Keep an umbrella handy!`
      : rainProbToday >= 25
      ? `There is a slight to moderate chance (${rainProbToday}%) of passing showers today.`
      : `No significant rain expected today (${rainProbToday}% probability). Conditions remain mostly dry.`;
    return `🌧️ Rain Status for ${loc}:\n\n${advice}\nCurrent conditions: ${temp}°C, ${humidity}% humidity, wind ${wind} km/h.`;
  }

  // Air Quality
  if (q.includes("aqi") || q.includes("air") || q.includes("pollution") || q.includes("breathe") || q.includes("smog")) {
    let quality = "Good";
    let advice = "Air quality is ideal for all outdoor activities.";
    if (aqiVal > 80) {
      quality = "Very Poor / Hazardous";
      advice = "Sensitive individuals and children should avoid prolonged outdoor exertion. Consider wearing an N95 mask outdoors.";
    } else if (aqiVal > 60) {
      quality = "Poor";
      advice = "Those with respiratory sensitivity should reduce heavy outdoor exertion.";
    } else if (aqiVal > 40) {
      quality = "Moderate";
      advice = "Acceptable air quality for most individuals; slight irritation possible for highly sensitive people.";
    } else if (aqiVal > 20) {
      quality = "Fair";
      advice = "Air quality is satisfactory with minimal health risk.";
    }
    return `🌿 Air Quality Intelligence for ${loc}:\n\nAQI Index: ${Math.round(aqiVal)} (${quality}).\n\nRecommendation: ${advice}\nPM2.5: ${aqi?.pm2_5 ? Number(aqi.pm2_5).toFixed(1) + " μg/m³" : "Normal"}, Ozone: ${aqi?.ozone ? Number(aqi.ozone).toFixed(1) + " μg/m³" : "Normal"}.`;
  }

  // Tomorrow / Forecast
  if (q.includes("tomorrow") || q.includes("forecast") || q.includes("weekend")) {
    return `📅 Tomorrow's Outlook for ${loc}:\n\n• High: ${maxTempTomorrow}°C | Low: ${minTempTomorrow}°C\n• Rain probability: ${rainProbTomorrow}%\n• Wind speed: up to ${Math.round(daily?.wind_speed_10m_max?.[1] || 15)} km/h\n• Overall condition: ${rainProbTomorrow > 50 ? "Cloudy with likely showers" : "Mainly clear to partly cloudy"}.\n\nPlan accordingly for the diurnal temperature swing.`;
  }

  // Farming / Agriculture
  if (q.includes("farmer") || q.includes("crop") || q.includes("agriculture") || q.includes("field") || q.includes("harvest")) {
    const soilMoistureNote = rainProbToday > 40 || rainProbTomorrow > 40
      ? "Expected rain will provide natural irrigation; postpone chemical pesticide spraying to avoid runoff."
      : "Dry conditions ahead; ensure adequate irrigation for moisture-sensitive crops.";
    return `🌾 Agricultural Advisory for ${loc}:\n\n• Current Temp: ${temp}°C (Humidity: ${humidity}%)\n• Wind Speed: ${wind} km/h (Good for spraying if < 15 km/h)\n• Rain Risk: Today ${rainProbToday}%, Tomorrow ${rainProbTomorrow}%\n\nAdvisory: ${soilMoistureNote}`;
  }

  // Travel / Commute / Outdoor
  if (q.includes("travel") || q.includes("drive") || q.includes("commute") || q.includes("walk") || q.includes("outdoor")) {
    const travelStatus = rainProbToday > 60 || wind > 35
      ? "Exercise caution. Wet roads and gusty winds may slow commutes."
      : "Conditions are favorable for travel and outdoor recreation.";
    return `🚗 Commute & Travel Analysis for ${loc}:\n\n${travelStatus}\nCurrent temperature is ${temp}°C (feels like ${feelsLike}°C), wind is ${wind} km/h, and visibility is around ${(curr.visibility ? (curr.visibility/1000).toFixed(1) + " km" : "Good")}.`;
  }

  // Default Comprehensive Answer
  return `🌤️ Atmos Weather Briefing for ${loc}:\n\nCurrently ${temp}°C (feels like ${feelsLike}°C) with ${humidity}% humidity and ${wind} km/h wind.\n\n• Rain probability today: ${rainProbToday}%\n• Air Quality Index: ${Math.round(aqiVal)} (${aqiVal <= 40 ? "Good" : "Moderate"})\n• Tomorrow's high: ${maxTempTomorrow}°C (${rainProbTomorrow}% rain chance)\n\nLet me know if you need specific advice on travel, precipitation, agricultural planning, or air quality.`;
}

router.post("/ask", async (req, res, next) => {
  try {
    const { message, weatherContext } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: "Question is required." });
    }

    const trimmed = message.trim();

    // If no OpenAI API Key is provided, use the built-in meteorological intelligence analyzer
    if (!process.env.OPENAI_API_KEY) {
      const answer = generateMeteorologicalAnalysis(trimmed, weatherContext);
      return res.json({
        answer,
        source: "atmos-met-engine",
        model: "offline-rule-engine"
      });
    }

    // When OPENAI_API_KEY is available, query OpenAI
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const system = `You are Atmos Copilot, an expert, concise weather intelligence assistant.
Never invent live weather. Use the supplied weather context when available.
Explain uncertainty clearly. Give practical, non-alarmist advice.
If weather context is missing, say that live weather data is not currently attached.
Keep answers useful, structured, and easy to understand.
Weather context:
${JSON.stringify(weatherContext || {})}`;

      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

      // Try Chat Completions API
      try {
        const completion = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: trimmed }
          ],
          temperature: 0.6,
          max_tokens: 500
        });

        const reply = completion.choices?.[0]?.message?.content;
        if (reply) {
          return res.json({ answer: reply, source: "openai", model });
        }
      } catch (chatErr) {
        // Try beta responses API if available
        if (client.responses && typeof client.responses.create === "function") {
          const response = await client.responses.create({
            model,
            instructions: system,
            input: trimmed
          });
          if (response.output_text) {
            return res.json({ answer: response.output_text, source: "openai-responses", model });
          }
        }
        throw chatErr;
      }
    } catch (apiErr) {
      console.warn("OpenAI call failed (" + apiErr.message + "). Falling back to Atmos Meteorological Engine.");
      const fallback = generateMeteorologicalAnalysis(trimmed, weatherContext);
      return res.json({
        answer: fallback + "\n\n*(Note: Live OpenAI call encountered an issue: " + (apiErr.message || "service unavailable") + ". Provided via built-in Atmos Engine.)*",
        source: "atmos-fallback"
      });
    }
  } catch (e) {
    next(e);
  }
});

export default router;
