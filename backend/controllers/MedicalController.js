// backend/controllers/medicalController.js
import MedicalApplication from '../models/MedicalApplication.js';
import User from '../models/User.js';
import { sendEmail } from '../config/Emailconfig.js';
import { emailTemplates } from '../utils/emailTemplates.js';
import { generateMedicalCard } from '../utils/pdfGenerator.js';
import { notifyMedicalApplication } from '../utils/notificationHelper.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import mongoose from 'mongoose';
import fs from 'fs';

// ✅ HELPER: Check if URL is from Cloudinary
const isCloudinaryUrl = (url) => {
  return url && url.includes('cloudinary.com');
};

// ✅ HELPER: Extract file paths from Cloudinary or local storage
const getFilePath = (file) => {
  if (!file) return null;
  
  // If it's a Cloudinary upload, file.path will be the full URL
  if (isCloudinaryUrl(file.path)) {
    return file.path;
  }
  
  // If it's local storage (fallback)
  return file.path.replace(/\\/g, '/').replace('uploads', '/uploads');
};

/**
 * 1. APPLY FOR MEDICAL SUPPORT
 * POST /api/medical/apply
 */
export const applyMedical = async (req, res) => {
  try {
    console.log('=== APPLICATION SUBMISSION START ===');
    console.log('📝 Body fields:', req.body);
    console.log('📎 Files received:', req.files ? Object.keys(req.files) : 'No files');

    const {
      applicantName,
      staffName,
      email,
      role,
      patientName,
      age,
      relation,
      bloodGroup,
      phone,
      adharCard,
      diagnosis,
      hospital,
      doctorName,
      totalCost,
    } = req.body;

    // Validate required fields
    if (!email || !patientName || !phone) {
      // Cleanup uploaded files from Cloudinary if validation fails
      if (req.files) {
        for (const field in req.files) {
          for (const file of req.files[field]) {
            await deleteFromCloudinary(file.path);
          }
        }
      }
      
      return res.status(400).json({ 
        message: 'Missing required fields: email, patientName, or phone' 
      });
    }

    // ✅ Extract file paths (works with both Cloudinary and local storage)
    const declaration = getFilePath(req.files?.declaration?.[0]);
    const applicantId = getFilePath(req.files?.applicantId?.[0]);
    const staffId = getFilePath(req.files?.staffId?.[0]);
    const incomeProof = getFilePath(req.files?.incomeProof?.[0]);
    const photo = getFilePath(req.files?.photo?.[0]);
    const hospitalBill = getFilePath(req.files?.hospitalBill?.[0]);
    const reports = req.files?.reports?.map(f => getFilePath(f)) || [];

    console.log('📁 Files processed');
    console.log('📸 Photo URL:', photo);
    console.log('📄 Declaration URL:', declaration);
    console.log('🏥 Hospital Bill URL:', hospitalBill);
    console.log('📋 Reports:', reports.length);

    // Assign staff for verification (only if applicant is staff)
    let assignedStaff = null;
    if (role === 'staff') {
      const staffMembers = await User.find({ role: 'staff', _id: { $ne: req.user._id } });
      if (staffMembers.length > 0) {
        assignedStaff = staffMembers[Math.floor(Math.random() * staffMembers.length)]._id;
      }
    }

    console.log('👥 Staff assignment done');

    // Create application
    const application = await MedicalApplication.create({
      applicantName: role === 'user' ? applicantName : undefined,
      staffName: role === 'staff' ? staffName : undefined,
      email,
      role,
      userId: req.user._id,
      patientName,
      age,
      relation,
      bloodGroup,
      phone,
      adharCard,
      diagnosis,
      hospital,
      doctorName,
      totalCost,
      declaration,
      applicantId: role === 'user' ? applicantId : undefined,
      staffId: role === 'staff' ? staffId : undefined,
      incomeProof,
      photo,
      hospitalBill,
      reports,
      assignedStaff,
      status: 'pending',
    });

    console.log('✅ Application created:', application._id);
    console.log('✅ Files stored in Cloudinary:', isCloudinaryUrl(photo));

    // 🔔 SEND NOTIFICATIONS
    try {
      await notifyMedicalApplication.applied(
        req.user._id,
        req.user.name,
        application._id
      );
      console.log('🔔 Notifications sent successfully');
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    // Send confirmation email
    try {
      const emailData = emailTemplates.applicationReceived({
        applicantName: applicantName || staffName,
        patientName,
        diagnosis,
        hospital,
        email,
        applicationId: application._id,
      });

      await sendEmail({
        to: email,
        subject: emailData.subject,
        html: emailData.html,
      });
      
      console.log('📧 Email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Email failed but application saved:', emailError.message);
    }

    res.status(201).json({ 
      message: 'Application submitted successfully', 
      id: application._id 
    });
    
    console.log('=== APPLICATION SUBMISSION COMPLETE ===');
  } catch (err) {
    console.error('❌ Apply medical error:', err);
    
    // Cleanup uploaded files from Cloudinary on error
    if (req.files) {
      console.log('🗑️ Cleaning up uploaded files due to error...');
      for (const field in req.files) {
        for (const file of req.files[field]) {
          await deleteFromCloudinary(file.path);
        }
      }
    }
    
    res.status(500).json({ 
      message: 'Failed to submit application',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * 2. GET PENDING APPLICATIONS (For Staff Verification)
 * GET /api/medical/pending
 */
export const getPendingApplications = async (req, res) => {
  try {
    let query = { status: 'pending' };

    // If staff is logged in, exclude their own applications
    if (req.user.role === 'staff') {
      query.userId = { $ne: req.user._id };
    }

    const applications = await MedicalApplication.find(query).sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (err) {
    console.error('Get pending applications error:', err);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
};

/**
 * 3. STAFF VERIFY/REJECT APPLICATION
 * PATCH /api/medical/verify/:id
 */
export const verifyApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    const application = await MedicalApplication.findById(id).populate('userId', 'name email');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // If rejecting, cleanup Cloudinary files
    if (status === 'rejected') {
      console.log('🗑️ Cleaning up Cloudinary files for rejected application...');
      const filesToDelete = [
        application.declaration,
        application.applicantId,
        application.staffId,
        application.incomeProof,
        application.photo,
        application.hospitalBill,
        ...application.reports
      ].filter(Boolean);

      for (const fileUrl of filesToDelete) {
        await deleteFromCloudinary(fileUrl);
      }
      console.log('✅ Cloudinary cleanup completed');
    }

    // Update status
    application.status = status;
    await application.save();

    // 🔔 SEND NOTIFICATIONS
    try {
      if (status === 'verified') {
        await notifyMedicalApplication.verified(
          application.userId._id,
          application.userId.name,
          application._id,
          req.user.name
        );
      }
      console.log('🔔 Verification notifications sent');
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    // Send email notification
    try {
      const emailData =
        status === 'verified'
          ? emailTemplates.staffVerified({
              applicantName: application.applicantName || application.staffName,
              applicationId: application._id,
            })
          : emailTemplates.staffRejected({
              applicantName: application.applicantName || application.staffName,
              applicationId: application._id,
              note: application.note || 'Document verification incomplete',
            });

      await sendEmail({
        to: application.email,
        subject: emailData.subject,
        html: emailData.html,
      });
    } catch (emailError) {
      console.error('⚠️ Email notification failed:', emailError.message);
    }

    res.status(200).json({ message: `Application ${status}`, application });
  } catch (err) {
    console.error('Verify application error:', err);
    res.status(500).json({ message: 'Failed to update application' });
  }
};

/**
 * 4. GET SINGLE APPLICATION (For Status Page)
 * GET /api/medical/:id
 */
export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    const application = await MedicalApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.status(200).json(application);
  } catch (err) {
    console.error('Get application error:', err);
    res.status(500).json({ message: 'Failed to fetch application' });
  }
};

/**
 * 5. GET ALL APPLICATIONS (For Admin)
 * GET /api/admin/medical
 */
export const getAllApplications = async (req, res) => {
  try {
    const applications = await MedicalApplication.find({
      status: { $in: ['pending', 'verified', 'rejected', 'approved'] },
    }).sort({ createdAt: -1 });

    res.status(200).json(applications);
  } catch (err) {
    console.error('Get all applications error:', err);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
};

/**
 * 6. ADMIN APPROVE APPLICATION
 * PATCH /api/admin/medical/:id/approve
 */
export const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    const application = await MedicalApplication.findById(id).populate('userId', 'name email');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Generate Medical Card
    const cardData = {
      patientName: application.patientName,
      age: application.age,
      bloodGroup: application.bloodGroup,
      patientPhone: application.phone,
      diagnosis: application.diagnosis,
      hospitalName: application.hospital,
      patientPhoto: application.photo,
      declaration: application.declaration,
      applicantId: application.applicantId || application.staffId,
      incomeProof: application.incomeProof,
      hospitalBill: application.hospitalBill,
      reports: application.reports,
    };

    console.log('🎨 Generating medical card...');
    const { pdfPath } = await generateMedicalCard(id, cardData);
    console.log('✅ Medical card generated at:', pdfPath);

    // Store PDF path (Cloudinary URL or local path)
    const pdfPathToStore = isCloudinaryUrl(pdfPath)
      ? pdfPath
      : pdfPath.replace(process.cwd(), '').replace(/\\/g, '/');

    // Update application status
    application.status = 'approved';
    application.medicalCardPath = pdfPathToStore;
    await application.save();
    console.log('✅ Application status updated to approved');

    // 🔔 SEND NOTIFICATIONS
    try {
      await notifyMedicalApplication.approved(
        application.userId._id,
        application.userId.name,
        application._id
      );
      console.log('🔔 Approval notifications sent');
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    // Send approval email with medical card attachment
    try {
      console.log('📧 Preparing approval email...');
      
      let pdfBuffer;
      
      // Handle both Cloudinary URLs and local file paths
      if (isCloudinaryUrl(pdfPath)) {
        // Download PDF from Cloudinary
        const response = await fetch(pdfPath);
        const arrayBuffer = await response.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
      } else {
        // Read from local filesystem
        if (!fs.existsSync(pdfPath)) {
          throw new Error(`PDF file not found at path: ${pdfPath}`);
        }
        pdfBuffer = fs.readFileSync(pdfPath);
      }

      const pdfBase64 = pdfBuffer.toString('base64');
      console.log('📄 PDF size:', (pdfBuffer.length / 1024).toFixed(2), 'KB');

      // Brevo has a 25MB attachment limit
      if (pdfBuffer.length > 25 * 1024 * 1024) {
        console.warn('⚠️ PDF file is larger than 25MB, sending email without attachment');
        throw new Error('PDF file too large for Brevo attachment limit');
      }

      const emailData = emailTemplates.adminApproved({
        applicantName: application.applicantName || application.staffName,
        patientName: application.patientName,
        diagnosis: application.diagnosis,
        hospital: application.hospital,
        applicationId: application._id,
      });

      await sendEmail({
        to: application.email,
        subject: emailData.subject,
        html: emailData.html,
        attachments: [
          {
            filename: `Medical_Card_${application.patientName.replace(/\s+/g, '_')}.pdf`,
            content: pdfBase64,
          },
        ],
      });
      
      console.log('✅ Approval email sent successfully to:', application.email);
    } catch (emailError) {
      console.error('❌ Approval email failed:', emailError);
      
      // Fallback: send email without attachment
      try {
        console.log('📧 Attempting to send email without attachment...');
        const emailData = emailTemplates.adminApproved({
          applicantName: application.applicantName || application.staffName,
          patientName: application.patientName,
          diagnosis: application.diagnosis,
          hospital: application.hospital,
          applicationId: application._id,
        });

        await sendEmail({
          to: application.email,
          subject: emailData.subject,
          html: emailData.html + `<div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;"><strong>⚠️ Important Notice:</strong> Your medical card could not be attached to this email due to technical issues. Please contact our support team to receive your medical card.</div>`,
        });
        
        console.log('✅ Approval email sent without attachment');
      } catch (fallbackError) {
        console.error('❌ Fallback email also failed:', fallbackError.message);
      }
    }

    res.status(200).json({ 
      message: 'Application approved and medical card sent', 
      application 
    });
  } catch (err) {
    console.error('❌ Approve application error:', err);
    res.status(500).json({ 
      message: 'Failed to approve application',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * 7. ADMIN REJECT APPLICATION
 * PATCH /api/admin/medical/:id/reject
 */
export const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    const application = await MedicalApplication.findById(id).populate('userId', 'name email');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Cleanup Cloudinary files
    console.log('🗑️ Cleaning up Cloudinary files for rejected application...');
    const filesToDelete = [
      application.declaration,
      application.applicantId,
      application.staffId,
      application.incomeProof,
      application.photo,
      application.hospitalBill,
      ...application.reports
    ].filter(Boolean);

    for (const fileUrl of filesToDelete) {
      await deleteFromCloudinary(fileUrl);
    }
    console.log('✅ Cloudinary cleanup completed');

    // Update status
    application.status = 'rejected';
    if (note) application.note = note;
    await application.save();

    // 🔔 SEND NOTIFICATIONS
    try {
      await notifyMedicalApplication.rejected(
        application.userId._id,
        application.userId.name,
        application._id,
        note || 'Application does not meet eligibility criteria'
      );
      console.log('🔔 Rejection notifications sent');
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    // Send rejection email
    try {
      const emailData = emailTemplates.adminRejected({
        applicantName: application.applicantName || application.staffName,
        patientName: application.patientName,
        applicationId: application._id,
        note: note || 'Application does not meet eligibility criteria',
      });

      await sendEmail({
        to: application.email,
        subject: emailData.subject,
        html: emailData.html,
      });
    } catch (emailError) {
      console.error('⚠️ Rejection email failed:', emailError.message);
    }

    res.status(200).json({ message: 'Application rejected', application });
  } catch (err) {
    console.error('Reject application error:', err);
    res.status(500).json({ message: 'Failed to reject application' });
  }
};

/**
 * 8. GET USER'S OWN APPLICATION
 * GET /api/medical/my-application
 */
export const getMyApplication = async (req, res) => {
  try {
    console.log('🔍 Fetching application for user:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const application = await MedicalApplication.findOne({
      userId: req.user._id,
      status: { $in: ['pending', 'verified'] }
    })
    .populate('assignedStaff', 'name email')
    .sort({ createdAt: -1 });

    if (!application) {
      return res.status(200).json({ 
        success: true,
        hasApplication: false,
        message: 'No active application found',
        application: null 
      });
    }

    console.log('✅ Application found:', application._id);

    res.status(200).json({ 
      success: true,
      hasApplication: true,
      application 
    });
  } catch (err) {
    console.error('❌ Get my application error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch application',
      error: err.message
    });
  }
};

/**
 * 9. GET STATISTICS
 * GET /api/medical/stats
 */
export const getStats = async (req, res) => {
  try {
    const childrenHelped = await MedicalApplication.countDocuments({ 
      status: 'approved' 
    });
    
    const totalApplications = await MedicalApplication.countDocuments();
    const approvedApplications = await MedicalApplication.countDocuments({ 
      status: 'approved' 
    });
    
    const approvalRate = totalApplications > 0 
      ? Math.round((approvedApplications / totalApplications) * 100) 
      : 0;
    
    console.log(`📊 Stats: ${approvedApplications}/${totalApplications} approved = ${approvalRate}%`);
    
    res.status(200).json({
      success: true,
      childrenHelped,
      successRate: `${approvalRate}%`,
      approvalRate: approvalRate,
      totalApplications,
      approvedApplications
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching statistics',
      error: error.message,
      childrenHelped: 0,
      successRate: "0%",
      totalApplications: 0,
      approvedApplications: 0
    });
  }
};

export default {
  applyMedical,
  getPendingApplications,
  verifyApplication,
  getApplicationById,
  getAllApplications,
  approveApplication,
  rejectApplication,
  getMyApplication,
  getStats,
};