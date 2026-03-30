import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isAdminEmail } from "../config/adminEmails.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-me";

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: isAdminEmail(email) ? "admin" : "user",
    });

    res.json({ msg: "User registered", user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Register error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "No account found with this email" });
    }

    if (isAdminEmail(email) && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    if (user.isBanned) {
      return res.status(403).json({ msg: "Your account has been banned" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        score: user.score,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Login error" });
  }
});

// FORGOT PASSWORD — sends reset token (stored in DB)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "No account found with this email" });

    // Generate a simple reset token
    const resetToken = Math.random().toString(36).substr(2, 8).toUpperCase();
    const hashed = await bcrypt.hash(resetToken, 10);

    // Store token in user record
    await User.findByIdAndUpdate(user._id, {
      resetToken: hashed,
      resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
    });

    // In production you'd send an email — for now return the token directly
    res.json({ msg: "Reset token generated", resetToken, email });
  } catch (err) {
    res.status(500).json({ msg: "Error generating reset token" });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const user = await User.findOne({ email }) as any;
    if (!user || !user.resetToken) {
      return res.status(400).json({ msg: "Invalid or expired reset token" });
    }

    if (user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ msg: "Reset token has expired" });
    }

    const isMatch = await bcrypt.compare(resetToken, user.resetToken);
    if (!isMatch) return res.status(400).json({ msg: "Invalid reset token" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user._id, {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null
    });

    res.json({ msg: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Error resetting password" });
  }
});

export default router;
