// routes/adminRoutes.js
import express from "express";
import {
  getAllUsers,
  getUserCount,
  getStaffJoinRequests,
  getDonations,
  getActiveEvents,
  blockUser,      // Add this
  unblockUser,    // Add this
  deleteUser,     // Add this
} from "../controllers/AdminControllers.js";
import {
  getAllApplications,
  approveApplication,
  rejectApplication,
} from "../controllers/MedicalController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// All routes below are accessible only by admin users
router.use(protect);
router.use(authorizeRoles("admin"));

// Users
router.get("/users", getAllUsers);
router.get("/users/count", getUserCount);
router.put("/users/:id/block", blockUser);      // Add this
router.put("/users/:id/unblock", unblockUser);  // Add this
router.delete("/users/:id", deleteUser);        // Add this

// Staff join requests
router.get("/join-requests", getStaffJoinRequests);

// Donations
router.get("/donations", getDonations);

// Events
router.get("/events/active", getActiveEvents);

// Medical Support Applications
router.get("/medical", getAllApplications);
router.patch("/medical/:id/approve", approveApplication);
router.patch("/medical/:id/reject", rejectApplication);

export default router;