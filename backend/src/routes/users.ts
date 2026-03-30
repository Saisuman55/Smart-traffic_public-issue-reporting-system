import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Helper to format user for frontend
const formatUser = (u: any) => ({
  uid: u._id.toString(),
  email: u.email || '',
  displayName: u.name || u.displayName || 'User',
  role: u.role || 'user',
  trustScore: u.score ?? u.trustScore ?? 50,
  photoURL: u.photoURL || null,
  bio: u.bio || '',
  location: u.location || '',
  joinedAt: u.createdAt?.toISOString() || new Date().toISOString(),
  lastActive: u.updatedAt?.toISOString() || null,
});

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.json(users.map(formatUser));
  } catch {
    res.status(500).json({ msg: "Error fetching users" });
  }
});

// GET user by uid
router.get("/:uid", async (req, res) => {
  try {
    const user = await User.findById(req.params.uid, { password: 0 });
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(formatUser(user));
  } catch {
    res.status(500).json({ msg: "Error fetching user" });
  }
});

// POST update user profile
router.post("/", async (req, res) => {
  try {
    const { uid, displayName, bio, location, role, trustScore, joinedAt } = req.body;
    if (!uid) return res.status(400).json({ msg: "uid required" });

    const updates: any = {};
    if (displayName) updates.name = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (role) updates.role = role;
    if (trustScore !== undefined) updates.score = trustScore;
    if (joinedAt) updates.createdAt = new Date(joinedAt);

    const user = await User.findByIdAndUpdate(uid, updates, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(formatUser(user));
  } catch {
    res.status(500).json({ msg: "Error updating user" });
  }
});

// DELETE user
router.delete("/:uid", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.uid);
    res.json({ msg: "User deleted" });
  } catch {
    res.status(500).json({ msg: "Error deleting user" });
  }
});

export default router;
