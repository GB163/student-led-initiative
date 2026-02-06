// controllers/staffController.js
import User from "../models/User.js";
import CallRequest from "../models/CallRequest.js";
import Message from "../models/Message.js";

// @desc    Get staff dashboard data
// @route   GET /api/staff/dashboard
// @access  Private/Staff
export const getStaffDashboardData = async (req, res) => {
  try {
    const staffId = req.user.id;

    console.log('📊 Fetching dashboard data for staff:', staffId);

    const callRequests = await CallRequest.find({ staffId })
      .sort({ createdAt: -1 })
      .limit(50);

    const messages = await Message.find({ staffId })
      .sort({ createdAt: -1 })
      .limit(50);

    const staff = await User.findById(staffId).select('-password');

    console.log('✅ Dashboard data fetched:', {
      callRequestsCount: callRequests.length,
      messagesCount: messages.length,
      staffName: staff?.name,
    });

    res.status(200).json({
      success: true,
      data: {
        staff,
        callRequests,
        messages,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching staff dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};

// @desc    Create a new call request
// @route   POST /api/staff/call
// @access  Private/Staff
export const createCallRequest = async (req, res) => {
  try {
    const { patientName, phoneNumber, reason, priority } = req.body;
    const staffId = req.user.id;

    console.log('📞 Creating call request:', { patientName, phoneNumber, reason, priority });

    if (!patientName || !phoneNumber || !reason) {
      return res.status(400).json({
        success: false,
        message: "Please provide patient name, phone number, and reason",
      });
    }

    const callRequest = await CallRequest.create({
      staffId,
      patientName,
      phoneNumber,
      reason,
      priority: priority || "normal",
      status: "pending",
    });

    console.log('✅ Call request created:', callRequest._id);

    res.status(201).json({
      success: true,
      message: "Call request created successfully",
      data: callRequest,
    });
  } catch (error) {
    console.error("❌ Error creating call request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create call request",
      error: error.message,
    });
  }
};

// @desc    Create a new message
// @route   POST /api/staff/message
// @access  Private/Staff
export const createMessage = async (req, res) => {
  try {
    const { subject, content, recipient } = req.body;
    const staffId = req.user.id;

    console.log('💬 Creating message:', { subject, content, recipient });

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: "Please provide subject and content",
      });
    }

    const message = await Message.create({
      staffId,
      subject,
      content,
      recipient: recipient || "admin",
      status: "sent",
    });

    console.log('✅ Message created:', message._id);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("❌ Error creating message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

export default {
  getStaffDashboardData,
  createCallRequest,
  createMessage,
};