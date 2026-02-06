// models/CallRequest.js
import mongoose from "mongoose";

const CallRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  language: { type: String, default: "English" },
  bestTime: { type: String, default: "As soon as possible" },
  notes: { type: String },
  status: { 
    type: String, 
    enum: ["pending", "assigned", "in-progress", "awaiting-feedback", "completed", "rejected"],
    default: "pending" 
  },
  role: { type: String, enum: ["user", "staff"], default: "user" },
  socketId: { type: String },
  userSocketId: { type: String }, // For user who created the request
  
  // QUEUE SYSTEM FIELDS
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    default: null 
  },
  assignedAt: { type: Date },
  assignedStaffName: { type: String },
  
  // Feedback fields
  rating: { type: String },
  suggestion: { type: String },
  feedbackDone: { type: Boolean, default: false },
  completedAt: { type: Date },
  
  // Call details
  callStartedAt: { type: Date },
  callEndedAt: { type: Date },
  callDuration: { type: Number }, // in seconds
  
}, { timestamps: true });

const CallRequest = mongoose.model("CallRequest", CallRequestSchema);

export default CallRequest;