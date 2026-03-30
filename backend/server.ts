import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { connectMongo } from "./src/config/mongo.js";
import authRoutes from "./src/routes/auth.js";
import issueRoutes from "./src/routes/issues.js";
import userRoutes from "./src/routes/users.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB connect
connectMongo();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/users", userRoutes);

// Notifications (simple in-memory store, replace with DB if needed)
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
app.get("/api/settings", (req, res) => res.json(settings));
app.patch("/api/settings", (req, res) => {
  settings = { ...settings, ...req.body };
  res.json(settings);
});

// Stats
app.get("/api/stats", async (req, res) => {
  try {
    const User = (await import("./src/models/User.js")).default;
    const activeUsers = await User.countDocuments();
    res.json({ activeUsers });
  } catch {
    res.json({ activeUsers: 0 });
  }
});

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
