import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  department: { type: String, required: true },
  college: { type: String, required: true },
  status: { type: String, default: "pending" }, // pending, approved, rejected
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("JoinRequest", joinRequestSchema);
