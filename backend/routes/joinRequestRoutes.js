import express from "express";
import JoinRequest from "../models/JoinRequest.js";
import User from "../models/User.js";
import { sendEmail } from "../config/Emailconfig.js"; // ✅ Import sendEmail instead of transporter
import { notifyJoinRequest, notifyAdmins } from "../utils/notificationHelper.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Debug middleware - logs all requests
router.use((req, res, next) => {
  console.log("=".repeat(60));
  console.log(`📡 JOIN REQUEST: ${req.method} ${req.originalUrl}`);
  console.log("📱 User-Agent:", req.get("User-Agent"));
  console.log("📥 Body:", JSON.stringify(req.body, null, 2));
  console.log("=".repeat(60));
  next();
});

// ==========================================
// POST - Submit Join Us form
// ==========================================
router.post("/join-requests", async (req, res) => {
  try {
    const { name, email, role, department, college, rollNumber, specificRole, userId } = req.body;
    
    console.log("✅ Received join request for:", email);
    
    // Basic validation
    if (!name || !email || !role) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ 
        success: false,
        message: "Name, email, and role are required" 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format:", email);
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    // Role-specific validation
    if (role === "Student") {
      if (!department || !college || !rollNumber || !specificRole) {
        console.log("❌ Missing student fields");
        return res.status(400).json({ 
          success: false,
          message: "Students must provide department, college, roll number, and specific role" 
        });
      }
    } else if (role === "Job") {
      if (!specificRole) {
        console.log("❌ Missing job role");
        return res.status(400).json({ 
          success: false,
          message: "Please select a specific role" 
        });
      }
    }

    // Check for existing requests
    const existingRequest = await JoinRequest.findOne({ 
      email: email.trim().toLowerCase(),
      status: { $in: ['pending', 'approved'] }
    });
    
    if (existingRequest) {
      console.log("⚠️ Active request found for:", email, "Status:", existingRequest.status);
      
      if (existingRequest.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: "You have already been approved! Please log in with your account."
        });
      }
      
      if (existingRequest.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: "You already have a pending application. Please check your email or wait for admin review."
        });
      }
    }

    // Create new join request
    const joinRequest = new JoinRequest({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      department: department || "N/A",
      college: college || "N/A",
      rollNumber: rollNumber || "N/A",
      specificRole: specificRole || "N/A",
      status: "pending",
    });

    const savedRequest = await joinRequest.save();
    
    console.log("✅ Join request saved successfully!");
    console.log("📝 ID:", savedRequest._id);
    console.log("👤 Name:", savedRequest.name);
    console.log("📧 Email:", savedRequest.email);

    // 🔔 SEND NOTIFICATIONS
    try {
      const applicantId = userId || req.user?._id;
      
      if (applicantId) {
        await notifyJoinRequest.applied(
          applicantId,
          savedRequest.name,
          savedRequest._id
        );
        console.log('🔔 Join request notifications sent successfully');
      } else {
        await notifyAdmins({
          title: 'New Volunteer Application',
          message: `${savedRequest.name} applied as ${savedRequest.specificRole} in ${savedRequest.department}`,
          type: 'application',
          link: '/admin/join-requests'
        });
        console.log('🔔 Admin notification sent (guest application)');
      }

      const totalApplications = await JoinRequest.countDocuments();
      if (totalApplications % 25 === 0 && totalApplications > 0) {
        await notifyAdmins({
          title: `🎯 Milestone: ${totalApplications} Applications!`,
          message: `We've received ${totalApplications} volunteer applications!`,
          type: 'success',
          link: '/admin/join-requests'
        });
        console.log(`🎯 Application milestone ${totalApplications} reached!`);
      }
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    // ✅ FIXED: Send confirmation email using Brevo
    try {
      console.log('📧 Preparing to send confirmation email...');
      
      await sendEmail({
        to: savedRequest.email,
        subject: "Application Received! 🎉",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #667eea;">Thank You for Your Interest! 💙</h2>
            <p>Hi ${savedRequest.name},</p>
            <p>We've received your application to join our mission as <strong>${savedRequest.specificRole}</strong>.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Application Details:</h3>
              <p><strong>Role:</strong> ${savedRequest.role}</p>
              <p><strong>Department:</strong> ${savedRequest.department}</p>
              ${savedRequest.role === 'Student' ? `<p><strong>College:</strong> ${savedRequest.college}</p>` : ''}
              <p><strong>Specific Role:</strong> ${savedRequest.specificRole}</p>
            </div>
            <p>Our team will review your application and get back to you soon.</p>
            <p>Thank you for wanting to make a difference! ❤️</p>
            <br>
            <p>Best regards,<br><strong>The Team</strong></p>
          </div>
        `
      });
      
      console.log("✅ Confirmation email sent to:", savedRequest.email);
    } catch (emailErr) {
      console.error("⚠️ Failed to send confirmation email:", emailErr.message);
      console.error("⚠️ Email error details:", emailErr);
      // Don't fail the request if email fails
    }

    res.status(201).json({ 
      success: true,
      message: "Join request submitted successfully! Check your email for confirmation.", 
      data: savedRequest 
    });
    
  } catch (err) {
    console.error("❌ Error in POST /join-requests:", err);
    
    try {
      await notifyAdmins({
        title: '🚨 Error Processing Join Request',
        message: `Failed to process volunteer application: ${err.message}`,
        type: 'error',
        link: '/admin/join-requests'
      });
    } catch (notifError) {
      console.error('⚠️ Error notification failed:', notifError.message);
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error while saving join request. Please try again.", 
      error: err.message 
    });
  }
});

// ==========================================
// PATCH - Approve join request
// ==========================================
router.patch("/join-requests/:id/approve", async (req, res) => {
  try {
    console.log("✅ Approving join request:", req.params.id);
    
    const request = await JoinRequest.findById(req.params.id);
    
    if (!request) {
      console.log("❌ Join request not found");
      return res.status(404).json({
        success: false,
        message: "Join request not found"
      });
    }

    if (request.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: "This request has already been approved"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: request.email });
    if (existingUser) {
      console.log("⚠️ User already exists:", existingUser.email);
      return res.status(400).json({
        success: false,
        message: "User with this email already exists. If the user was deleted, please delete the join request first."
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Determine user role
    let userRole = "user";
    if (request.specificRole.includes("Team Lead") || request.specificRole.includes("Manager")) {
      userRole = "staff";
    }

    // Create new user
    const newUser = new User({
      name: request.name,
      email: request.email,
      password: hashedPassword,
      role: userRole,
      department: request.department,
    });

    await newUser.save();
    console.log("✅ User account created:", newUser.email);

    // Update join request status
    request.status = "approved";
    await request.save();

    // ✅ FIXED: Send approval email using Brevo
    try {
      await sendEmail({
        to: request.email,
        subject: "Welcome to the Team! 🎉",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #667eea;">Congratulations! Your Application is Approved! 🎉</h2>
            <p>Hi ${request.name},</p>
            <p>We're excited to have you join us as <strong>${request.specificRole}</strong>!</p>
            
            <div style="background: #667eea; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${request.email}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 6px;">
              <p style="color: #856404; margin: 0;">
                ⚠️ <strong>Important:</strong> Please change your password after your first login for security.
              </p>
            </div>
            
            <p>You can now login to access your dashboard and start making an impact!</p>
            <p>Welcome aboard! 🚀</p>
            <br>
            <p>Best regards,<br><strong>The Team</strong></p>
          </div>
        `
      });
      console.log("✅ Approval email sent to:", request.email);
    } catch (emailErr) {
      console.error("⚠️ Failed to send approval email:", emailErr.message);
    }

    // Send notifications
    try {
      await notifyJoinRequest.approved(
        newUser._id,
        request.name,
        request.specificRole
      );
      console.log('🔔 Approval notification sent');
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    res.json({
      success: true,
      message: "Join request approved and user account created",
      data: {
        user: newUser,
        request: request
      }
    });

  } catch (err) {
    console.error("❌ Error in PATCH /join-requests/:id/approve:", err);
    res.status(500).json({
      success: false,
      message: "Server error while approving request",
      error: err.message
    });
  }
});

