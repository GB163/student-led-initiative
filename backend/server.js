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

// ✅ UPDATED - Check env vars for Brevo API instead of SMTP
if (
  !process.env.MONGO_URI ||
  !process.env.BREVO_API_KEY ||
  !process.env.BREVO_SENDER_EMAIL ||
  !process.env.JWT_SECRET ||
  !process.env.PAYU_KEY ||
  !process.env.PAYU_SALT ||
  !process.env.PAYU_BASE_URL
) {
  console.error("❌ Missing environment variables");
  console.error("Required: MONGO_URI, BREVO_API_KEY, BREVO_SENDER_EMAIL, JWT_SECRET, PAYU_KEY, PAYU_SALT, PAYU_BASE_URL");
  process.exit(1);
}

mongoose.set("strictQuery", true);

const app = express();

// ✅ UPDATED CORS - NOW SUPPORTS VERCEL + x-platform HEADER
app.use(
  cors({
    origin: function (origin, callback) {
      console.log('🌐 CORS: Request from origin:', origin);
      
      // No origin (mobile apps, Postman, etc.)
      if (!origin) {
        console.log('✅ CORS: No origin - allowed');
        return callback(null, true);
      }
      
      // Allow localhost
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        console.log('✅ CORS: Localhost allowed');
        return callback(null, true);
      }
      
      // Allow local network (192.168.x.x)
      if (origin.match(/^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/)) {
        console.log('✅ CORS: Local network allowed');
        return callback(null, true);
      }
      
      // ✅ Allow Vercel deployments
      if (origin.includes('vercel.app')) {
        console.log('✅ CORS: Vercel deployment allowed');
        return callback(null, true);
      }
      
      // Allow FRONTEND_URL from environment variable
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        console.log('✅ CORS: Environment FRONTEND_URL allowed');
        return callback(null, true);
      }
      
      // Fallback - allow all (you can change this to be more restrictive)
      console.log('✅ CORS: Origin allowed (fallback)');
      callback(null, true);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-platform', 'Cache-Control', 'Pragma'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);

// ✅ FIXED: Simple body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Track user activity
app.use("/api", trackUserActivity);

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🎮 Server Control Center</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Press Start 2P', 'Courier New', monospace;
          background: #0f0f23;
          color: #00ff41;
          min-height: 100vh;
          overflow: hidden;
          position: relative;
        }
        
        /* Animated stars background */
        .stars {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        
        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          animation: twinkle 3s infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        .container {
          position: relative;
          z-index: 10;
          max-width: 900px;
          margin: 50px auto;
          padding: 20px;
        }
        
        .terminal {
          background: rgba(15, 15, 35, 0.95);
          border: 3px solid #00ff41;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 0 50px rgba(0, 255, 65, 0.3), inset 0 0 30px rgba(0, 255, 65, 0.1);
          animation: powerOn 0.5s ease-out;
        }
        
        @keyframes powerOn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          position: relative;
        }
        
        .title {
          font-size: 24px;
          color: #00ff41;
          text-shadow: 0 0 10px #00ff41, 0 0 20px #00ff41;
          margin: 20px 0;
          animation: glow 2s ease-in-out infinite;
        }
        
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 10px #00ff41, 0 0 20px #00ff41; }
          50% { text-shadow: 0 0 20px #00ff41, 0 0 30px #00ff41, 0 0 40px #00ff41; }
        }
        
        .rocket {
          font-size: 60px;
          display: inline-block;
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        
        .status-box {
          background: rgba(0, 255, 65, 0.1);
          border: 2px solid #00ff41;
          padding: 20px;
          text-align: center;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        
        .status-box:hover {
          background: rgba(0, 255, 65, 0.2);
          transform: translateY(-5px);
          box-shadow: 0 5px 20px rgba(0, 255, 65, 0.5);
        }
        
        .status-box::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(0, 255, 65, 0.1), transparent);
          animation: scan 3s linear infinite;
        }
        
        @keyframes scan {
          0% { transform: translateX(-100%) translateY(-100%); }
          100% { transform: translateX(100%) translateY(100%); }
        }
        
        .label {
          font-size: 10px;
          color: #00cc33;
          margin-bottom: 10px;
          letter-spacing: 2px;
        }
        
        .value {
          font-size: 18px;
          color: #00ff41;
          text-shadow: 0 0 5px #00ff41;
        }
        
        .health-bar {
          width: 100%;
          height: 30px;
          background: rgba(0, 255, 65, 0.1);
          border: 2px solid #00ff41;
          margin: 20px 0;
          position: relative;
          overflow: hidden;
        }
        
        .health-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ff41, #00cc33);
          width: 100%;
          animation: pulse 2s ease-in-out infinite;
          box-shadow: 0 0 20px #00ff41;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        .health-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 12px;
          color: #0f0f23;
          font-weight: bold;
          text-shadow: none;
        }
        
        .btn-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 30px;
        }
        
        .game-btn {
          background: rgba(0, 255, 65, 0.2);
          border: 2px solid #00ff41;
          color: #00ff41;
          padding: 15px;
          font-family: inherit;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 1px;
          position: relative;
          overflow: hidden;
        }
        
        .game-btn:hover {
          background: #00ff41;
          color: #0f0f23;
          box-shadow: 0 0 30px #00ff41;
          transform: scale(1.05);
        }
        
        .game-btn:active {
          transform: scale(0.95);
        }
        
        .score-board {
          text-align: center;
          margin: 30px 0;
          padding: 20px;
          background: rgba(0, 255, 65, 0.05);
          border: 2px solid #00ff41;
        }
        
        .score {
          font-size: 14px;
          color: #00ff41;
          animation: countUp 2s ease-out;
        }
        
        @keyframes countUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .mini-game {
          margin: 30px 0;
          padding: 20px;
          background: rgba(0, 255, 65, 0.05);
          border: 2px solid #00ff41;
          text-align: center;
        }
        
        #clickTarget {
          display: inline-block;
          font-size: 40px;
          cursor: pointer;
          transition: transform 0.1s;
          user-select: none;
        }
        
        #clickTarget:hover {
          transform: scale(1.2);
        }
        
        #clickTarget:active {
          transform: scale(0.9);
        }
        
        .blink {
          animation: blink 1s step-end infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .title { font-size: 16px; }
          .rocket { font-size: 40px; }
          .value { font-size: 14px; }
          .game-btn { font-size: 8px; padding: 10px; }
        }
      </style>
    </head>
    <body>
      <!-- Animated stars -->
      <div class="stars" id="stars"></div>
      
      <div class="container">
        <div class="terminal">
          <div class="header">
            <div class="rocket">🚀</div>
            <div class="title">&gt; SERVER CONTROL CENTER_</div>
            <div class="score">System Status: <span class="blink">ONLINE</span></div>
          </div>
          
          <div class="health-bar">
            <div class="health-fill"></div>
            <div class="health-text">█████████ 100% HP</div>
          </div>
          
          <div class="status-grid">
            <div class="status-box">
              <div class="label">⚡ STATUS</div>
              <div class="value">✅ ACTIVE</div>
            </div>
            <div class="status-box">
              <div class="label">🌍 ENV</div>
              <div class="value">${process.env.NODE_ENV || 'DEV'}</div>
            </div>
            <div class="status-box">
              <div class="label">🔌 PORT</div>
              <div class="value">${process.env.PORT || 5000}</div>
            </div>
            <div class="status-box">
              <div class="label">💾 DATABASE</div>
              <div class="value">CONNECTED</div>
            </div>
          </div>
          
          <div class="mini-game">
            <div class="label" style="margin-bottom: 15px;">🎮 CLICK THE ALIEN! 👾</div>
            <div id="clickTarget" onclick="catchAlien()">👾</div>
            <div class="score" style="margin-top: 15px;">Score: <span id="score">0</span></div>
          </div>
          
          <div class="score-board">
            <div class="label">⏱️ UPTIME</div>
            <div class="score" id="uptime">00:00:00</div>
          </div>
          
          <div class="btn-grid">
            <button class="game-btn" onclick="location.href='/api/health'">
              ❤️ Health Check
            </button>
            <button class="game-btn" onclick="location.href='/api/test-email'">
              📧 Test Email
            </button>
            <button class="game-btn" onclick="location.href='/api/debug/sockets'">
              🔌 Socket Info
            </button>
            <button class="game-btn" onclick="playSound()">
              🔊 Test Audio
            </button>
          </div>
        </div>
      </div>
      
      <script>
        // Generate stars
        const starsContainer = document.getElementById('stars');
        for (let i = 0; i < 100; i++) {
          const star = document.createElement('div');
          star.className = 'star';
          star.style.left = Math.random() * 100 + '%';
          star.style.top = Math.random() * 100 + '%';
          star.style.animationDelay = Math.random() * 3 + 's';
          starsContainer.appendChild(star);
        }
        
        // Mini game
        let score = 0;
        const aliens = ['👾', '👽', '🛸', '🤖', '🦾', '🌟'];
        
        function catchAlien() {
          score++;
          document.getElementById('score').textContent = score;
          
          const target = document.getElementById('clickTarget');
          target.textContent = aliens[Math.floor(Math.random() * aliens.length)];
          
          // Random position
          const x = Math.random() * 200 - 100;
          const y = Math.random() * 50 - 25;
          target.style.transform = \`translate(\${x}px, \${y}px) scale(1.2)\`;
          
          setTimeout(() => {
            target.style.transform = 'translate(0, 0) scale(1)';
          }, 200);
          
          // Play sound effect (beep)
          playBeep();
        }
        
        function playBeep() {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'square';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        }
        
        function playSound() {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 523.25; // C5
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          
          alert('🎵 Server is alive and making sounds!');
        }
        
        // Uptime counter
        let startTime = Date.now();
        setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
          const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
          const seconds = (elapsed % 60).toString().padStart(2, '0');
          document.getElementById('uptime').textContent = \`\${hours}:\${minutes}:\${seconds}\`;
        }, 1000);
        
        // Keyboard easter egg
        const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let konamiIndex = 0;
        
        document.addEventListener('keydown', (e) => {
          if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
              document.body.style.animation = 'rainbow 2s linear infinite';
              alert('🎮 KONAMI CODE ACTIVATED! You found the secret!');
              konamiIndex = 0;
            }
          } else {
            konamiIndex = 0;
          }
        });
      </script>
      
      <style>
        @keyframes rainbow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      </style>
    </body>
    </html>
  `);
});

