import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import { trackUserActivity } from "./middleware/activityTracker.js";

dotenv.config();

// Check env vars
if (
  !process.env.MONGO_URI ||
  !process.env.EMAIL_USER ||
  !process.env.EMAIL_PASS ||
  !process.env.JWT_SECRET ||
  !process.env.PAYU_KEY ||
  !process.env.PAYU_SALT ||
  !process.env.PAYU_BASE_URL
) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

mongoose.set("strictQuery", true);

const app = express();

// CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) return callback(null, true);
      if (origin.match(/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/)) return callback(null, true);
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Track user activity
app.use("/api", trackUserActivity);

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check (can be here, no DB needed)
app.get("/", (req, res) => res.send("Server is up and running!"));

// ---------------- SOCKET.IO SETUP (FIXED CORS) ----------------
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }
      if (origin.match(/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/)) {
        return callback(null, true);
      }
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["polling", "websocket"],
  allowEIO3: true,
});
app.set("io", io);

// Global variables for socket tracking - ENHANCED STRUCTURE
let staffSockets = new Map(); // Map<staffId, socketId>
let userSockets = new Map();  // Map<socketId, { role, userId, device, connectedAt }>

// ---------------- START SERVER ----------------
const startServer = async () => {
  try {
    // ✅ STEP 1: Connect to MongoDB FIRST
    console.log("🔌 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected successfully");

    // ✅ STEP 2: NOW import routes (they can safely import models)
    const authRoutes = (await import("./routes/authRoutes.js")).default;
    const resetPasswordRoutes = (await import("./routes/resetPasswordRoutes.js")).default;
    const userRoutes = (await import("./routes/userRoutes.js")).default;
    const joinRequestRoutes = (await import("./routes/joinRequestRoutes.js")).default;
    const callRequestRoutes = (await import("./routes/CallRequestRoutes.js")).default;
    const contactRoutes = (await import("./routes/ContactRoutes.js")).default;
    const eventRoutes = (await import("./routes/EventRoutes.js")).default;
    const donateRoutes = (await import("./routes/donateRoutes.js")).default;
    const staffRoutes = (await import("./routes/staffRoutes.js")).default;
    const adminRoutes = (await import("./routes/AdminRoutes.js")).default;
    const medicalRoutes = (await import("./routes/medicalRoutes.js")).default;
    const aboutRoutes = (await import("./routes/AboutRoutes.js")).default;
    const hospitalRoutes = (await import("./routes/hospitalRoutes.js")).default;
    const storyRoutes = (await import("./routes/storyRoutes.js")).default;
    const notificationRoutes = (await import("./routes/notificationRoutes.js")).default;

    // ✅ STEP 3: Register routes AFTER MongoDB is connected
    app.use("/api/auth", authRoutes);
    app.use("/api/auth", resetPasswordRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api", joinRequestRoutes);
    app.use("/api/call-requests", callRequestRoutes);
    app.use("/api/contact", contactRoutes);
    app.use("/api/events", eventRoutes);
    app.use("/api/donations", donateRoutes);
    app.use("/api/staff", staffRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/medical", medicalRoutes);
    app.use("/api", aboutRoutes);
    app.use("/api", hospitalRoutes);
    app.use("/api/story", storyRoutes);
    app.use("/api/notifications", notificationRoutes);

    // Health check with DB status
    app.get("/api/health", (req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      });
    });

    // ✅ ENHANCED DEBUG ENDPOINT - Check connected sockets
    app.get("/api/debug/sockets", (req, res) => {
      const connectedSockets = [];
      const userSocketsArray = [];
      const staffSocketsArray = [];
      
      io.sockets.sockets.forEach((socket) => {
        connectedSockets.push({
          id: socket.id,
          connected: socket.connected,
        });
      });

      // Convert user sockets map to array
      userSockets.forEach((data, socketId) => {
        userSocketsArray.push({
          socketId,
          ...data,
        });
      });

      // Convert staff sockets map to array
      staffSockets.forEach((socketId, staffId) => {
        staffSocketsArray.push({
          staffId,
          socketId,
        });
      });

      res.json({
        timestamp: new Date().toISOString(),
        totalConnections: io.engine.clientsCount,
        staffCount: staffSockets.size,
        userCount: userSockets.size,
        staffList: staffSocketsArray,
        userList: userSocketsArray,
        allSockets: connectedSockets,
      });
    });

    // 404 handler
    app.use((req, res) => res.status(404).json({ message: "Route not found" }));

    // ✅ STEP 4: Setup Socket.IO handlers (import models after DB connection)
    console.log("🔧 Setting up Socket.IO handlers...");
    
    const User = (await import("./models/User.js")).default;
    const CallRequest = (await import("./models/CallRequest.js")).default;
    const Message = (await import("./models/Message.js")).default;

    io.on("connection", (socket) => {
      console.log("=".repeat(50));
      console.log("🟢 NEW CONNECTION:", socket.id);
      console.log("📊 Total connections:", io.engine.clientsCount);
      console.log("=".repeat(50));

      // ========== USER REGISTRATION - ENHANCED ==========
      socket.on("registerRole", (data, callback) => {
        console.log("👤 registerRole event received from socket:", socket.id);
        console.log("📦 Data received:", data);
        
        // Handle both old format (string) and new format (object)
        const role = typeof data === 'string' ? data : data?.role;
        const userId = typeof data === 'object' ? data?.userId : null;
        const device = typeof data === 'object' ? data?.device : 'unknown';
        
        console.log("📋 Parsed - Role:", role, "UserId:", userId, "Device:", device);
        
        if (role === "user") {
          userSockets.set(socket.id, { 
            role: "user", 
            userId: userId || 'anonymous',
            device: device,
            connectedAt: new Date() 
          });
          
          console.log("✅ User registered successfully!");
          console.log("   Socket ID:", socket.id);
          console.log("   User ID:", userId || 'anonymous');
          console.log("   Device:", device);
          console.log("📊 Total users now:", userSockets.size);
          console.log("📋 All user sockets:", Array.from(userSockets.entries()));
          
          // Send confirmation back to client
          if (callback && typeof callback === 'function') {
            callback({ 
              success: true, 
              socketId: socket.id,
              userId: userId,
              device: device,
              totalUsers: userSockets.size,
              timestamp: new Date()
            });
          }
        } else {
          console.log("⚠️ Invalid role received:", role);
          if (callback && typeof callback === 'function') {
            callback({ 
              success: false, 
              error: 'Invalid role',
              receivedData: data
            });
          }
        }
      });

      // ========== STAFF REGISTRATION ==========
      socket.on("registerStaff", async (staffId) => {
        console.log("👨‍💼 registerStaff event. StaffId:", staffId, "Socket:", socket.id);
        
        try {
          if (!staffId) {
            console.log("⚠️ No staffId provided");
            return;
          }

          // Remove old socket if reconnecting
          for (const [oldId, oldSocketId] of staffSockets.entries()) {
            if (oldId === staffId.toString()) {
              console.log("🔄 Removing old socket for staff:", staffId);
              staffSockets.delete(oldId);
            }
          }

          staffSockets.set(staffId.toString(), socket.id);
          
          await User.findByIdAndUpdate(staffId, {
            agentStatus: "available",
            lastActiveAt: new Date(),
          });

          console.log("✅ Staff registered successfully!");
          console.log("📊 Total staff online:", staffSockets.size);
          console.log("📋 Staff list:", Array.from(staffSockets.keys()));
        } catch (err) {
          console.error("❌ Error in registerStaff:", err.message);
        }
      });

      // ========== USER MESSAGE (SAVE TO DB) ==========
      socket.on("userMessage", async (data) => {
        console.log("💬 userMessage event received:", data);
        console.log("📤 Broadcasting to", staffSockets.size, "staff members");

        try {
          // Get user info from socket tracking
          const userInfo = userSockets.get(socket.id);
          console.log("👤 User info:", userInfo);

          // Save message to database
          const newMessage = new Message({
            text: data.text,
            role: "user",
            socketId: socket.id,
          });
          
          await newMessage.save();
          console.log("💾 User message saved to DB:", newMessage._id);

          const messageData = {
            socketId: socket.id,
            text: data.text,
            role: "user",
            userName: data.userName || "User",
            userId: userInfo?.userId || 'anonymous',
            device: userInfo?.device || 'unknown',
            timestamp: new Date(),
            _id: newMessage._id,
          };

          let sent = 0;
          staffSockets.forEach((staffSocketId, staffId) => {
            console.log(`  → Sending to staff ${staffId} (socket: ${staffSocketId})`);
            io.to(staffSocketId).emit("newUserMessage", messageData);
            sent++;
          });

          console.log(`✅ Message sent to ${sent} staff members`);
        } catch (err) {
          console.error("❌ Error handling user message:", err.message);
        }
      });

      // ========== STAFF MESSAGE (SAVE TO DB) ==========
      socket.on("staffMessage", async (data) => {
        console.log("💬 staffMessage event received:", data);

        try {
          // Save staff message to database
          const newMessage = new Message({
            text: data.text,
            role: "staff",
            socketId: data.socketId, // User's socket ID
          });
          
          await newMessage.save();
          console.log("💾 Staff message saved to DB:", newMessage._id);

          if (data.socketId) {
            console.log(`📤 Sending reply to user socket: ${data.socketId}`);
            
            io.to(data.socketId).emit("staffReply", {
              text: data.text,
              staffName: data.staffName,
              timestamp: new Date(),
              _id: newMessage._id,
            });

            // Broadcast to other staff
            staffSockets.forEach((staffSocketId) => {
              io.to(staffSocketId).emit("staffReply", {
                socketId: data.socketId,
                text: data.text,
                role: "staff",
                staffName: data.staffName,
                _id: newMessage._id,
              });
            });

            console.log("✅ Reply sent and saved");
          }
        } catch (err) {
          console.error("❌ Error handling staff message:", err.message);
        }
      });

      // ========== CALL REQUEST - ENHANCED LOGGING ==========
      socket.on("callRequest", async (data, callback) => {
        console.log("=".repeat(60));
        console.log("📞 CALL REQUEST RECEIVED");
        console.log("=".repeat(60));
        console.log("🔹 From socket:", socket.id);
        console.log("🔹 Data:", JSON.stringify(data, null, 2));
        
        // Get user info
        const userInfo = userSockets.get(socket.id);
        console.log("🔹 User info:", userInfo);
        console.log("🔹 Current staff online:", staffSockets.size);
        console.log("🔹 Staff IDs:", Array.from(staffSockets.keys()));
        console.log("🔹 Staff socket IDs:", Array.from(staffSockets.values()));

        try {
          const newCall = new CallRequest({
            name: data.name,
            phone: data.phone,
            language: data.language,
            bestTime: data.bestTime,
            notes: data.notes,
            status: "pending",
            userSocketId: socket.id,
          });

          await newCall.save();
          console.log("✅ Call saved to DB with ID:", newCall._id);

          // Check if any staff are connected
          if (staffSockets.size === 0) {
            console.log("⚠️ WARNING: No staff members connected!");
            console.log("⚠️ Call saved but cannot notify anyone");
          } else {
            console.log("📤 Notifying staff members...");
          }

          // Notify ALL staff
          let sent = 0;
          let failed = 0;
          
          staffSockets.forEach((staffSocketId, staffId) => {
            console.log(`  → Attempting to send to staff ${staffId}`);
            console.log(`    Staff socket ID: ${staffSocketId}`);
            
            try {
              const socketExists = io.sockets.sockets.get(staffSocketId);
              if (socketExists) {
                io.to(staffSocketId).emit("newCallRequest", newCall.toObject());
                sent++;
                console.log(`    ✅ Sent successfully`);
              } else {
                console.log(`    ⚠️ Socket ${staffSocketId} not found in active sockets`);
                failed++;
              }
            } catch (err) {
              console.error(`    ❌ Error sending to this staff:`, err.message);
              failed++;
            }
          });

          console.log("=".repeat(60));
          console.log(`📊 BROADCAST RESULTS:`);
          console.log(`   ✅ Successfully sent: ${sent}`);
          console.log(`   ❌ Failed: ${failed}`);
          console.log(`   📋 Total staff: ${staffSockets.size}`);
          console.log("=".repeat(60));

          // Send response back to client
          if (callback && typeof callback === 'function') {
            callback({
              success: true,
              ...newCall.toObject(),
              broadcastInfo: {
                sent,
                failed,
                totalStaff: staffSockets.size
              }
            });
          }
        } catch (err) {
          console.error("❌ Error saving call:", err.message);
          console.error("❌ Full error:", err);
          if (callback && typeof callback === 'function') {
            callback({ 
              success: false,
              error: err.message 
            });
          }
        }
      });

      // ========== ACCEPT CALL ==========
      socket.on("acceptCallRequest", async (data) => {
        console.log("✅ acceptCallRequest event:", data);

        try {
          const { callId, staffId, staffName } = data;

          const call = await CallRequest.findById(callId);
          if (!call || call.status !== "pending") {
            console.log("⚠️ Call not available:", call?.status);
            socket.emit("acceptError", { message: "Call no longer available" });
            return;
          }

          const updatedCall = await CallRequest.findByIdAndUpdate(
            callId,
            {
              status: "assigned",
              assignedTo: staffId,
              assignedStaffName: staffName,
              assignedAt: new Date(),
            },
            { new: true }
          );

          await User.findByIdAndUpdate(staffId, { agentStatus: "busy" });

          socket.emit("callAccepted", updatedCall);

          // Remove from other staff queues
          staffSockets.forEach((staffSocketId, sid) => {
            if (sid !== staffId.toString()) {
              io.to(staffSocketId).emit("callRequestRemoved", { callId });
            }
          });

          console.log("✅ Call assigned to staff:", staffId);
        } catch (err) {
          console.error("❌ Error accepting call:", err.message);
          socket.emit("acceptError", { message: err.message });
        }
      });

      // ========== START CALL ==========
      socket.on("startCall", async (data) => {
        console.log("▶️ startCall event:", data);

        try {
          await CallRequest.findByIdAndUpdate(data.callId, {
            status: "in-progress",
            callStartedAt: new Date(),
          });

          socket.emit("callStarted", { callId: data.callId });
          console.log("✅ Call started");
        } catch (err) {
          console.error("❌ Error starting call:", err.message);
        }
      });

      // ========== END CALL ==========
      socket.on("endCall", async (data) => {
        console.log("⏹️ endCall event:", data);

        try {
          const { callId, staffId } = data;

          const call = await CallRequest.findById(callId);
          const duration = call.callStartedAt 
            ? Math.floor((new Date() - new Date(call.callStartedAt)) / 1000)
            : 0;

          const updatedCall = await CallRequest.findByIdAndUpdate(
            callId,
            {
              status: "awaiting-feedback",
              callEndedAt: new Date(),
              callDuration: duration,
            },
            { new: true }
          );

          await User.findByIdAndUpdate(staffId, { agentStatus: "available" });

          socket.emit("callEnded", { callId });

          // Notify all staff
          staffSockets.forEach((staffSocketId) => {
            io.to(staffSocketId).emit("callUpdated", updatedCall);
          });

          console.log("✅ Call ended, duration:", duration, "seconds");
        } catch (err) {
          console.error("❌ Error ending call:", err.message);
        }
      });

      // ========== REJECT/RELEASE CALL ==========
      socket.on("rejectCallRequest", async (data) => {
        console.log("🔄 rejectCallRequest event:", data);

        try {
          const { callId, staffId } = data;

          const updatedCall = await CallRequest.findByIdAndUpdate(
            callId,
            {
              status: "pending",
              assignedTo: null,
              assignedStaffName: null,
              assignedAt: null,
            },
            { new: true }
          );

          await User.findByIdAndUpdate(staffId, { agentStatus: "available" });

          // Put back in queue for all staff
          staffSockets.forEach((staffSocketId) => {
            io.to(staffSocketId).emit("newCallRequest", updatedCall);
          });

          console.log("✅ Call released back to queue");
        } catch (err) {
          console.error("❌ Error releasing call:", err.message);
        }
      });

      // ========== FEEDBACK SUBMISSION ==========
      socket.on("feedbackSubmit", async (data) => {
        console.log("⭐ feedbackSubmit event:", data);

        try {
          const { callId, rating, suggestion } = data;

          const updatedCall = await CallRequest.findByIdAndUpdate(
            callId,
            {
              status: "completed",
              rating,
              suggestion,
              feedbackDone: true,
              completedAt: new Date(),
            },
            { new: true }
          );

          // Notify all staff
          staffSockets.forEach((staffSocketId) => {
            io.to(staffSocketId).emit("callUpdated", updatedCall);
          });

          console.log("✅ Feedback saved for call:", callId);
        } catch (err) {
          console.error("❌ Error saving feedback:", err.message);
        }
      });

      // ========== DELETE CALL ==========
      socket.on("deleteCall", async (data) => {
        console.log("🗑️ deleteCall event:", data);

        try {
          const { id } = data;
          await CallRequest.findByIdAndDelete(id);

          // Notify everyone
          io.emit("callDeleted", { id });

          console.log("✅ Call deleted:", id);
        } catch (err) {
          console.error("❌ Error deleting call:", err.message);
        }
      });

      // ========== ACTIVITY HEARTBEAT ==========
      socket.on("activityHeartbeat", async (userId) => {
        if (!userId) return;
        await User.findByIdAndUpdate(userId, { lastActiveAt: new Date() });
      });

      // ========== DISCONNECT - ENHANCED ==========
      socket.on("disconnect", () => {
        console.log("=".repeat(50));
        console.log("🔴 CLIENT DISCONNECTED:", socket.id);
        
        // Remove from user sockets
        if (userSockets.has(socket.id)) {
          const userInfo = userSockets.get(socket.id);
          console.log("👤 Disconnected user info:", userInfo);
          userSockets.delete(socket.id);
          console.log("📊 Remaining users:", userSockets.size);
        }

        // Remove from staff sockets
        for (const [staffId, sockId] of staffSockets.entries()) {
          if (sockId === socket.id) {
            staffSockets.delete(staffId);
            User.findByIdAndUpdate(staffId, {
              agentStatus: "offline",
              lastActiveAt: new Date(),
            }).catch(console.error);
            console.log("👨‍💼 Staff disconnected:", staffId);
            console.log("📊 Remaining staff:", staffSockets.size);
            break;
          }
        }
        
        console.log("📊 CURRENT STATUS:");
        console.log("   Active users:", userSockets.size);
        console.log("   Active staff:", staffSockets.size);
        console.log("   Total connections:", io.engine.clientsCount);
        console.log("=".repeat(50));
      });
    });

    // ✅ STEP 5: Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, "0.0.0.0", () => {
      console.log("=".repeat(60));
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Local: http://localhost:${PORT}`);
      console.log(`💬 Socket.IO ready with ENHANCED user tracking`);
      console.log(
        `💳 PayU Payment Gateway: ${process.env.PAYU_ENV === "TEST" ? "🧪 SANDBOX" : "✅ LIVE"}`
      );
      console.log(`📊 Database: ✅ Connected`);
      console.log(`🔔 Notifications: ✅ Enabled`);
      console.log(`🔍 Debug endpoint: http://localhost:${PORT}/api/debug/sockets`);
      console.log("=".repeat(60));
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  }
};

startServer();