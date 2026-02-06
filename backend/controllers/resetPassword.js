// controllers/resetPassword.js - COMPLETE FIXED VERSION
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendEmail } from "../config/Emailconfig.js";

export const forgotPassword = async (req, res) => {
  // ⭐ CRITICAL: Set JSON header first
  res.setHeader('Content-Type', 'application/json');
  
  const { email, platform } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "User not found!" 
      });
    }

    // ============================================
    // 🚫 ADMIN PROTECTION: Block password reset
    // ============================================
    if (user.role === 'admin') {
      console.log(`⚠️ BLOCKED: Admin password reset attempt for ${email}`);
      
      return res.status(403).json({ 
        success: false,
        message: "Password reset is disabled for admin accounts. Please contact IT support directly.",
        adminBlocked: true
      });
    }

    // ============================================
    // Regular user password reset
    // ============================================
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Updated URLs
    const webUrl = 'https://studentledinitiative-frontend.vercel.app';
    const mobileUrl = 'https://mobile-app-zeta-red.vercel.app';
    const backendUrl = 'https://studentledinitiative.onrender.com';
    
    // Detect device from user agent
    const userAgent = req.headers['user-agent'] || '';
    const isMobileDevice = /Android|iPhone|iPad|iPod|okhttp/i.test(userAgent);
    
    // Always use redirect.html - it will handle device detection
    const redirectLink = `${backendUrl}/redirect.html?token=${token}`;
    
    // Direct links (for fallback in email)
    const mobileResetLink = `${mobileUrl}/reset-password/${token}`;
    const webResetLink = `${webUrl}/reset-password/${token}`;

    console.log(`📱 Device detected: ${isMobileDevice ? 'Mobile' : 'Desktop'}`);
    console.log(`🔗 Redirect link: ${redirectLink}`);

    // Email button - Always use redirect.html for smart routing
    const appButtonHTML = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #5856d6 0%, #764ba2 100%);">
                  <a href="${redirectLink}" 
                     target="_blank"
                     style="font-size: 16px; 
                            font-family: Arial, sans-serif; 
                            color: #ffffff !important; 
                            text-decoration: none; 
                            padding: 16px 40px; 
                            display: inline-block; 
                            font-weight: bold;
                            border-radius: 10px;">
                    🔐 Reset Password
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 12px; color: #666; margin: 0 0 8px 0; text-align: center;">
          If the button doesn't work, click this link:
        </p>
        <p style="text-align: center; margin: 0;">
          <a href="${redirectLink}" 
             target="_blank"
             style="font-size: 12px; 
                    color: #5856d6; 
                    word-break: break-all;
                    text-decoration: underline;">
            ${redirectLink}
          </a>
        </p>
      </div>
      
      <div style="background-color: #e3f2fd; padding: 12px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 11px; color: #1976d2; margin: 0; text-align: center;">
          💡 This link will automatically detect your device and redirect you to the correct page
        </p>
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #5856d6; margin: 0;">🔐 Password Reset Request</h2>
            </div>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 10px;">Hi ${user.name || "there"},</p>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 30px;">
              We received a request to reset your password for your Student-Led Initiative account. 
              Click the button below to reset your password:
            </p>
            
            ${appButtonHTML}
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 6px;">
              <p style="color: #856404; font-size: 13px; margin: 0; line-height: 1.5;">
                ⏰ <strong>Important:</strong> This link will expire in 1 hour for security reasons.
              </p>
            </div>
            
            <p style="color: #666; font-size: 13px; line-height: 1.6; margin-top: 25px;">
              If you didn't request a password reset, you can safely ignore this email. 
              Your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 5px 0;">
                Student-Led Initiative Team
              </p>
              <p style="color: #ccc; font-size: 11px; margin: 5px 0;">
                This is an automated email. Please do not reply.
              </p>
            </div>
            
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: email,
        subject: "Reset Your Password 🔑",
        html: htmlContent,
      });

      console.log("✅ Password reset email sent successfully to:", email);
      
      return res.status(200).json({ 
        success: true,
        message: "Password reset email sent! Please check your inbox." 
      });
    } catch (emailError) {
      console.error("❌ Email sending error:", emailError);
      
      return res.status(500).json({ 
        success: false,
        message: "Failed to send reset email. Please try again later or contact support." 
      });
    }

  } catch (err) {
    console.error("❌ forgotPassword error:", err);
    return res.status(500).json({ 
      success: false,
      message: "Failed to send reset email. Please try again later." 
    });
  }
};

