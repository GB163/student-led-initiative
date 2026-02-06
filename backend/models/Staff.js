// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// -------------------- User Schema --------------------
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "staff", "admin"], default: "user" },
    profilePic: { type: String, default: null },
    blocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// -------------------- Password Hash Middleware --------------------
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// -------------------- Compare Password Method --------------------
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// -------------------- Export Model --------------------
const User = mongoose.model("User", userSchema);
export default User;
