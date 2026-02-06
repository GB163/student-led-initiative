// controllers/userController.js
import User from "../models/User.js";
import JoinRequest from "../models/JoinRequest.js";

// ------------------ CONTROLLERS ------------------

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("❌ getAllUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    console.log("🗑️ Deleting user:", user.email);

    // Reset join request status to pending
    const joinRequest = await JoinRequest.findOne({ email: user.email });
    
    if (joinRequest) {
      if (joinRequest.status === 'approved') {
        joinRequest.status = 'pending';
        await joinRequest.save();
        console.log("✅ Reset join request to pending");
      }
    }

    await user.deleteOne();
    console.log("✅ User deleted successfully");

    res.json({ 
      message: "User deleted successfully",
      resetJoinRequest: !!joinRequest
    });
    
  } catch (err) {
    console.error("❌ deleteUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user completely (with join request)
export const deleteUserCompletely = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    console.log("🗑️ Completely deleting user:", user.email);

    await user.deleteOne();
    await JoinRequest.findOneAndDelete({ email: user.email });
    
    console.log("✅ User and join request deleted");

    res.json({ message: "User and join request deleted successfully" });
  } catch (err) {
    console.error("❌ deleteUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Block / Unblock user
export const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.blocked = !user.blocked;
    await user.save();

    res.json({
      message: user.blocked ? "User blocked" : "User unblocked",
      blocked: user.blocked,
    });
  } catch (err) {
    console.error("❌ toggleBlockUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get total user count
export const getUserCount = async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error("❌ getUserCount error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Middleware to check blocked user
export const checkBlockedUser = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && user.blocked) {
      return res.status(403).json({ message: "This account has been blocked." });
    }
    next();
  } catch (err) {
    console.error("❌ checkBlockedUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};