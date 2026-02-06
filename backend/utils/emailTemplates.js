// backend/utils/emailTemplates.js

/**
 * Professional Email Templates for Medical Support Application
 */

export const emailTemplates = {
  /**
   * 1. Application Received - Sent immediately after user/staff submits
   */
  applicationReceived: (data) => ({
    subject: 'Medical Support Application Received - Student Led Initiative',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #d6336c 0%, #ff6b8b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .info-box { background: #f9fafb; padding: 15px; border-left: 4px solid #d6336c; margin: 20px 0; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #d6336c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          strong { color: #d6336c; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Student Led Initiative</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Medical Support Program</p>
          </div>
          
          <div class="content">
            <h2 style="color: #d6336c; margin-top: 0;">Application Received Successfully</h2>
            
            <p>Dear <strong>${data.applicantName || data.staffName}</strong>,</p>
            
            <p>We acknowledge receipt of your medical support application submitted on <strong>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #374151;">Application Details</h3>
              <p style="margin: 5px 0;"><strong>Patient Name:</strong> ${data.patientName}</p>
              <p style="margin: 5px 0;"><strong>Diagnosis:</strong> ${data.diagnosis}</p>
              <p style="margin: 5px 0;"><strong>Hospital:</strong> ${data.hospital}</p>
              <p style="margin: 5px 0;"><strong>Application ID:</strong> ${data.applicationId}</p>
            </div>
            
            <h3 style="color: #374151;">What Happens Next?</h3>
            <ol style="padding-left: 20px;">
              <li><strong>Document Verification:</strong> Our staff will review all submitted documents for authenticity and completeness.</li>
              <li><strong>Administrative Review:</strong> Upon successful verification, your application will be forwarded to our administrative team.</li>
              <li><strong>Final Decision:</strong> You will receive notification regarding the approval status within 7-10 business days.</li>
            </ol>
            
            <p style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <strong>Important:</strong> Please ensure your contact details are accurate. All further communications will be sent to <strong>${data.email}</strong>.
            </p>
            
            <p>Should you have any queries regarding your application, please feel free to contact our support team.</p>
            
            <p style="margin-top: 30px;">Best regards,<br>
            <strong>Medical Support Team</strong><br>
            Student Led Initiative</p>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;"><strong>Contact Us</strong></p>
            <p style="margin: 5px 0;">Helpline: +91-7061868784</p>
            <p style="margin: 5px 0;">Email: support@studentinitiative2@gmail.com</p>
            <p style="margin: 15px 0 5px 0; font-size: 11px;">This is an automated email. Please do not reply directly to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * 2. Staff Verification Complete - After staff verifies
   */
  staffVerified: (data) => ({
    subject: 'Application Verified - Medical Support Update',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .success-box { background: #d1fae5; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          strong { color: #059669; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">✓ Verification Complete</h1>
            <p style="margin: 10px 0 0 0;">Student Led Initiative</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${data.applicantName || data.staffName}</strong>,</p>
            
            <div class="success-box">
              <h3 style="margin-top: 0; color: #059669;">Document Verification Successful</h3>
              <p style="margin: 5px 0;">Your medical support application has been successfully verified by our staff team.</p>
              <p style="margin: 10px 0 5px 0;"><strong>Application ID:</strong> ${data.applicationId}</p>
              <p style="margin: 5px 0;"><strong>Verification Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            
            <h3 style="color: #374151;">Next Steps</h3>
            <p>Your application has been forwarded to our administrative team for final review and approval. This process typically takes 3-5 business days.</p>
            
            <p>Our administrative team will:</p>
            <ul style="padding-left: 20px;">
              <li>Conduct a comprehensive review of your case</li>
              <li>Assess eligibility criteria</li>
              <li>Make the final approval decision</li>
            </ul>
            
            <p style="background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <strong>Note:</strong> You will receive another notification once the administrative review is complete.
            </p>
            
            <p>We appreciate your patience during this process.</p>
            
            <p style="margin-top: 30px;">Warm regards,<br>
            <strong>Verification Team</strong><br>
            Student Led Initiative</p>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;">Helpline: +91-7061868784 | Email: support@studentinitiative2@gmail.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * 3. Staff Rejection - After staff rejects
   */
  staffRejected: (data) => ({
    subject: 'Application Status Update - Document Verification',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .alert-box { background: #fee2e2; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 4px; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Application Status Update</h1>
            <p style="margin: 10px 0 0 0;">Student Led Initiative</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${data.applicantName || data.staffName}</strong>,</p>
            
            <p>We regret to inform you that your medical support application could not be verified at this stage.</p>
            
            <div class="alert-box">
              <h3 style="margin-top: 0; color: #dc2626;">Verification Status: Incomplete</h3>
              <p style="margin: 5px 0;"><strong>Application ID:</strong> ${data.applicationId}</p>
              <p style="margin: 5px 0;"><strong>Review Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              ${data.note ? `<p style="margin: 15px 0 5px 0;"><strong>Reason:</strong></p><p style="margin: 5px 0;">${data.note}</p>` : ''}
            </div>
            
            <h3 style="color: #374151;">Common Reasons for Non-Verification</h3>
            <ul style="padding-left: 20px;">
              <li>Incomplete or unclear documentation</li>
              <li>Discrepancies in submitted information</li>
              <li>Missing required documents</li>
              <li>Poor quality scans/photographs</li>
            </ul>
            
            <h3 style="color: #374151;">What You Can Do</h3>
            <p>You are welcome to submit a fresh application with complete and accurate documentation. Please ensure:</p>
            <ul style="padding-left: 20px;">
              <li>All documents are clear and legible</li>
              <li>Information provided is accurate and verifiable</li>
              <li>All required fields are properly filled</li>
            </ul>
            
            <p style="background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              If you believe this decision was made in error, please contact our support team with your application ID for clarification.
            </p>
            
            <p style="margin-top: 30px;">Sincerely,<br>
            <strong>Verification Team</strong><br>
            Student Led Initiative</p>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;">Helpline: +91-7061868784 | Email: support@studentinitiative2@gmail.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * 4. Admin Approval - With medical card attachment
   */
  adminApproved: (data) => ({
    subject: 'Medical Support Approved - Medical Card Enclosed',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .success-box { background: #d1fae5; padding: 25px; border-left: 4px solid #059669; margin: 20px 0; border-radius: 4px; text-align: center; }
          .info-card { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .attachment-notice { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your Application Has Been Approved</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${data.applicantName || data.staffName}</strong>,</p>
            
            <div class="success-box">
              <h2 style="margin: 0 0 10px 0; color: #059669; font-size: 22px;">Application Approved ✓</h2>
              <p style="margin: 5px 0; font-size: 16px;">Your medical support application has been successfully approved by our administrative team.</p>
            </div>
            
            <p>We are pleased to inform you that after careful review of your application and supporting documents, you have been granted medical support under our Student Led Initiative program.</p>
            
            <div class="info-card">
              <h3 style="margin-top: 0; color: #374151;">Approved Application Details</h3>
              <p style="margin: 8px 0;"><strong>Application ID:</strong> ${data.applicationId}</p>
              <p style="margin: 8px 0;"><strong>Patient Name:</strong> ${data.patientName}</p>
              <p style="margin: 8px 0;"><strong>Diagnosis:</strong> ${data.diagnosis}</p>
              <p style="margin: 8px 0;"><strong>Hospital:</strong> ${data.hospital}</p>
              <p style="margin: 8px 0;"><strong>Approval Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            
            <div class="attachment-notice">
              <h3 style="margin-top: 0; color: #92400e;">📎 Medical Card Attached</h3>
              <p style="margin: 5px 0;">Your official medical support card is attached to this email. Please download and save it securely.</p>
              <p style="margin: 10px 0 5px 0; font-weight: bold;">Card Features:</p>
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Front: Patient details and photograph</li>
                <li>Back: Medical information with QR code for document verification</li>
              </ul>
            </div>
            
            <h3 style="color: #374151;">Important Instructions</h3>
            <ol style="padding-left: 20px; line-height: 1.8;">
              <li><strong>Print the Card:</strong> Take a printout of the attached medical card for physical use.</li>
              <li><strong>Hospital Presentation:</strong> Present this card at the registered hospital for availing support.</li>
              <li><strong>QR Code:</strong> The QR code on the back contains links to all your submitted documents for verification purposes.</li>
              <li><strong>Validity:</strong> Please check with our support team regarding the validity period and usage terms.</li>
            </ol>
            
            <p style="background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <strong>Note:</strong> This medical card is non-transferable and should be used only by the registered patient. Any misuse may result in cancellation of support.
            </p>
            
            <p>We wish ${data.patientName} a speedy recovery and are honored to support you during this time.</p>
            
            <p style="margin-top: 30px;">With best wishes,<br>
            <strong>Administrative Team</strong><br>
            Student Led Initiative</p>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;"><strong>For any queries or assistance:</strong></p>
            <p style="margin: 5px 0;">Helpline: +91-7061868784</p>
            <p style="margin: 5px 0;">Email: support@studentinitiative2@gmail.com</p>
            <p style="margin: 15px 0 5px 0; font-size: 11px;">This email and its attachments are confidential. If you received this by mistake, please delete it.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  /**
   * 5. Admin Rejection - Final rejection
   */
  adminRejected: (data) => ({
    subject: 'Medical Support Application - Final Decision',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .reject-box { background: #fee2e2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 4px; }
          .info-box { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Application Decision Notice</h1>
            <p style="margin: 10px 0 0 0;">Student Led Initiative</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${data.applicantName || data.staffName}</strong>,</p>
            
            <p>Thank you for your application to the Student Led Initiative Medical Support Program. We have completed our comprehensive review of your case.</p>
            
            <div class="reject-box">
              <h3 style="margin-top: 0; color: #dc2626;">Application Status: Not Approved</h3>
              <p style="margin: 5px 0;">After careful consideration, we regret to inform you that we are unable to approve your medical support application at this time.</p>
              <p style="margin: 15px 0 5px 0;"><strong>Application ID:</strong> ${data.applicationId}</p>
              <p style="margin: 5px 0;"><strong>Decision Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              ${data.note ? `<p style="margin: 15px 0 5px 0;"><strong>Reason:</strong></p><p style="margin: 5px 0; line-height: 1.6;">${data.note}</p>` : ''}
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #374151;">Common Reasons for Non-Approval</h3>
              <ul style="padding-left: 20px; margin: 10px 0;">
                <li>Application does not meet eligibility criteria</li>
                <li>Insufficient or inconsistent documentation</li>
                <li>Budget constraints or resource limitations</li>
                <li>Medical condition not covered under current program scope</li>
              </ul>
            </div>
            
            <h3 style="color: #374151;">Alternative Options</h3>
            <p>While we cannot provide support at this time, we encourage you to explore other avenues:</p>
            <ul style="padding-left: 20px;">
              <li>Government health schemes and insurance programs</li>
              <li>Hospital-specific financial assistance programs</li>
              <li>Other NGOs and charitable organizations</li>
              <li>Crowdfunding platforms for medical expenses</li>
            </wordt>
            
            <h3 style="color: #374151;">Reapplication</h3>
            <p>If your circumstances change or you obtain additional documentation, you may submit a fresh application after 30 days from this decision date. Please ensure all eligibility requirements are met before reapplying.</p>
            
            <p style="background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <strong>Questions or Concerns?</strong><br>
              If you have questions about this decision or need clarification, please contact our support team with your application ID.
            </p>
            
            <p>We understand this may be disappointing news, and we genuinely wish you and ${data.patientName} strength and recovery during this challenging time.</p>
            
            <p style="margin-top: 30px;">Respectfully,<br>
            <strong>Administrative Review Committee</strong><br>
            Student Led Initiative</p>
          </div>
          
          <div class="footer">
            <p style="margin: 5px 0;"><strong>Support & Assistance</strong></p>
            <p style="margin: 5px 0;">Helpline: +91-7061868784</p>
            <p style="margin: 5px 0;">Email: support@studentinitiative2@gmail.com</p>
            <p style="margin: 15px 0 5px 0; font-size: 11px;">Office Hours: Monday - Friday, 9:00 AM - 5:00 PM IST</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};