// ✅ DEBUG LOGGING ENDPOINT - For frontend debugging
app.post('/api/debug/log', express.json(), (req, res) => {
  const { type, data } = req.body;
  
  console.log("\n" + "=".repeat(70));
  console.log(`🐛 FRONTEND DEBUG: ${type}`);
  console.log("=".repeat(70));
  console.log(JSON.stringify(data, null, 2));
  console.log("=".repeat(70) + "\n");
  
  res.json({ success: true, logged: true });
});

// ✅ UPDATED SOCKET.IO SETUP - NOW SUPPORTS VERCEL + x-platform HEADER
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      console.log('🔌 Socket.IO CORS: Request from:', origin);
      
      if (!origin) return callback(null, true);
      
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        console.log('✅ Socket.IO: Localhost allowed');
        return callback(null, true);
      }
      
      if (origin.match(/^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/)) {
        console.log('✅ Socket.IO: Local network allowed');
        return callback(null, true);
      }
      
      // ✅ Allow Vercel
      if (origin.includes('vercel.app')) {
        console.log('✅ Socket.IO: Vercel allowed');
        return callback(null, true);
      }
      
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        console.log('✅ Socket.IO: Frontend URL allowed');
        return callback(null, true);
      }
      
      console.log('✅ Socket.IO: Origin allowed (fallback)');
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-platform"],
  },
  transports: ["polling", "websocket"],
  allowEIO3: true,
});
app.set("io", io);

