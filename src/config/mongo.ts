import mongoose from "mongoose";
import User from "../models/User.js";
import { getAdminEmails } from "./adminEmails.js";

export const connectMongo = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/civicDB";
    await mongoose.connect(uri);
    console.log("MongoDB Connected!");

    const adminEmails = [...getAdminEmails()];
    if (adminEmails.length > 0) {
      const result = await User.updateMany(
        { email: { $in: adminEmails } },
        { $set: { role: "admin" } }
      );
      if (result.modifiedCount > 0) {
        console.log(`Promoted ${result.modifiedCount} owner account(s) to admin.`);
      }
    }
  } catch (err: any) {
    console.error("MongoDB Error:", err.message);
    // Don't exit - let server run even without DB
  }
};
