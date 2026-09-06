import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userService } from "../services/userService.js";

const router = Router();

function token(user) {
  const id = user._id ? user._id.toString() : user.id;
  return jwt.sign(
    { id, email: user.email, name: user.name },
    process.env.JWT_SECRET || "development-only-secret",
    { expiresIn: "7d" }
  );
}

router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await userService.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userService.create({ name, email, passwordHash });
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
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await userService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

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