export const resetPassword = async (req, res) => {
  // ⭐ CRITICAL: Set JSON header FIRST
  res.setHeader('Content-Type', 'application/json');
  
  // ⭐ Get token from URL params (primary) or body (fallback for compatibility)
  const token = req.params.token || req.body.token;
  const newPassword = req.body.newPassword || req.body.password;

  console.log("🔐 Reset password attempt");
  console.log("🎫 Token source:", req.params.token ? "URL params" : "Request body");
  console.log("🎫 Token:", token ? `${token.substring(0, 10)}...` : "Missing");
  console.log("🔑 Password:", newPassword ? "Present" : "Missing");

  if (!token) {
    console.log("❌ No token provided");
    return res.status(400).json({ 
      success: false,
      message: "Token is required" 
    });
  }

  if (!newPassword) {
    console.log("❌ No password provided");
    return res.status(400).json({ 
      success: false,
      message: "New password is required" 
    });
  }

  try {
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token verified for user ID:", decoded.userId);
    } catch (tokenError) {
      console.log("❌ Token verification failed:", tokenError.message);
      
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(400).json({ 
          success: false,
          message: "Token has expired. Please request a new password reset." 
        });
      }
      
      return res.status(400).json({ 
        success: false,
        message: "Invalid token. Please request a new password reset." 
      });
    }
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log("❌ User not found for ID:", decoded.userId);
      return res.status(400).json({ 
        success: false,
        message: "User not found. Please request a new password reset." 
      });
    }

    console.log("👤 User found:", user.email, `(Role: ${user.role})`);

    // Validate password
    if (newPassword.length < 6) {
      console.log("❌ Password too short");
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters long" 
      });
    }

    if (newPassword.length > 128) {
      console.log("❌ Password too long");
      return res.status(400).json({ 
        success: false,
        message: "Password is too long (maximum 128 characters)" 
      });
    }

    // ⭐ NEW: Check if new password matches current password
    console.log("🔍 Checking if password is same as current...");
    const isSameAsCurrentPassword = await bcrypt.compare(newPassword, user.password);
    
    if (isSameAsCurrentPassword) {
      console.log("❌ New password is same as current password");
      return res.status(400).json({ 
        success: false,
        message: "New password cannot be the same as your current password. Please choose a different password.",
        samePassword: true
      });
    }
    
    console.log("✅ New password is different from current password");

    // ⭐ OPTIONAL: Check password history (last 3 passwords)
    if (user.passwordHistory && user.passwordHistory.length > 0) {
      console.log("🔍 Checking password history...");
      
      // Check against last 3 passwords
      const historyToCheck = user.passwordHistory.slice(0, 3);
      
      for (let i = 0; i < historyToCheck.length; i++) {
        const isUsedBefore = await bcrypt.compare(newPassword, historyToCheck[i]);
        if (isUsedBefore) {
          console.log(`❌ Password matches history entry ${i + 1}`);
          return res.status(400).json({ 
            success: false,
            message: "You have used this password recently. Please choose a different password.",
            reusedPassword: true
          });
        }
      }
      
      console.log("✅ Password not found in history");
    }

    // ⭐ Save current password to history before updating
    if (!user.passwordHistory) {
      user.passwordHistory = [];
    }
    
    // Add current password to history (before changing it)
    user.passwordHistory.unshift(user.password);
    
    // Keep only last 5 passwords in history
    if (user.passwordHistory.length > 5) {
      user.passwordHistory = user.passwordHistory.slice(0, 5);
    }
    
    console.log("💾 Password history updated, keeping last", user.passwordHistory.length, "passwords");

    // ⭐ CRITICAL: Save the new password (pre-save hook will hash it automatically)
    console.log("💾 Updating password...");
    console.log("🔐 Plain password length:", newPassword.length);
    
    user.password = newPassword; // Set plain password
    await user.save(); // Pre-save hook will hash it
    
    // ⭐ Verify password was hashed
    const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
    console.log("✅ Password saved to database");
    console.log("🔐 Password is hashed:", isHashed);
    console.log("🔐 Hash starts with:", user.password.substring(0, 10));

    console.log(`✅ Password reset successful for: ${user.email} (${user.role})`);
    
    // Send confirmation email (non-blocking)
    sendEmail({
      to: user.email,
      subject: "Password Changed Successfully ✅",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #5856d6; margin: 0;">✅ Password Changed Successfully</h2>
              </div>
              
              <p style="font-size: 16px; color: #333;">Hi ${user.name || "there"},</p>
              
              <p style="font-size: 14px; color: #666; line-height: 1.6;">
                Your password has been changed successfully. You can now login with your new password.
              </p>
              
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 6px;">
                <p style="color: #856404; font-size: 13px; margin: 0;">
                  ⚠️ If you did not make this change, please contact us immediately.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <div style="text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 5px 0;">
                  Student-Led Initiative Team
                </p>
              </div>
              
            </div>
          </div>
        </body>
        </html>
      `,
    }).catch(emailErr => {
      console.log("⚠️ Confirmation email failed (non-critical):", emailErr.message);
    });

    // ⭐ IMPORTANT: Always return JSON response
    return res.status(200).json({ 
      success: true,
      message: "Password reset successfully! You can now login with your new password." 
    });

  } catch (err) {
    console.error("❌ resetPassword error:", err);
    console.error("❌ Error stack:", err.stack);
    
    // ⭐ IMPORTANT: Always return JSON response even on error
    return res.status(500).json({ 
      success: false,
      message: "Something went wrong. Please try again later." 
    });
  }
};