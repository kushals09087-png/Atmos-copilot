import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userService } from "../services/userService.js";

const router = Router();

// In-memory brute-force protection tracking
const loginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 5 * 60 * 1000; // 5-minute lockout

function getClientIdentifier(req) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown-ip";
  const email = (req.body?.email || "").toLowerCase().trim();
  return `${ip}_${email}`;
}

function checkRateLimit(key) {
  const record = loginAttempts.get(key);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      message: `Too many failed authentication attempts. Security lock active. Please retry in ${remainingSeconds}s.`
    };
  }

  // If lockout has passed, reset
  if (record.lockedUntil && now >= record.lockedUntil) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedAttempt(key) {
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, lastAttempt: now };
  record.count += 1;
  record.lastAttempt = now;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_WINDOW_MS;
  }
  loginAttempts.set(key, record);
}

function clearFailedAttempts(key) {
  loginAttempts.delete(key);
}

function token(user) {
  const id = user._id ? user._id.toString() : user.id;
  return jwt.sign(
    { id, email: user.email, name: user.name },
    process.env.JWT_SECRET || "development-only-secret",
    { expiresIn: "7d" }
  );
}

// Regex rules for strict validation
const NAME_STRICT_REGEX = /^[a-zA-Z\s.'-]{2,50}$/;
const EMAIL_STRICT_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Strict Name Validation: ONLY alphabetic characters, spaces, dots, hyphens
    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Operator full name is required." });
    }
    const cleanName = name.trim();
    if (!NAME_STRICT_REGEX.test(cleanName)) {
      return res.status(400).json({
        message: "Operator name may only contain alphabetic characters, spaces, dots, and hyphens (2 to 50 characters). Numbers and special characters are forbidden."
      });
    }

    // 2. Strict Email Validation
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email address is required." });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_STRICT_REGEX.test(cleanEmail) || cleanEmail.length > 100) {
      return res.status(400).json({ message: "Please provide a valid, RFC-compliant email address." });
    }

    // 3. Strict Password Complexity Validation (8+ chars, upper, lower, digit, special)
    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "Security key password is required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Security key must be at least 8 characters in length." });
    }
    if (password.length > 128) {
      return res.status(400).json({ message: "Password exceeds maximum length limit of 128 characters." });
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return res.status(400).json({
        message: "Password must satisfy security policy: at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol."
      });
    }

    const existing = await userService.findByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ message: "An operator account with this email address already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userService.create({ name: cleanName, email: cleanEmail, passwordHash });
    const storageMode = userService.isUsingMongo() ? "mongodb" : "local";

    res.status(201).json({
      token: token(user),
      user: { id: user._id, name: user.name, email: user.email },
      storageMode
    });
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  const clientKey = getClientIdentifier(req);

  try {
    const { email, password, isDemo } = req.body;
    const cleanEmail = (typeof email === "string" ? email : "").trim().toLowerCase();

    // Instant Demo Access: Completely remove security & rate limits
    if (isDemo || cleanEmail === "sharma.met@atmos-intel.org") {
      clearFailedAttempts(clientKey);
      let user = await userService.findByEmail("sharma.met@atmos-intel.org");
      if (!user) {
        user = {
          _id: "demo_usr_sharma",
          name: "Dr. K. Sharma",
          email: "sharma.met@atmos-intel.org"
        };
      }
      const storageMode = userService.isUsingMongo() ? "mongodb" : "local";
      return res.json({
        token: token(user),
        user: { id: user._id || "demo_usr_sharma", name: user.name || "Dr. K. Sharma", email: cleanEmail },
        storageMode,
        isDemo: true
      });
    }

    // Standard Sign In: Strictly enforce brute force rate limit
    const rateCheck = checkRateLimit(clientKey);
    if (!rateCheck.allowed) {
      return res.status(429).json({ message: rateCheck.message });
    }

    if (!email || !password) {
      return res.status(400).json({ message: "Email and security key are required." });
    }

    const user = await userService.findByEmail(cleanEmail);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      recordFailedAttempt(clientKey);
      return res.status(401).json({ message: "Invalid email address or security key credentials." });
    }

    // Clear failed attempts upon successful authentication
    clearFailedAttempts(clientKey);

    const storageMode = userService.isUsingMongo() ? "mongodb" : "local";
    res.json({
      token: token(user),
      user: { id: user._id, name: user.name, email: user.email },
      storageMode
    });
  } catch (e) {
    next(e);
  }
});

export default router;
