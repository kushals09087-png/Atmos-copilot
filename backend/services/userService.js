import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function ensureLocalStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]), "utf-8");
  }
}

function readLocalUsers() {
  ensureLocalStore();
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function writeLocalUsers(users) {
  ensureLocalStore();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export const userService = {
  isUsingMongo() {
    return isMongoConnected();
  },

  async findByEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (isMongoConnected()) {
      return await User.findOne({ email: cleanEmail });
    }
    const users = readLocalUsers();
    return users.find(u => u.email.toLowerCase() === cleanEmail) || null;
  },

  async create({ name, email, passwordHash }) {
    const cleanEmail = email.trim().toLowerCase();
    if (isMongoConnected()) {
      return await User.create({ name: name.trim(), email: cleanEmail, password: passwordHash });
    }
    const users = readLocalUsers();
    const newUser = {
      _id: "usr_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      email: cleanEmail,
      password: passwordHash,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeLocalUsers(users);
    return newUser;
  }
};