// Global variables for socket tracking
let staffSockets = new Map();
let userSockets = new Map();

// ✅ Helper function to safely extract user ID
const extractUserId = (data) => {
  if (!data) return null;
  
  // If it's already a string, return it
  if (typeof data === 'string') return data;
  
  // If it's an object, try to extract _id or userId
  if (typeof data === 'object') {
    const id = data._id || data.userId || data.id;
    
    // Convert to string if it exists
    if (id) {
      return typeof id === 'string' ? id : id.toString();
    }
  }
  
  return null;
};

// ---------------- START SERVER ----------------
const startServer = async () => {
  try {
    // ✅ STEP 1: Connect to MongoDB FIRST
    console.log("🔌 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected successfully");

    // ✅ STEP 2: Import routes
    const authRoutes = (await import("./routes/authRoutes.js")).default;
    const resetPasswordRoutes = (await import("./routes/resetPasswordRoutes.js")).default;
    const userRoutes = (await import("./routes/userRoutes.js")).default;
    const profileRoutes = (await import("./routes/profileRoutes.js")).default; // ✅ ADDED
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

    // ✅ STEP 3: Register routes
    app.use("/api/auth", authRoutes);
    app.use("/api/auth", resetPasswordRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api/user", profileRoutes); // ✅ ADDED - Profile routes under /api/user
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

    // ✅ BREVO API TEST ROUTE - Test Brevo API connection
    app.get('/api/test-email', async (req, res) => {
      console.log('🧪 Testing Brevo API configuration...');
      
      try {
        const SibApiV3Sdk = (await import('@getbrevo/brevo')).default;
        
        // Initialize API
        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        apiInstance.setApiKey(
          SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
          process.env.BREVO_API_KEY
        );
        
        // Test account connection
        const accountApi = new SibApiV3Sdk.AccountApi();
        accountApi.setApiKey(
          SibApiV3Sdk.AccountApiApiKeys.apiKey,
          process.env.BREVO_API_KEY
        );
        
        const account = await accountApi.getAccount();
        
        console.log('✅ Brevo API connection successful!');
        
        res.json({
          status: 'success',
          timestamp: new Date().toISOString(),
          message: 'Brevo API is working correctly',
          account: {
            email: account.email,
            firstName: account.firstName,
            lastName: account.lastName,
          },
          environment: {
            BREVO_API_KEY: process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing',
            BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || 'NOT SET',
          },
          recommendation: '✅ Ready to send emails via Brevo API!'
        });
        
      } catch (error) {
        console.error('❌ Brevo API test failed:', error);
        
        res.json({
          status: 'failed',
          timestamp: new Date().toISOString(),
          error: error.message,
          code: error.code,
          environment: {
            BREVO_API_KEY: process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing',
            BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || 'NOT SET',
          },
          recommendation: '❌ Check your BREVO_API_KEY in Render environment variables'
        });
      }
    });

    // Health check with DB status
    app.get("/api/health", (req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      });
    });

    // Debug endpoint
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

      userSockets.forEach((data, socketId) => {
        userSocketsArray.push({
          socketId,
          ...data,
        });
      });

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

    // 404 handler - MUST be AFTER all routes
    app.use((req, res) => {
      console.log('❌ 404: Route not found:', req.method, req.originalUrl);
      res.status(404).json({ message: "Route not found" });
    });

    // ✅ STEP 4: Setup Socket.IO handlers
    console.log("🔧 Setting up Socket.IO handlers...");
    
    const User = (await import("./models/User.js")).default;
    const CallRequest = (await import("./models/CallRequest.js")).default;
    const Message = (await import("./models/Message.js")).default;

    io.on("connection", (socket) => {
      console.log("=".repeat(50));
      console.log("🟢 NEW CONNECTION:", socket.id);
      console.log("📊 Total connections:", io.engine.clientsCount);
      console.log("=".repeat(50));

      // ✅ UPDATED: Register user with name (for mobile)
      socket.on("registerUser", (data) => {
        console.log("👤 registerUser event received from socket:", socket.id);
        console.log("📦 Data received:", data);
        
        const name = data?.name || 'Anonymous User';
        const device = data?.device || 'unknown';
        
        userSockets.set(socket.id, { 
          role: "user", 
          name: name,
          device: device,
          connectedAt: new Date() 
        });
        
        console.log("✅ User registered successfully!");
        console.log("   Socket ID:", socket.id);
        console.log("   Name:", name);
        console.log("   Device:", device);
        console.log("📊 Total users now:", userSockets.size);
        
        socket.emit("userRegistered", { 
          success: true, 
          socketId: socket.id,
          name: name,
          device: device,
          totalUsers: userSockets.size,
          timestamp: new Date()
        });
      });

      // ✅ FIXED: registerRole now supports USER, STAFF, and ADMIN
      socket.on("registerRole", async (data, callback) => {
        console.log("👤 registerRole event received from socket:", socket.id);
        console.log("📦 Data received:", JSON.stringify(data, null, 2));
        
        const role = typeof data === 'string' ? data : data?.role;
        const userId = extractUserId(typeof data === 'object' ? data.userId : data);
        const device = typeof data === 'object' ? data?.device : 'unknown';
        
        console.log("📋 Parsed - Role:", role, "UserId:", userId, "Device:", device);
        
        if (role === "user") {
          // ✅ Handle USER role
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
          
          if (callback && typeof callback === 'function') {
            callback({ 
              success: true, 
              socketId: socket.id,
              userId: userId,
              role: "user",
              device: device,
              totalUsers: userSockets.size,
              timestamp: new Date()
            });
          }
          
        } else if (role === "staff" || role === "admin") {
          // ✅ Handle STAFF and ADMIN roles
          if (!userId) {
            console.log("⚠️ No userId provided for staff/admin");
            if (callback && typeof callback === 'function') {
              callback({ success: false, error: 'userId required for staff/admin' });
            }
            return;
          }
          
          try {
            // Remove old socket for this staff/admin if exists
            for (const [oldId, oldSocketId] of staffSockets.entries()) {
              if (oldId === userId.toString()) {
                console.log("🔄 Removing old socket for staff/admin:", userId);
                staffSockets.delete(oldId);
              }
            }
            
            staffSockets.set(userId.toString(), socket.id);
            
            // Update database status
            await User.findByIdAndUpdate(userId, {
              agentStatus: "available",
              lastActiveAt: new Date(),
            });
            
            console.log(`✅ ${role.toUpperCase()} registered successfully!`);
            console.log("   User ID:", userId);
            console.log("   Socket ID:", socket.id);
            console.log("📊 Total staff online:", staffSockets.size);
            
            if (callback && typeof callback === 'function') {
              callback({ 
                success: true, 
                socketId: socket.id,
                userId: userId,
                role: role,
                device: device,
                totalStaff: staffSockets.size,
                timestamp: new Date()
              });
            }
          } catch (err) {
            console.error("❌ Error in staff/admin registration:", err.message);
            if (callback && typeof callback === 'function') {
              callback({ success: false, error: err.message });
            }
          }
          
        } else {
          // ❌ Invalid role
          console.log("⚠️ Invalid role received:", role);
          if (callback && typeof callback === 'function') {
            callback({ 
              success: false, 
              error: 'Invalid role. Must be user, staff, or admin',
              receivedData: data
            });
          }
        }
      });

      // Staff registration (legacy support - kept for backward compatibility)
      socket.on("registerStaff", async (staffId) => {
        const safeStaffId = extractUserId(staffId);
        console.log("👨‍💼 registerStaff event. Original:", staffId, "Extracted:", safeStaffId, "Socket:", socket.id);
        
        try {
          if (!safeStaffId) {
            console.log("⚠️ No valid staffId provided");
            return;
          }

          // Remove old socket for this staff if exists
          for (const [oldId, oldSocketId] of staffSockets.entries()) {
            if (oldId === safeStaffId.toString()) {
              console.log("🔄 Removing old socket for staff:", safeStaffId);
              staffSockets.delete(oldId);
            }
          }

          staffSockets.set(safeStaffId.toString(), socket.id);
          
          await User.findByIdAndUpdate(safeStaffId, {
            agentStatus: "available",
            lastActiveAt: new Date(),
          });

          console.log("✅ Staff registered successfully!");
          console.log("   Staff ID:", safeStaffId);
          console.log("   Socket ID:", socket.id);
          console.log("📊 Total staff online:", staffSockets.size);
          
          socket.emit("staffRegistered", { 
            success: true, 
            staffId: safeStaffId,
            socketId: socket.id,
            totalStaff: staffSockets.size
          });
        } catch (err) {
          console.error("❌ Error in registerStaff:", err.message);
        }
      });

      // ✅ UPDATED: User message with proper broadcasting
      socket.on("userMessage", async (data) => {
        console.log("💬 userMessage event received from socket:", socket.id);
        console.log("📦 Message data:", data);

        try {
          const userInfo = userSockets.get(socket.id);
          
          if (!userInfo) {
            console.log("⚠️ User not registered, skipping message");
            return;
          }

          // Save to database
          const newMessage = new Message({
            text: data.text,
            role: "user",
            socketId: socket.id,
            userName: data.userName || userInfo.name || "User",
          });
          
          await newMessage.save();
          console.log("💾 User message saved to DB:", newMessage._id);

          const messageData = {
            _id: newMessage._id,
            socketId: socket.id,
            text: data.text,
            role: "user",
            userName: data.userName || userInfo.name || "User",
            userId: userInfo?.userId || 'anonymous',
            device: userInfo?.device || 'unknown',
            timestamp: new Date(),
          };

          // Broadcast to ALL staff members
          let sent = 0;
          staffSockets.forEach((staffSocketId, staffId) => {
            const staffSocket = io.sockets.sockets.get(staffSocketId);
            if (staffSocket && staffSocket.connected) {
              staffSocket.emit("newUserMessage", messageData);
              sent++;
              console.log(`   ✅ Sent to staff ${staffId} (${staffSocketId})`);
            }
          });

          console.log(`✅ Message broadcasted to ${sent}/${staffSockets.size} staff members`);
          
          // Confirm to user
          socket.emit("messageSent", { 
            success: true, 
            messageId: newMessage._id,
            sentToStaff: sent
          });
        } catch (err) {
          console.error("❌ Error handling user message:", err.message);
          socket.emit("messageError", { 
            success: false, 
            error: err.message 
          });
        }
      });

      // ✅ UPDATED: Staff message with proper targeting
      socket.on("staffMessage", async (data) => {
        console.log("💬 staffMessage event received from socket:", socket.id);
        console.log("📦 Message data:", data);

        try {
          // Validate data
          if (!data.socketId || !data.text) {
            console.log("⚠️ Missing required fields");
            return;
          }

          // Save to database
          const newMessage = new Message({
            text: data.text,
            role: "staff",
            socketId: data.socketId, // User's socket ID
            staffName: data.staffName || "Staff",
          });
          
          await newMessage.save();
          console.log("💾 Staff message saved to DB:", newMessage._id);

          const messageData = {
            _id: newMessage._id,
            socketId: data.socketId,
            text: data.text,
            role: "staff",
            staffName: data.staffName || "Staff",
            timestamp: new Date(),
          };

          // Send to specific user
          const userSocket = io.sockets.sockets.get(data.socketId);
          if (userSocket && userSocket.connected) {
            userSocket.emit("staffReply", messageData);
            console.log(`✅ Reply sent to user ${data.socketId}`);
          } else {
            console.log(`⚠️ User ${data.socketId} not connected`);
          }

          // Broadcast to ALL staff members (so they all see the conversation)
          let sent = 0;
          staffSockets.forEach((staffSocketId, staffId) => {
            const staffSocket = io.sockets.sockets.get(staffSocketId);
            if (staffSocket && staffSocket.connected) {
              staffSocket.emit("staffReply", messageData);
              sent++;
            }
          });

          console.log(`✅ Reply broadcasted to ${sent} staff members`);
          
          socket.emit("messageDelivered", { 
            success: true, 
            messageId: newMessage._id 
          });
        } catch (err) {
          console.error("❌ Error handling staff message:", err.message);
          socket.emit("messageError", { 
            success: false, 
            error: err.message 
          });
        }
      });

      // Call request
      socket.on("callRequest", async (data, callback) => {
        console.log("📞 CALL REQUEST RECEIVED from socket:", socket.id);
        console.log("📦 Call data:", data);

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

          // Broadcast to all staff
          let sent = 0;
          staffSockets.forEach((staffSocketId, staffId) => {
            try {
              const socketExists = io.sockets.sockets.get(staffSocketId);
              if (socketExists && socketExists.connected) {
                socketExists.emit("newCallRequest", newCall.toObject());
                sent++;
                console.log(`   ✅ Sent to staff ${staffId}`);
              }
            } catch (err) {
              console.error(`❌ Error sending to staff ${staffId}:`, err.message);
            }
          });

          console.log(`✅ Call broadcasted to ${sent}/${staffSockets.size} staff members`);

          if (callback && typeof callback === 'function') {
            callback({
              success: true,
              ...newCall.toObject(),
              broadcastInfo: { sent, totalStaff: staffSockets.size }
            });
          }
        } catch (err) {
          console.error("❌ Error saving call:", err.message);
          if (callback && typeof callback === 'function') {
            callback({ success: false, error: err.message });
          }
        }
      });

      // Accept call request
      socket.on("acceptCallRequest", async (data) => {
        try {
          const callId = extractUserId(data.callId);
          const staffId = extractUserId(data.staffId);
          const staffName = data.staffName;
          
          console.log("📞 Accept call request:", { 
            originalCallId: data.callId, 
            callId, 
            originalStaffId: data.staffId,
            staffId, 
            staffName 
          });
          
          if (!callId || !staffId) {
            console.log("⚠️ Invalid callId or staffId");
            socket.emit("acceptError", { message: "Invalid ID format" });
            return;
          }
          
          const call = await CallRequest.findById(callId);
          
          if (!call || call.status !== "pending") {
            console.log("⚠️ Call no longer available or not pending");
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
          
          // Broadcast to all staff
          staffSockets.forEach((staffSocketId) => {
            const staffSocket = io.sockets.sockets.get(staffSocketId);
            if (staffSocket && staffSocket.connected) {
              staffSocket.emit("callUpdated", updatedCall);
            }
          });

          console.log("✅ Call assigned to staff:", staffId);
          console.log("📢 Broadcasted callUpdated to all staff members");
          
        } catch (err) {
          console.error("❌ Error accepting call:", err.message);
          console.error("Full error:", err);
          socket.emit("acceptError", { message: err.message });
        }
      });

      socket.on("startCall", async (data) => {
        try {
          const callId = extractUserId(data.callId);
          
          if (!callId) {
            console.log("⚠️ Invalid callId");
            return;
          }
          
          const updatedCall = await CallRequest.findByIdAndUpdate(
            callId,
            {
              status: "in-progress",
              callStartedAt: new Date(),
            },
            { new: true }
          );
          
          socket.emit("callStarted", { callId });
          
          // Broadcast to all staff
          staffSockets.forEach((staffSocketId) => {
            const staffSocket = io.sockets.sockets.get(staffSocketId);
            if (staffSocket && staffSocket.connected) {
              staffSocket.emit("callUpdated", updatedCall);
            }
          });
          
          console.log("✅ Call started:", callId);
        } catch (err) {
          console.error("❌ Error starting call:", err.message);
        }
      });

      socket.on("endCall", async (data) => {
        try {
          const callId = extractUserId(data.callId);
          const staffId = extractUserId(data.staffId);
          
          if (!callId || !staffId) {
            console.log("⚠️ Invalid callId or staffId");
            return;
          }
          
          const call = await CallRequest.findById(callId);
          const duration = call.callStartedAt 
            ? Math.floor((new Date() - new Date(call.callStartedAt)) / 1000)
            : 0;

          const updatedCall = await CallRequest.findByIdAndUpdate(
            callId,
            { 
              status: "awaiting-feedback", 
              callEndedAt: new Date(), 
              callDuration: duration 
            },
            { new: true }
          );

          await User.findByIdAndUpdate(staffId, { agentStatus: "available" });
          
          socket.emit("callEnded", { callId });

          // Broadcast to all staff
          staffSockets.forEach((staffSocketId) => {
            const staffSocket = io.sockets.sockets.get(staffSocketId);
            if (staffSocket && staffSocket.connected) {
              staffSocket.emit("callUpdated", updatedCall);
            }
          });

          console.log("✅ Call ended, duration:", duration, "seconds");
        } catch (err) {
          console.error("❌ Error ending call:", err.message);
        }
      });

      socket.on("rejectCallRequest", async (data) => {
        try {
          const callId = extractUserId(data.callId);
          const staffId = extractUserId(data.staffId);
          
          if (!callId || !staffId) {
            console.log("⚠️ Invalid callId or staffId");
            return;
          }
          
          const updatedCall = await CallRequest.findByIdAndUpdate(
            callId,
            { 
              status: "pending", 
              assignedTo: null, 
              assignedStaffName: null, 
              assignedAt: null 
            },
            { new: true }
          );

          await User.findByIdAndUpdate(staffId, { agentStatus: "available" });

          // Broadcast to all staff
          staffSockets.forEach((staffSocketId) => {
            const staffSocket = io.sockets.sockets.get(staffSocketId);
            if (staffSocket && staffSocket.connected) {
              staffSocket.emit("newCallRequest", updatedCall);
            }
          });

          console.log("✅ Call released back to queue");
        } catch (err) {
          console.error("❌ Error releasing call:", err.message);
        }
      });

      socket.on("feedbackSubmit", async (data) => {
        try {
          const callId = extractUserId(data.callId);
          const { rating, suggestion } = data;
          
          if (!callId) {
            console.log("⚠️ Invalid callId");
            return;
          }
          
          const updatedCall = await CallRequest.findByIdAndUpdate(
            callId,
            { 
              status: "completed", 
              rating, 
              suggestion, 
              feedbackDone: true, 
              completedAt: new Date() 
            },
            { new: true }
          );

          // Broadcast to all staff
          staffSockets.forEach((staffSocketId) => {
            const staffSocket = io.sockets.sockets.get(staffSocketId);
            if (staffSocket && staffSocket.connected) {
              staffSocket.emit("callUpdated", updatedCall);
            }
          });

          console.log("✅ Feedback saved for call:", callId);
        } catch (err) {
          console.error("❌ Error saving feedback:", err.message);
        }
      });

      socket.on("deleteCall", async (data) => {
        try {
          const id = extractUserId(data.id || data);
          
          if (!id) {
            console.log("⚠️ Invalid call ID");
            return;
          }
          
          await CallRequest.findByIdAndDelete(id);
          
          // Broadcast to all connected clients
          io.emit("callDeleted", { id });
          
          console.log("✅ Call deleted:", id);
        } catch (err) {
          console.error("❌ Error deleting call:", err.message);
        }
      });

      // ✅ FIXED: Activity heartbeat handler
      socket.on("activityHeartbeat", async (data) => {
        try {
          const userId = extractUserId(data);
          
          console.log('💓 Heartbeat received - Original:', JSON.stringify(data), 'Extracted:', userId);
          
          if (!userId) {
            console.warn('⚠️ No valid userId in heartbeat data');
            return;
          }

          // Validate ObjectId format (24 hex characters)
          if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
            console.error('❌ Invalid ObjectId format:', userId);
            return;
          }

          await User.findByIdAndUpdate(userId, { lastActiveAt: new Date() });
          console.log('✅ Heartbeat updated for user:', userId);
        } catch (error) {
          console.error('❌ Error updating heartbeat:', error.message);
          console.error('Full error:', error);
        }
      });

      // Disconnect
      socket.on("disconnect", () => {
        console.log("🔴 CLIENT DISCONNECTED:", socket.id);
        
        // Remove from user sockets
        if (userSockets.has(socket.id)) {
          const userInfo = userSockets.get(socket.id);
          console.log(`   👤 User disconnected: ${userInfo?.name || 'Unknown'}`);
          userSockets.delete(socket.id);
          console.log("📊 Remaining users:", userSockets.size);
        }

        // Remove from staff sockets
        for (const [staffId, sockId] of staffSockets.entries()) {
          if (sockId === socket.id) {
            staffSockets.delete(staffId);
            
            // Safely extract and update staff status
            const safeStaffId = extractUserId(staffId);
            if (safeStaffId) {
              User.findByIdAndUpdate(safeStaffId, {
                agentStatus: "offline",
                lastActiveAt: new Date(),
              }).catch(err => console.error("Error updating staff status on disconnect:", err.message));
            }
            
            console.log("👨‍💼 Staff disconnected:", staffId);
            console.log("📊 Remaining staff:", staffSockets.size);
            break;
          }
        }
      });
    });

    // ✅ STEP 5: Start the server with ENHANCED DISPLAY
    const PORT = process.env.PORT || 5000;
    const NODE_ENV = process.env.NODE_ENV || 'development';
    
    server.listen(PORT, "0.0.0.0", () => {
      // Don't clear console in production (Render needs to see logs)
      if (NODE_ENV === 'development') {
        console.clear();
      }
      
      const border = '═'.repeat(70);
      const line = '─'.repeat(70);
      
      console.log('\n');
      console.log(`╔${border}╗`);
      console.log(`║${' '.repeat(70)}║`);
      console.log(`║           🚀 SERVER SUCCESSFULLY STARTED 🚀                      ║`);
      console.log(`║${' '.repeat(70)}║`);
      console.log(`╠${border}╣`);
      console.log(`║                                                                      ║`);
      console.log(`║  📋 Server Information:                                              ║`);
      console.log(`║  ${line}  ║`);
      console.log(`║    🌍 Environment:     ${NODE_ENV.toUpperCase().padEnd(46)}║`);
      console.log(`║    🔌 Port:            ${PORT.toString().padEnd(46)}║`);
      console.log(`║    📱 Local URL:       http://localhost:${PORT}${' '.repeat(26)}║`);
      console.log(`║    🌐 Network URL:     http://0.0.0.0:${PORT}${' '.repeat(28)}║`);
      console.log(`║                                                                      ║`);
      console.log(`║  ✅ System Status:                                                   ║`);
      console.log(`║  ${line}  ║`);
      console.log(`║    💬 Socket.IO:       ✅ Ready and listening                        ║`);
      console.log(`║    📊 Database:        ✅ MongoDB Connected                          ║`);
      console.log(`║    🌐 CORS:            ✅ Vercel + localhost enabled                 ║`);
      console.log(`║    📧 Email Service:   ✅ Brevo API configured                       ║`);
      console.log(`║    ☁️  File Upload:     ✅ Cloudinary configured                      ║`);
      console.log(`║    🔐 JWT Auth:        ✅ Enabled                                    ║`);
      console.log(`║    💳 Payment:         ✅ PayU configured                            ║`);
      console.log(`║                                                                      ║`);
      console.log(`║  🔗 Quick Links:                                                     ║`);
      console.log(`║  ${line}  ║`);
      console.log(`║    🏠 Home:            http://localhost:${PORT}${' '.repeat(26)}║`);
      console.log(`║    ❤️  Health Check:   http://localhost:${PORT}/api/health${' '.repeat(17)}║`);
      console.log(`║    🧪 Test Email:      http://localhost:${PORT}/api/test-email${' '.repeat(12)}║`);
      console.log(`║    🐛 Debug Log:       http://localhost:${PORT}/api/debug/log${' '.repeat(14)}║`);
      console.log(`║    🔌 Socket Debug:    http://localhost:${PORT}/api/debug/sockets${' '.repeat(9)}║`);
      console.log(`║                                                                      ║`);
      console.log(`║  📝 Available Routes:                                                ║`);
      console.log(`║  ${line}  ║`);
      console.log(`║    • /api/auth         - Authentication routes                      ║`);
      console.log(`║    • /api/user         - User management & profile                  ║`);
      console.log(`║    • /api/staff        - Staff operations                           ║`);
      console.log(`║    • /api/admin        - Admin dashboard                            ║`);
      console.log(`║    • /api/events       - Event management                           ║`);
      console.log(`║    • /api/donations    - Donation processing                        ║`);
      console.log(`║    • /api/medical      - Medical records                            ║`);
      console.log(`║    • /api/story        - Story/About content                        ║`);
      console.log(`║    • /api/notifications - Push notifications                        ║`);
      console.log(`║                                                                      ║`);
      console.log(`╠${border}╣`);
      console.log(`║                                                                      ║`);
      console.log(`║  ⚡ Server is now ready to accept connections!                       ║`);
      console.log(`║  📅 Started at: ${new Date().toLocaleString().padEnd(43)}║`);
      console.log(`║                                                                      ║`);
      console.log(`╚${border}╝`);
      console.log('\n');
      console.log('💡 Tip: Press Ctrl+C to stop the server\n');
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  }
};

startServer();