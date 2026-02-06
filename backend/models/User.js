// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: true 
    },

    // ⭐ Password history to prevent password reuse
    passwordHistory: { 
      type: [String], 
      default: [], 
      select: false 
    },

    role: { 
      type: String, 
      enum: ["user", "staff", "admin"], 
      default: "user" 
    },
    blocked: { 
      type: Boolean, 
      default: false 
    },
    resetToken: { 
      type: String 
    },

    // ✅ Profile fields
    phone: { 
      type: String, 
      default: null, 
      sparse: true 
    },
    address: { 
      type: String, 
      default: "" 
    },
    profilePic: { 
      type: String, 
      default: "" 
    },
    profilePicPublicId: { 
      type: String, 
      default: "" 
    },

    // Staff queue system fields
    agentStatus: { 
      type: String, 
      enum: ["available", "busy", "offline"], 
      default: "offline" 
    },
    currentCallId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "CallRequest", 
      default: null 
    },
    lastActiveAt: { 
      type: Date 
    },

    // Staff performance stats
    totalCallsHandled: { 
      type: Number, 
      default: 0 
    },
    averageRating: { 
      type: Number, 
      default: 0 
    },

    // Verification and reset management
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,

  },
  { timestamps: true }
);

// 🔍 Indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ agentStatus: 1 });


// 🔐 Pre-save hook to hash password and update password history
userSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) return next();

  try {
    // Add current password to history before overwriting (limit 5)
    if (!this.isNew) {
      const existingUser = await mongoose.models.User.findById(this._id).select("+passwordHistory +password");
      if (existingUser && existingUser.password) {
        this.passwordHistory = [
          existingUser.password,
          ...(existingUser.passwordHistory || []),
        ].slice(0, 5);
      }
    }

    // Skip rehashing if already hashed
    if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();

  } catch (error) {
    console.error("❌ Error hashing password:", error);
    next(error);
  }
});


// 🧠 Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};


// 🚫 Check if password was used recently
userSchema.methods.wasPasswordUsedRecently = async function (password, numberOfPasswordsToCheck = 3) {
  if (!this.passwordHistory || this.passwordHistory.length === 0) {
    return false;
  }

  const historyToCheck = this.passwordHistory.slice(0, numberOfPasswordsToCheck);
  for (const oldPassword of historyToCheck) {
    const isMatch = await bcrypt.compare(password, oldPassword);
    if (isMatch) return true;
  }

  return false;
};


// 🔑 Generate secure password reset token (hashed storage)
userSchema.methods.generateResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken; // Send plain token to user (via email)
};


export default mongoose.model("User", userSchema);
