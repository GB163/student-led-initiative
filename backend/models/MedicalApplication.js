// backend/models/MedicalApplication.js
import mongoose from 'mongoose';

const medicalApplicationSchema = new mongoose.Schema(
  {
    // Applicant Info (either user or staff)
    applicantName: { 
      type: String,
      trim: true 
    },
    staffName: { 
      type: String,
      trim: true 
    },
    email: { 
      type: String, 
      required: true,
      trim: true,
      lowercase: true
    },
    role: { 
      type: String, 
      enum: ['user', 'staff', 'admin'], // ✅ ADDED 'admin' HERE
      default: 'user' 
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },

    // Patient Info
    patientName: { 
      type: String, 
      required: true,
      trim: true
    },
    age: { 
      type: Number, 
      required: true,
      min: 0,
      max: 150
    },
    relation: { 
      type: String, 
      required: true,
      trim: true
    },
    bloodGroup: { 
      type: String, 
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    phone: { 
      type: String, 
      required: true,
      trim: true
    },
    adharCard: { 
      type: String, 
      required: true,
      trim: true
    },

    // Medical Info
    diagnosis: { 
      type: String, 
      required: true,
      trim: true
    },
    hospital: { 
      type: String, 
      required: true,
      trim: true
    },
    doctorName: { 
      type: String, 
      required: true,
      trim: true
    },
    totalCost: { 
      type: Number, 
      required: true,
      min: 0
    },

    // File Paths (stored as /uploads/filename)
    declaration: { type: String },
    applicantId: { type: String },
    staffId: { type: String },
    incomeProof: { type: String },
    photo: { type: String },
    hospitalBill: { type: String },
    reports: [{ type: String }],

    // Application Status
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'approved'],
      default: 'pending',
    },

    // Staff Assignment (random staff assigned for verification)
    assignedStaff: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },

    // Medical Card (generated after admin approval)
    medicalCardPath: { type: String },

    // Notes from staff/admin
    note: { 
      type: String,
      trim: true
    },
  },
  { 
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// Indexes for faster queries
medicalApplicationSchema.index({ status: 1, createdAt: -1 });
medicalApplicationSchema.index({ userId: 1 });
medicalApplicationSchema.index({ assignedStaff: 1 });

export default mongoose.model('MedicalApplication', medicalApplicationSchema);