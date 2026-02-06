// backend/controllers/donateController.js
import Donate from "../models/DonateModel.js";
import crypto from "crypto";
import { notifyDonation, notifyAdmins } from "../utils/notificationHelper.js"; // ✅ ADD notifyAdmins
import User from "../models/User.js";

const PAYU_KEY = process.env.PAYU_KEY;
const PAYU_SALT = process.env.PAYU_SALT;
const PAYU_BASE_URL = process.env.PAYU_BASE_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

// ======================
// 🔐 Generate PayU Hash
// ======================
const generatePayUHash = ({ key, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5, salt }) => {
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1 || ''}|${udf2 || ''}|${udf3 || ''}|${udf4 || ''}|${udf5 || ''}||||||${salt}`;
  return crypto.createHash("sha512").update(hashString).digest("hex");
};

// ======================
// 🔍 Verify PayU Response Hash
// ======================
const verifyPayUHash = ({ status, email, firstname, productinfo, amount, txnid, hash, udf1, udf2, udf3, udf4, udf5 }) => {
  const hashString = `${PAYU_SALT}|${status}||||||${udf5 || ''}|${udf4 || ''}|${udf3 || ''}|${udf2 || ''}|${udf1 || ''}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_KEY}`;
  const generatedHash = crypto.createHash("sha512").update(hashString).digest("hex");
  return generatedHash === hash;
};

// ======================
// 1️⃣ Create PayU Order
// ======================
export const createOrder = async (req, res) => {
  try {
    const { name, email, amount, role, collegeName, rollNumber, donationType, phone, userId } = req.body;

    // Validation
    if (!name || name.trim() === "") {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    // Student validation
    if (role === "student") {
      if (parseFloat(amount) !== 600) {
        return res.status(400).json({ 
          success: false, 
          message: "Student donation must be ₹600 (yearly)" 
        });
      }
      if (!collegeName || collegeName === "Select your college") {
        return res.status(400).json({ 
          success: false, 
          message: "College name is required for students" 
        });
      }
      if (!rollNumber || rollNumber.trim() === "") {
        return res.status(400).json({ 
          success: false, 
          message: "Roll number is required for students" 
        });
      }
    }

    // Professional validation
    if (role === "professional" && parseFloat(amount) < 500) {
      return res.status(400).json({ 
        success: false, 
        message: "Professional donation must be at least ₹500" 
      });
    }

    // Generate unique transaction ID
    const txnid = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare PayU payload
    const payuPayload = {
      key: PAYU_KEY,
      txnid,
      amount: parseFloat(amount).toFixed(2),
      productinfo: role === "student" ? "Yearly Student Donation" : "One-time Donation",
      firstname: name,
      email,
      phone: phone || "9999999999",
      surl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/donations/success`,
      furl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/donations/failure`,
      udf1: role || "professional",
      udf2: collegeName || "",
      udf3: rollNumber || "",
      udf4: donationType || "one-time",
      udf5: userId || "",
    };

    // Generate hash
    const hash = generatePayUHash({
      key: payuPayload.key,
      txnid: payuPayload.txnid,
      amount: payuPayload.amount,
      productinfo: payuPayload.productinfo,
      firstname: payuPayload.firstname,
      email: payuPayload.email,
      udf1: payuPayload.udf1,
      udf2: payuPayload.udf2,
      udf3: payuPayload.udf3,
      udf4: payuPayload.udf4,
      udf5: payuPayload.udf5,
      salt: PAYU_SALT,
    });

    console.log("✅ PayU order created:", txnid);

    res.status(200).json({
      success: true,
      ...payuPayload,
      hash,
      payuUrl: PAYU_BASE_URL,
    });
  } catch (err) {
    console.error("❌ PayU order creation error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create payment order" 
    });
  }
};

// ======================
// 2️⃣ Verify & Save Payment (Success Handler)
// ======================
export const capturePayment = async (req, res) => {
  try {
    const payuResponse = req.body;
    console.log("📥 PayU Success Response:", payuResponse);

    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      status,
      hash,
      mihpayid,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      error_Message,
    } = payuResponse;

    // Verify hash for security
    const isValidHash = verifyPayUHash({
      status,
      email,
      firstname,
      productinfo,
      amount,
      txnid,
      hash,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
    });

    if (!isValidHash) {
      console.error("❌ Invalid hash - possible tampering");
      return res.redirect(`${FRONTEND_URL}/?payment=failure&error=invalid_hash`);
    }

    // Check payment status
    if (status === "success") {
      // Save donation to database
      const donation = await Donate.create({
        name: firstname,
        email,
        amount: parseFloat(amount),
        paymentId: mihpayid || txnid,
        orderId: txnid,
        role: udf1 === "student" ? "student" : "professional",
        collegeName: udf2 || "",
        collegeID: udf2 || "",
        rollNumber: udf3 || "",
        donationType: udf4 || "one-time",
        status: "success",
        userId: udf5 || null,
      });

      console.log("✅ Donation saved:", donation._id);

      // 🔔 SEND NOTIFICATIONS
      try {
        // Get userId from udf5 or try to find user by email
        let userId = udf5;
        
        if (!userId) {
          const user = await User.findOne({ email });
          userId = user?._id;
        }

        if (userId) {
          // This already notifies user AND admins (check notificationHelper.js)
          await notifyDonation.received(
            userId,
            firstname,
            parseFloat(amount),
            donation._id
          );
          console.log('🔔 Donation notifications sent successfully');
        } else {
          // If no userId, still notify admins about the donation
          await notifyAdmins({
            title: 'New Donation Received 💰',
            message: `${firstname} (${email}) donated ₹${amount}`,
            type: 'donation',
            link: '/admin/donations'
          });
          console.log('🔔 Admin notification sent (user not registered)');
        }

        // ✅ SPECIAL ALERT FOR LARGE DONATIONS
        const donationAmount = parseFloat(amount);
        if (donationAmount >= 10000) {
          await notifyAdmins({
            title: '🎊 Large Donation Alert!',
            message: `Wow! ${firstname} just donated ₹${donationAmount.toLocaleString()}! 🎉`,
            type: 'success',
            link: '/admin/donations'
          });
          console.log('🎊 Large donation alert sent to admins');
        }

        // ✅ CHECK FOR DONATION MILESTONES
        const totalDonations = await Donate.countDocuments({ status: "success" });
        
        // Notify on milestone achievements (every 50 donations)
        if (totalDonations % 50 === 0) {
          await notifyAdmins({
            title: `🎯 Milestone: ${totalDonations} Donations!`,
            message: `Congratulations! We've reached ${totalDonations} total donations!`,
            type: 'success',
            link: '/admin/donations'
          });
          console.log(`🎯 Donation milestone ${totalDonations} achieved!`);
        }

        // Check total amount milestone
        const totalAmountResult = await Donate.aggregate([
          { $match: { status: "success" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        const totalAmount = totalAmountResult[0]?.total || 0;

        // Notify on amount milestones (every ₹50,000)
        const amountMilestone = Math.floor(totalAmount / 50000) * 50000;
        const previousTotal = totalAmount - donationAmount;
        const previousMilestone = Math.floor(previousTotal / 50000) * 50000;

        if (amountMilestone > previousMilestone && amountMilestone > 0) {
          await notifyAdmins({
            title: `💰 Amount Milestone: ₹${amountMilestone.toLocaleString()}!`,
            message: `Amazing! Total donations have crossed ₹${amountMilestone.toLocaleString()}!`,
            type: 'success',
            link: '/admin/donations'
          });
          console.log(`💰 Amount milestone ₹${amountMilestone} achieved!`);
        }

      } catch (notifError) {
        console.error('⚠️ Notification failed:', notifError.message);
        // Don't fail the donation if notification fails
      }

      // Emit live update via Socket.IO
      const io = req.app.get("io");
      if (io) {
        io.emit("newDonation", donation);
      }

      // Redirect to homepage with success message
      return res.redirect(
        `${FRONTEND_URL}/?payment=success&amount=${amount}`
      );
    } else {
      // Payment failed
      console.log("⚠️ Payment failed:", error_Message || status);

      // Save failed transaction for records
      await Donate.create({
        name: firstname,
        email,
        amount: parseFloat(amount),
        paymentId: txnid,
        orderId: txnid,
        role: udf1 === "student" ? "student" : "professional",
        status: "failed",
      });

      // ✅ NOTIFY ADMINS ABOUT FAILED PAYMENTS (if amount was large)
      if (parseFloat(amount) >= 5000) {
        try {
          await notifyAdmins({
            title: '⚠️ Large Payment Failed',
            message: `${firstname} attempted to donate ₹${amount} but payment failed: ${error_Message || 'Unknown error'}`,
            type: 'warning',
            link: '/admin/donations'
          });
        } catch (notifError) {
          console.error('⚠️ Failed payment notification error:', notifError.message);
        }
      }

      return res.redirect(`${FRONTEND_URL}/?payment=failure&error=${encodeURIComponent(error_Message || "Payment failed")}`);
    }
  } catch (err) {
    console.error("❌ Error capturing payment:", err);
    
    // ✅ CRITICAL ERROR ALERT TO ADMINS
    try {
      await notifyAdmins({
        title: '🚨 Payment Processing Error',
        message: `Critical error in donation processing: ${err.message}`,
        type: 'error',
        link: '/admin/donations'
      });
    } catch (notifError) {
      console.error('⚠️ Error notification failed:', notifError.message);
    }
    
    return res.redirect(`${FRONTEND_URL}/?payment=failure&error=server_error`);
  }
};

// ======================
// 3️⃣ Get All Donations
// ======================
export const getAllDonations = async (req, res) => {
  try {
    const donations = await Donate.find({ status: "success" })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (err) {
    console.error("❌ Error fetching donations:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donations",
    });
  }
};

// ======================
// 4️⃣ Get Donation Statistics
// ======================
export const getStats = async (req, res) => {
  try {
    const totalDonations = await Donate.countDocuments({ status: "success" });

    const totalAmountResult = await Donate.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalAmount = totalAmountResult[0]?.total || 0;

    const uniqueDonors = await Donate.distinct("email", { status: "success" });
    const totalDonors = uniqueDonors.filter((email) => email).length;

    const studentDonations = await Donate.countDocuments({
      role: "student",
      status: "success",
    });

    const professionalDonations = await Donate.countDocuments({
      role: "professional",
      status: "success",
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDonations = await Donate.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      status: "success",
    });

    const avgDonation = totalDonations > 0 
      ? Math.round(totalAmount / totalDonations) 
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalDonations,
        totalAmount,
        totalDonors,
        studentDonations,
        professionalDonations,
        recentDonations,
        avgDonation,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching stats:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};