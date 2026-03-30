import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  id:          String,
  authorUid:   String,
  authorName:  String,
  authorPhoto: String,
  text:        String,
  createdAt:   String,
}, { _id: false });

const issueSchema = new mongoose.Schema({
  id:              { type: String, required: true, unique: true },
  reporterUid:     String,
  category:        String,
  description:     String,
  imageUrl:        String,
  latitude:        Number,
  longitude:       Number,
  address:         String,
  landmark:        String,
  status:          { type: String, default: "Pending" },
  isFake:          { type: Boolean, default: false },
  aiConfidence:    { type: Number, default: 0 },
  aiReasoning:     String,
  rejectionReason: String,
  upvotes:         { type: [String], default: [] },
  comments:        { type: [commentSchema], default: [] },
  createdAt:       String,
  updatedAt:       String,
}, { timestamps: false });

export default mongoose.model("Issue", issueSchema);
