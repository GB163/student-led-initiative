// backend/utils/generateMedicalCard.js
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// Ensure uploads folder exists
const ensureUploadsFolder = () => {
  const uploadsPath = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
};

/**
 * Generate a PDF medical card with front/back and QR linking to uploaded files.
 * @param {String} requestId - MongoDB request ID
 * @param {Object} requestData - Request object containing patient info and file paths
 * @returns {Promise<Object>} { pdfPath, fileUrls }
 */
export const generateMedicalCard = async (requestId, requestData) => {
  return new Promise((resolve, reject) => {
    try {
      ensureUploadsFolder();

      const cardWidth = 153;
      const cardHeight = 243;
      const pdfPath = path.join(process.cwd(), "uploads", `medicalCard-${requestId}.pdf`);
      const doc = new PDFDocument({ size: [cardWidth, cardHeight], margin: 0 });
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      // ---------------- FRONT ----------------
      doc.rect(0, 0, cardWidth, cardHeight).fill("#ffe6eb");
      doc.roundedRect(5, 5, cardWidth - 10, cardHeight - 10, 8).stroke("#ff6b8b");

      // Logo
      const logoPath = path.join(process.cwd(), "uploads", "blood_cancer_logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (cardWidth - 45) / 2, 12, { width: 45 });
      }

      doc.fillColor("#d6336c").fontSize(11).text("Student Led Initiative", 0, 62, { align: "center" });

      // Patient Photo
      const photoSize = 80;
      const photoX = (cardWidth - photoSize) / 2;
      const photoY = 80;
      doc.roundedRect(photoX - 2, photoY - 2, photoSize + 4, photoSize + 4, 6).stroke("#ff6b8b");
      
      if (requestData.patientPhoto && fs.existsSync(`.${requestData.patientPhoto}`)) {
        doc.image(`.${requestData.patientPhoto}`, photoX, photoY, { width: photoSize, height: photoSize });
      } else {
        doc.rect(photoX, photoY, photoSize, photoSize).stroke("#ff6b8b");
        doc.fontSize(10).fillColor("#666").text("No Photo", photoX + 12, photoY + 30);
      }

      // Patient Info
      doc.fillColor("#000").fontSize(9);
      const details = [
        `Patient: ${requestData.patientName || "N/A"}`,
        `Age: ${requestData.age || "N/A"}`,
        `Blood Group: ${requestData.bloodGroup || "N/A"}`,
        `Contact: ${requestData.patientPhone || "N/A"}`
      ];
      let infoY = photoY + photoSize + 16;
      details.forEach(line => { 
        doc.text(line, 0, infoY, { align: "center" }); 
        infoY += 14; 
      });

      // ---------------- BACK ----------------
      doc.addPage({ size: [cardWidth, cardHeight], margin: 0 });
      doc.rect(0, 0, cardWidth, cardHeight).fill("#ffe6eb");
      doc.roundedRect(5, 5, cardWidth - 10, cardHeight - 10, 8).stroke("#ff6b8b");

      doc.fillColor("#d6336c").fontSize(12).text("Medical Information", 0, 20, { align: "center" });
      let backY = 50;
      doc.fillColor("#000").fontSize(9);
      doc.text(`Diagnosis: ${requestData.diagnosis || "N/A"}`, 15, backY);
      backY += 14;
      doc.text(`Hospital: ${requestData.hospitalName || "N/A"}`, 15, backY);
      backY += 20;

      // ---------------- QR Code ----------------
      const allFiles = [
        requestData.declaration,
        requestData.incomeProof,
        requestData.hospitalBill,
        requestData.patientPhoto,
        requestData.applicantId,
        ...(requestData.reports || [])
      ].filter(Boolean);

      // Generate QR code asynchronously
      const generateQRAndFinalize = async () => {
        try {
          if (allFiles.length > 0) {
            // Get base URL from environment - uses BACKEND_URL or BASE_URL
            const baseUrl = process.env.BACKEND_URL || process.env.BASE_URL || "https://studentledinitiative.onrender.com";
            
            console.log('🔗 Using base URL for file links:', baseUrl);
            
            const fileUrls = allFiles.map(f => `${baseUrl}${f.replace(/\\/g, "/")}`);
            const qrData = fileUrls.join("\n");
            
            const qrImage = await QRCode.toDataURL(qrData);
            const qrBuffer = Buffer.from(qrImage.split(",")[1], "base64");
            const qrSize = 60;
            doc.image(qrBuffer, (cardWidth - qrSize) / 2, backY, { width: qrSize });
            backY += qrSize + 12;
          }

          // Disclaimer
          doc.moveTo(15, backY).lineTo(cardWidth - 15, backY).strokeColor("#999").lineWidth(0.5).stroke();
          backY += 10;

          doc.fontSize(6).fillColor("#555").text(
            "Disclaimer: By using this card you agree to safeguard it. Data you provided is visible to anyone who scans the QR code.",
            15, backY, { width: cardWidth - 30, align: "justify" }
          );

          // Footer
          const bottomY = cardHeight - 28;
          doc.fontSize(7).fillColor("#d6336c").text("Helpline: +91-7061868784", 0, bottomY - 12, { align: "center", width: cardWidth });
          doc.text("support@studentinitiative2@gmail.com", 0, bottomY, { align: "center", width: cardWidth });

          doc.end();
        } catch (qrError) {
          console.error('❌ QR Code generation error:', qrError);
          reject(qrError);
        }
      };

      // Handle stream events
      writeStream.on('finish', () => {
        const baseUrl = process.env.BACKEND_URL || process.env.BASE_URL || "https://studentledinitiative.onrender.com";
        resolve({
          pdfPath,
          fileUrls: allFiles.map(f => `${baseUrl}${f.replace(/\\/g, "/")}`)
        });
      });

      writeStream.on('error', (error) => {
        console.error('❌ Write stream error:', error);
        reject(error);
      });

      // Generate QR code and finalize PDF
      generateQRAndFinalize();

    } catch (error) {
      console.error('❌ Medical card generation error:', error);
      reject(error);
    }
  });
};