// models/contactModel.js
import mongoose from "mongoose";

const contactSchema = mongoose.Schema(
  {
    // For contact form submissions (original fields - keep these)
    name: { type: String },
    email: { type: String },
    subject: { type: String },
    message: { type: String },
    
    // NEW FIELDS for chat messages (Socket.io)
    socketId: { type: String },
    userName: { type: String },
    staffName: { type: String },
    text: { type: String },
    role: { type: String, enum: ["user", "staff"] },
  },
  { timestamps: true }
);

const Contact = mongoose.model("Contact", contactSchema);
export default Contact;