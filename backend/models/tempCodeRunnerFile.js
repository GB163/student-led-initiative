// models/MedicalSupportRequest.js
import mongoose from 'mongoose';

const medicalSupportSchema = new mongoose.Schema({
  // Patient Information
  patientName: { 
    type: String, 
    required: [true, 'Patient name is required'],
    trim: true
  },
  applicantName: { 
    type: String, 
    required: [true, 'Applicant name is required'],
    trim: true
  },
  relation: { 
    type: String, 
    required: [true, 'Relation to patient is required'],
    trim: true
  },
  age: { 
    type: Number, 
    required: [true, 'Patient age is required'],
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age seems unrealistic']
  },
  contact: { 
    type: String, 
    required: [true, 'Contact number is required'],
    match: [/^[\+]?[0-9\-\(\)\s]+$/, 'Please enter a valid contact number']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  aadhar: { 
    type: String,
    match: [/^\d{4}-\d{4}-\d{4}$/, 'Aadhar should be in format XXXX-XXXX-XXXX']
  },

  // Medical Information
  hospital: { 
    type: String, 
    required: [true, 'Hospital name is required'],
    trim: true
  },
  bloodGroup: { 
    type: String, 
    required: [true, 'Blood group is required'],
    enum: {
      values: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
      message: 'Please select a valid blood group'
    }
  },
  doctor: { 
    type: String, 
    required: [true, 'Doctor name is required'],
    trim: true
  },
  diagnosis: { 
    type: String, 
    required: [true, 'Diagnosis is required'],
    trim: true
  },
  estimatedCost: { 
    type: Number, 
    required: [true, 'Estimated cost is required'],
    min: [0, 'Cost cannot be negative']
  },
  
  // File paths for uploaded documents
  declaration: { 
    type: String, 
    required: [true, 'Declaration document is required']
  },
  incomeCertificate: { 
    type: String, 
    required: [true, 'Income certificate is required']
  },
  bill: { 
    type: String, 
    required: [true, 'Hospital bill is required']
  },
  photo: { 
    type: String, 
    required: [true, 'Patient photo is required']
  },
  idProof: { 
    type: String, 
    required: [true, 'ID proof is required']
  },
  reports: [{ 
    type: String 
  }], // Array of additional medical reports
  
  // Status and workflow
  status: { 
    type: String, 
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: 'Status must be pending, approved, or rejected'
    },
    default: 'pending' 
  },
  submittedBy: { 
    type: String, 
    enum: {
      values: ['user', 'staff'],
      message: 'Submitted by must be user or staff'
    },
    default: 'user' 
  },
  userId: { 
    type: String, // For staff submissions - stores staff member ID
    default: null
  },
  
  // Approval/Rejection details
  approvedAt: { 
    type: Date 
  },
  rejectedAt: { 
    type: Date 
  },
  approvalMessage: { 
    type: String,
    trim: true
  },
  rejectionMessage: { 
    type: String,
    trim: true
  },
  
  // Generated medical card path
  medicalCardPath: { 
    type: String 
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
medicalSupportSchema.index({ status: 1, submittedBy: 1 });
medicalSupportSchema.index({ email: 1 });
medicalSupportSchema.index({ createdAt: -1 });

// Virtual for formatted cost
medicalSupportSchema.virtual('formattedCost').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(this.estimatedCost);
});

// Virtual for formatted submission date
medicalSupportSchema.virtual('formattedSubmissionDate').get(function() {
  return this.createdAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Pre-save middleware to set approval/rejection timestamps
medicalSupportSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    
    if (this.status === 'approved' && !this.approvedAt) {
      this.approvedAt = now;
      this.rejectedAt = undefined;
    } else if (this.status === 'rejected' && !this.rejectedAt) {
      this.rejectedAt = now;
      this.approvedAt = undefined;
    }
  }
  next();
});

// Static methods for common queries
medicalSupportSchema.statics.getUserRequests = function() {
  return this.find({ submittedBy: 'user' }).sort({ createdAt: -1 });
};

medicalSupportSchema.statics.getStaffRequests = function() {
  return this.find({ submittedBy: 'staff' }).sort({ createdAt: -1 });
};

medicalSupportSchema.statics.getPendingRequests = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: -1 });
};

medicalSupportSchema.statics.getRequestsByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Instance methods
medicalSupportSchema.methods.approve = function(message = '') {
  this.status = 'approved';
  this.approvalMessage = message;
  this.approvedAt = new Date();
  this.rejectedAt = undefined;
  return this.save();
};

medicalSupportSchema.methods.reject = function(message = '') {
  this.status = 'rejected';
  this.rejectionMessage = message;
  this.rejectedAt = new Date();
  this.approvedAt = undefined;
  return this.save();
};

medicalSupportSchema.methods.isPending = function() {
  return this.status === 'pending';
};

medicalSupportSchema.methods.isApproved = function() {
  return this.status === 'approved';
};

medicalSupportSchema.methods.isRejected = function() {
  return this.status === 'rejected';
};

export default mongoose.model('MedicalSupportRequest', medicalSupportSchema);