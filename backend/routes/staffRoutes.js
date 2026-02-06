// routes/staffRoutes.js
import express from "express";
import {
  getStaffDashboardData,
  createCallRequest,
  createMessage,
} from "../controllers/staffcontroller.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// ✅ Staff Dashboard / Actions
router.get('/dashboard', protect, authorizeRoles('staff', 'admin'), getStaffDashboardData);
router.post("/call", protect, authorizeRoles("staff"), createCallRequest);
router.post("/message", protect, authorizeRoles("staff"), createMessage);

export default router;