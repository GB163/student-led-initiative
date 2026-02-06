// backend/createAdmin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';
import User from './models/User.js';

dotenv.config();

// Create interface for secure password input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to hide password input
const askQuestion = (query) => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
};

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get credentials from command line (not hardcoded!)
    console.log('\n🔐 Admin Account Setup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const name = await askQuestion('Enter admin name: ');
    const email = await askQuestion('Enter admin email: ');
    const password = await askQuestion('Enter admin password: ');

    // Validate inputs
    if (!email || !password || !name) {
      console.log('❌ All fields are required!');
      rl.close();
      await mongoose.disconnect();
      return;
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log('⚠️ Admin already exists with this email:', existingAdmin.email);
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin user
      const adminUser = new User({
        name,
        email,
        password: hashedPassword,
        role: 'admin'
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log(`📧 Email: ${email}`);
      console.log('⚠️ IMPORTANT: Store credentials securely!');
    }

    rl.close();
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    rl.close();
  }
};

createAdmin();