import mongoose from "mongoose";

export const connectMongo = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/civicDB";
    await mongoose.connect(uri);
    console.log("MongoDB Connected!");
  } catch (err: any) {
    console.error("MongoDB Error:", err.message);
    // Don't exit - let server run even without DB
  }
};
