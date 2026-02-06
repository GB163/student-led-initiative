import dotenv from "dotenv";
import { sendEmail } from "./Emailconfig.js";

dotenv.config();

(async () => {
  try {
    await sendEmail({
      to: "your-email@gmail.com", // replace with your email
      subject: "Test Email",
      text: "This is a test email from Node.js",
    });
  } catch (err) {
    console.error("❌ Test email failed:", err.message);
  }
})();
