import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String, unique: true, sparse: true },
  phone:       { type: String, unique: true, sparse: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ["user", "admin"], default: "user" },
  score:       { type: Number, default: 50 },
  isBanned:    { type: Boolean, default: false },
  photoURL:    { type: String, default: null },
  bio:         { type: String, default: '' },
  location:    { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
