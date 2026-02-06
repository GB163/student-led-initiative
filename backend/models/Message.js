import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  role: { type: String, enum: ["user", "staff"], required: true },
  socketId: { type: String },
}, { timestamps: true });

const Message = mongoose.model("Message", MessageSchema);

export default Message;
