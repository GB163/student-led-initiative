import express from "express";
import CallRequest from "../models/CallRequest.js";
import { protect } from "../middleware/auth.js";
import ExcelJS from "exceljs";

const router = express.Router();

// ✅ NEW ENDPOINT - Get all pending calls + my assigned calls for staff
router.get("/staff-queue/:staffId", protect, async (req, res) => {
  try {
    const { staffId } = req.params;
    
    console.log("📞 Fetching staff queue for:", staffId);
    
    // Get both pending unassigned calls AND calls assigned to this staff
    const calls = await CallRequest.find({
      $or: [
        { status: "pending", assignedTo: null }, // Unassigned pending calls
        { assignedTo: staffId, status: { $in: ["assigned", "in-progress", "awaiting-feedback"] } } // My assigned calls
      ]
    }).sort({ createdAt: -1 }); // Newest first
    
    console.log(`✅ Found ${calls.length} calls for staff ${staffId}`);
    console.log(`   - Pending: ${calls.filter(c => c.status === "pending").length}`);
    console.log(`   - Assigned to me: ${calls.filter(c => c.assignedTo?.toString() === staffId).length}`);
    
    res.json(calls);
  } catch (error) {
    console.error("❌ Error fetching staff queue:", error);
    res.status(500).json({ message: "Failed to fetch call requests" });
  }
});

// ✅ KEEP OLD ENDPOINT for backward compatibility (but it's limited)
router.get("/my-queue/:staffId", protect, async (req, res) => {
  try {
    const { staffId } = req.params;
    const calls = await CallRequest.find({
      assignedTo: staffId,
      status: { $in: ["assigned", "in-progress", "awaiting-feedback"] }
    }).sort({ createdAt: -1 });
    
    res.json(calls);
  } catch (error) {
    console.error("❌ Error fetching my queue:", error);
    res.status(500).json({ message: "Failed to fetch assigned calls" });
  }
});

// ✅ Get all call requests (for admin/dashboard)
router.get("/", protect, async (req, res) => {
  try {
    const calls = await CallRequest.find().sort({ createdAt: -1 });
    res.json(calls);
  } catch (error) {
    console.error("❌ Error fetching all calls:", error);
    res.status(500).json({ message: "Failed to fetch call requests" });
  }
});

// ✅ Download Excel
router.get("/download/excel", protect, async (req, res) => {
  try {
    const calls = await CallRequest.find().sort({ createdAt: -1 });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Call Requests");
    
    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Language", key: "language", width: 15 },
      { header: "Best Time", key: "bestTime", width: 20 },
      { header: "Notes", key: "notes", width: 30 },
      { header: "Status", key: "status", width: 15 },
      { header: "Assigned To", key: "assignedStaffName", width: 20 },
      { header: "Rating", key: "rating", width: 12 },
      { header: "Suggestion", key: "suggestion", width: 30 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];
    
    calls.forEach((call) => {
      worksheet.addRow({
        name: call.name,
        phone: call.phone,
        language: call.language,
        bestTime: call.bestTime,
        notes: call.notes || "N/A",
        status: call.status,
        assignedStaffName: call.assignedStaffName || "Not Assigned",
        rating: call.rating || "N/A",
        suggestion: call.suggestion || "N/A",
        createdAt: call.createdAt.toLocaleString(),
      });
    });
    
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=call_requests_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Error generating Excel:", error);
    res.status(500).json({ message: "Failed to generate Excel file" });
  }
});

// ✅ Delete call request
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    await CallRequest.findByIdAndDelete(id);
    
    // Emit socket event to notify frontend
    const io = req.app.get("io");
    if (io) {
      io.emit("callDeleted", { id });
    }
    
    res.json({ message: "Call request deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting call:", error);
    res.status(500).json({ message: "Failed to delete call request" });
  }
});

export default router;