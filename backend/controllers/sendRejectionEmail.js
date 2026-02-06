import { sendEmail } from "../config/mailconfig.js";

export const sendRejectionEmail = async (email, name) => {
  try {
    await sendEmail({
      to: email,
      subject: "Join Request Rejected ❌",
      html: `<p>Hi ${name},</p>
             <p>We regret to inform you that your join request has been rejected.</p>
             <p>Regards,<br/>Admin Team</p>`,
    });
  } catch (err) {
    console.error("❌ Error sending rejection email:", err.message);
    throw err;
  }
};
