import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { connectMongo } from "./src/config/mongo.js";
import authRoutes from "./src/routes/auth.js";
import issueRoutes from "./src/routes/issues.js";
import userRoutes from "./src/routes/users.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB connect
connectMongo();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/users", userRoutes);

// Notifications (in-memory — persists while server is running)
const notifications: any[] = [];

app.get("/api/notifications/:uid", (req, res) => {
  res.json(notifications.filter(n => n.recipientUid === req.params.uid).reverse());
});

app.post("/api/notifications", (req, res) => {
  const n = { ...req.body, id: Math.random().toString(36).substr(2, 9), read: false };
  notifications.push(n);
  res.json(n);
});

app.patch("/api/notifications/:id/read", (req, res) => {
  const n = notifications.find(n => n.id === req.params.id);
  if (n) n.read = true;
  res.json({ msg: "Marked as read" });
});

// Settings
let settings = { autoAiVerification: true };
app.get("/api/settings", (_req, res) => res.json(settings));
app.patch("/api/settings", (req, res) => {
  settings = { ...settings, ...req.body };
  res.json(settings);
});

// Stats
app.get("/api/stats", async (_req, res) => {
  try {
    const User = (await import("./src/models/User.js")).default;
    const activeUsers = await User.countDocuments();
    res.json({ activeUsers });
  } catch {
    res.json({ activeUsers: 0 });
  }
});

// Health check v2
app.get("/health", (_req, res) => res.json({ status: "ok", version: 2 }));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
