// backend/config/EmailConfig.js
import SibApiV3Sdk from '@getbrevo/brevo';
import dotenv from 'dotenv';
dotenv.config();

// ✅ Initialize Brevo API (Works on Render - uses HTTPS, not SMTP)
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Set API Key
apiInstance.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// ✅ Verify API connection
const verifyBrevoAPI = async () => {
  try {
    const account = new SibApiV3Sdk.AccountApi();
    account.setApiKey(
      SibApiV3Sdk.AccountApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );
    await account.getAccount();
    console.log('✅ Brevo API connected successfully');
    console.log('   Sender:', process.env.BREVO_SENDER_EMAIL);
  } catch (err) {
    console.error('❌ Brevo API connection failed:', err.message);
    console.error('   Check: 1) BREVO_API_KEY is correct');
    console.error('          2) BREVO_SENDER_EMAIL is verified in Brevo dashboard');
  }
};

verifyBrevoAPI();

/**
 * Reusable sendEmail function using Brevo API
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content (optional)
 * @param {string} options.html - HTML content
 * @param {Array} options.attachments - Attachments (optional)
 */
export const sendEmail = async ({ to, subject, text, html, attachments }) => {
  try {
    console.log('📧 Sending email via Brevo API...');
    console.log('   To:', to);
    console.log('   Subject:', subject);

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    // Sender info
    sendSmtpEmail.sender = {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "Student-Led Initiative"
    };
    
    // Recipient
    sendSmtpEmail.to = [{ email: to }];
    
    // Subject and content
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html || `<p>${text}</p>`;
    
    // Text fallback
    if (text && !html) {
      sendSmtpEmail.textContent = text;
    }
    
    // Attachments (if provided)
    if (attachments && attachments.length > 0) {
      sendSmtpEmail.attachment = attachments.map(att => ({
        name: att.filename,
        content: att.content, // Base64 encoded content
      }));
    }

    // Send email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent successfully to ${to}`);
    console.log('   Message ID:', result.messageId);
    
    return result;
    
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
    console.error('   Error details:', err.response?.body || err);
    throw err;
  }
};

// Legacy compatibility - export empty transporter for backward compatibility
export const transporter = {
  verify: (callback) => {
    console.log('⚠️  Using Brevo API, transporter.verify() is deprecated');
    callback(null, true);
  }
};