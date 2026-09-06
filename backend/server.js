import "dotenv/config";
import express from "express";
import cors from "cors";
import weatherRoutes from "./routes/weather.js";
import locationRoutes from "./routes/location.js";
import authRoutes from "./routes/auth.js";
import aiRoutes from "./routes/ai.js";
import mongoose from "mongoose";

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 5001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_, res) => res.json({
  ok: true,
  service: "Atmos Copilot API",
  timestamp: new Date().toISOString(),
  database: mongoose.connection.readyState === 1 ? "mongodb" : "local-file"
}));

app.use("/api/weather", weatherRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

async function connectDatabase() {
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes("USERNAME:PASSWORD")) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 3000
      });
      console.log("MongoDB connected successfully");
    } catch (e) {
      console.warn("MongoDB connection failed (" + e.message + "). Falling back to local storage for auth.");
    }
  } else {
    console.log("MONGODB_URI not set or placeholder detected. Using local file storage for auth (backend/data/users.json).");
  }
}

function startServer(port, maxAttempts = 5) {
  const server = app.listen(port, () => {
    console.log(`Atmos API running on http://localhost:${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && maxAttempts > 0) {
      console.warn(`Port ${port} is already in use (e.g. macOS AirPlay). Trying port ${port + 1}...`);
      startServer(port + 1, maxAttempts - 1);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });
}

async function start() {
  await connectDatabase();
  startServer(DEFAULT_PORT);
}

start();
