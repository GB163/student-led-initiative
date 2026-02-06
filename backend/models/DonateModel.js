// backend/models/DonateModel.js
import mongoose from "mongoose";

const donateSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String 
    },
    collegeName: { 
      type: String 
    },
    collegeID: { 
      type: String 
    },
    rollNumber: { 
      type: String 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    paymentId: { 
      type: String, 
      required: true 
    },
    orderId: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      enum: ["student", "professional", "user", "staff"], 
      default: "user" 
    },
    donationType: {
      type: String,
      enum: ["one-time", "yearly", "monthly"],
      default: "one-time"
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "pending"
    }
  },
  { timestamps: true }
);

const Donate = mongoose.model("Donate", donateSchema);
export default Donate;