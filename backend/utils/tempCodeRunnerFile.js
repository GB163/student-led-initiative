import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const ensureUploadsFolder = () => {
  const uploadsPath = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
};

export const generateMedicalCard = async (requestId, requestData) => {
  ensureUploadsFolder();

  // CR80 Portrait Size
  const cardWidth = 153;
  const cardHeight = 243;
  const pdfPath = path.join(process.cwd(), "uploads", `medicalCard-${requestId}.pdf`);

  const doc = new PDFDocument({ size: [cardWidth, cardHeight], margin: 0 });
  doc.pipe(fs.createWriteStream(pdfPath));

  // ================= FRONT =================
  doc.rect(0, 0, cardWidth, cardHeight).fill("#ffe6eb");
  doc.roundedRect(5, 5, cardWidth - 10, cardHeight - 10, 8).stroke("#ff6b8b");

  // Logo
  const logoPath = path.join(process.cwd(), "uploads", "blood_cancer_logo.png");
  if (fs.existsSync(logoPath)) {
    const logoWidth = 45;
    doc.image(logoPath, (cardWidth - logoWidth) / 2, 12, { width: logoWidth });
  }
  doc.fillColor("#d6336c").fontSize(11).text("Student Led Initiative", 0, 62, { align: "center" });

  // Photo
  const photoSize = 80;
  const photoX = (cardWidth - photoSize) / 2;
  const photoY = 80;
  doc.roundedRect(photoX - 2, photoY - 2, photoSize + 4, photoSize + 4, 6).stroke("#ff6b8b");

  if (requestData.photo && fs.existsSync(requestData.photo)) {
    doc.image(requestData.photo, photoX, photoY, { width: photoSize, height: photoSize });
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
    `Contact: ${requestData.contact || "N/A"}`
  ];
  let infoY = photoY + photoSize + 16;
  details.forEach(line => {
    doc.text(line, 0, infoY, { align: "center" });
    infoY += 14;
  });

  // ================= BACK =================
  doc.addPage({ size: [cardWidth, cardHeight], margin: 0 });
  doc.rect(0, 0, cardWidth, cardHeight).fill("#ffe6eb");
  doc.roundedRect(5, 5, cardWidth - 10, cardHeight - 10, 8).stroke("#ff6b8b");

  // Title
  doc.fillColor("#d6336c").fontSize(12).text("Medical Information", 0, 20, { align: "center" });

  let backY = 50;
  doc.fillColor("#000").fontSize(9);
  doc.text(`Diagnosis: ${requestData.diagnosis || "N/A"}`, 15, backY);
  backY += 14;
  doc.text(`Hospital: ${requestData.hospital || "N/A"}`, 15, backY);

  // 👉 Space after Hospital
  backY += 20;

  // Scan text BEFORE QR
  doc.fontSize(7).fillColor("#333").text("Scan to access uploaded documents", 0, backY, {
    align: "center",
    width: cardWidth
  });
  backY += 10;

  // QR Code
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  const allFiles = [
    requestData.declaration,
    requestData.incomeCertificate,
    requestData.bill,
    requestData.photo,
    requestData.idProof,
    ...(requestData.reports || [])
  ].filter(Boolean);

  const fileUrls = allFiles.map(f => `${baseUrl}/${f.replace(/\\/g, "/")}`);
  const qrData = JSON.stringify(fileUrls);
  const qrImage = await QRCode.toDataURL(qrData);
  const qrBuffer = Buffer.from(qrImage.split(",")[1], "base64");

  const qrSize = 60; // smaller QR
  doc.image(qrBuffer, (cardWidth - qrSize) / 2, backY, { width: qrSize });
  backY += qrSize + 12;

  // 👉 Divider line under QR
  doc.moveTo(15, backY).lineTo(cardWidth - 15, backY).strokeColor("#999").lineWidth(0.5).stroke();
  backY += 10;

  // Disclaimer
  doc.fontSize(6).fillColor("#555").text(
    "Disclaimer: By using this card you agree to safeguard it. Data you provided is visible to anyone who scans the QR code.",
    15,
    backY,
    { width: cardWidth - 30, align: "justify" }
  );

  // Extra space after Disclaimer
  backY += 28;

  // 👉 Pin Helpline + Email at bottom (so they never overflow)
  const bottomY = cardHeight - 28;
  doc.fontSize(7).fillColor("#d6336c").text("Helpline: +91-7061868784", 0, bottomY - 12, {
    align: "center",
    width: cardWidth
  });
  doc.text("support@studentinitiative2@gmail.com", 0, bottomY, {
    align: "center",
    width: cardWidth
  });

  doc.end();

  return { pdfPath, fileUrls };
};
