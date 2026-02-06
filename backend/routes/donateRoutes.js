// backend/routes/donateRoutes.js
import express from "express";
import {
  createOrder,
  capturePayment,
  getAllDonations,
  getStats
} from "../controllers/DonateController.js";

const router = express.Router();

// ======================
// 1️⃣ Create PayU Order
// POST /api/donations/create-order
// ======================
router.post("/create-order", createOrder);

// ======================
// 2️⃣ PayU Success Callback
// POST /api/donations/success
// ======================
router.post("/success", capturePayment);

// ======================
// 3️⃣ PayU Failure Callback
// POST /api/donations/failure
// ======================
router.post("/failure", capturePayment);

// ======================
// 4️⃣ Get All Donations
// GET /api/donations
// ======================
router.get("/", getAllDonations);

// ======================
// 5️⃣ Get Donation Statistics
// GET /api/donations/stats
// ======================
router.get("/stats", getStats);

export default router;