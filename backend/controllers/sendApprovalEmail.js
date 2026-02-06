import { sendEmail } from "../config/mailconfig.js";

export const sendApprovalEmail = async (email, name, role) => {
  try {
    await sendEmail({
      to: email,
      subject: "Join Request Approved ✅",
      html: `<p>Hi ${name},</p>
             <p>Your join request has been approved as <strong>${role}</strong>. Welcome aboard!</p>
             <p>You can now log in and access staff features.</p>
             <p>Regards,<br/>Admin Team</p>`,
    });
  } catch (err) {
    console.error("❌ Error sending approval email:", err.message);
    throw err;
  }
};
