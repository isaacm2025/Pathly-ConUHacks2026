import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectDB } from "./db.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("ENV CHECK:", process.env.MONGO_URL ? "LOADED" : "MISSING");
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Add it to server/.env");
}

const app = express();
app.use(cors());
app.use(express.json());

const db = await connectDB();
const users = db.collection("users");
await Promise.all([
  users.createIndex({ email: 1 }, { unique: true }),
  users.createIndex({ username: 1 }, { unique: true })
]);

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeUsername = (value) => String(value || "").trim();
const normalizePriority = (value) => (value === "speed" ? "speed" : "safety");

app.get("/", (req, res) => {
  res.send("Pathly backend running");
});

app.post("/auth/register", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || "");
    const priority = normalizePriority(req.body?.priority);

    if (!email || !username || !password) {
      return res.status(400).json({ error: "Email, username, and password are required." });
    }

    const existing = await users.findOne({
      $or: [{ email }, { username }]
    });

    if (existing) {
      return res.status(409).json({ error: "User exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await users.insertOne({
      email,
      username,
      passwordHash,
      priority,
      createdAt: new Date()
    });

    const token = jwt.sign({ sub: result.insertedId.toString(), email }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    return res.json({
      success: true,
      token,
      user: { email, username, priority }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "User exists" });
    }
    console.error("Register failed:", error);
    return res.status(500).json({ error: "Registration failed." });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash || "");
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign({ sub: user._id.toString(), email }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    return res.json({
      token,
      user: {
        email: user.email,
        username: user.username,
        priority: user.priority || "safety"
      }
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ error: "Login failed." });
  }
});


app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
});
