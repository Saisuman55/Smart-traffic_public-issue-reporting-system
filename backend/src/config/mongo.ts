import mongoose from "mongoose";

export const connectMongo = async () => {
  try {
    console.log("Trying to connect Mongo...");
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/civicDB";
    await mongoose.connect(uri);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("❌ Mongo Error:", err);
  }
};