// ==========================================
// PATCH - Reject join request
// ==========================================
router.patch("/join-requests/:id/reject", async (req, res) => {
  try {
    console.log("🚫 Rejecting join request:", req.params.id);
    
    const { reason } = req.body;
    
    const request = await JoinRequest.findById(req.params.id);
    
    if (!request) {
      console.log("❌ Join request not found");
      return res.status(404).json({
        success: false,
        message: "Join request not found"
      });
    }

    if (request.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: "This request has already been rejected"
      });
    }

    // Update status to rejected
    request.status = "rejected";
    request.rejectionReason = reason || "Not specified";
    await request.save();

    // ✅ FIXED: Send rejection email using Brevo
    try {
      await sendEmail({
        to: request.email,
        subject: "Update on Your Application",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #667eea;">Thank You for Your Interest</h2>
            <p>Hi ${request.name},</p>
            <p>Thank you for your interest in joining our team.</p>
            <p>After careful review, we regret to inform you that we are unable to proceed with your application at this time.</p>
            ${reason ? `
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Reason:</strong> ${reason}</p>
              </div>
            ` : ''}
            <p>We encourage you to apply again in the future when opportunities align better with your profile.</p>
            <p>We appreciate your interest and wish you all the best!</p>
            <br>
            <p>Best regards,<br><strong>The Team</strong></p>
          </div>
        `
      });
      console.log("✅ Rejection email sent to:", request.email);
    } catch (emailErr) {
      console.error("⚠️ Failed to send rejection email:", emailErr.message);
    }

    // Send notification
    try {
      const user = await User.findOne({ email: request.email });
      if (user) {
        await notifyJoinRequest.rejected(
          user._id,
          request.name,
          reason || "Not specified"
        );
      }
      console.log('🔔 Rejection notification sent');
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    res.json({
      success: true,
      message: "Join request rejected",
      data: request
    });

  } catch (err) {
    console.error("❌ Error in PATCH /join-requests/:id/reject:", err);
    res.status(500).json({
      success: false,
      message: "Server error while rejecting request",
      error: err.message
    });
  }
});

// ==========================================
// GET & DELETE routes remain the same
// ==========================================
router.get("/join-requests", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const requests = await JoinRequest.find(filter)
      .sort({ createdAt: -1 });
    
    console.log(`✅ Fetched ${requests.length} join requests`);
    
    const pendingRequests = requests.filter(req => req.status === 'pending');
    
    if (pendingRequests.length >= 5) {
      try {
        await notifyAdmins({
          title: '⚠️ Multiple Pending Applications',
          message: `There are ${pendingRequests.length} pending volunteer applications awaiting review`,
          type: 'warning',
          link: '/admin/join-requests'
        });
      } catch (notifError) {
        console.error('⚠️ Notification failed:', notifError.message);
      }
    }
    
    res.json({ 
      success: true,
      message: "Join requests fetched successfully", 
      count: requests.length,
      data: requests 
    });
  } catch (err) {
    console.error("❌ Error in GET /join-requests:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching requests",
      error: err.message
    });
  }
});

router.get("/join-requests/:id", async (req, res) => {
  try {
    const request = await JoinRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Join request not found"
      });
    }
    
    res.json({
      success: true,
      data: request
    });
  } catch (err) {
    console.error("❌ Error in GET /join-requests/:id:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
});

router.delete("/join-requests/:id", async (req, res) => {
  try {
    console.log("🗑️ Deleting join request:", req.params.id);
    
    const request = await JoinRequest.findByIdAndDelete(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Join request not found"
      });
    }

    console.log("✅ Join request deleted:", request.email);

    res.json({
      success: true,
      message: "Join request deleted successfully",
      data: request
    });

  } catch (err) {
    console.error("❌ Error in DELETE /join-requests/:id:", err);
    res.status(500).json({
      success: false,
      message: "Server error while deleting request",
      error: err.message
    });
  }
});

export default router;