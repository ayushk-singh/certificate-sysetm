import {sdk} from "node-appwrite"; // Correctly import Appwrite SDK
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";

export default async (req, res) => {
  const client = new sdk.Client();
  client
    .setEndpoint(process.env.APPWRITE_HOSTNAME) // Ensure env variables are set
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const storage = new sdk.Storage(client); // Correctly initialize Storage

  try {
    // Step 1: Retrieve the uploaded file from Appwrite Storage
    const fileId = req.payload.$fileId; // File ID passed when uploaded
    const file = await storage.getFileView(process.env.APPWRITE_CERTIFICATE_BUCKET, fileId);
    
    const fileBuffer = Buffer.from(await file.arrayBuffer()); // Convert file to buffer

    // Step 2: Load the PDF document
    const pdfDoc = await PDFDocument.load(fileBuffer);

    // Step 3: Add QR code and unique ID to each page
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(PDFDocument.Font.Helvetica);

    for (const page of pages) {
      const certificateId = `CERT-${Date.now()}`;
      const qrCode = await QRCode.toDataURL(certificateId); // Generate QR Code

      page.drawText(certificateId, { x: 500, y: 50, size: 12, font });
      page.drawImage(qrCode, { x: 500, y: 80, width: 50, height: 50 });
    }

    // Step 4: Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    const modifiedPdfBuffer = Buffer.from(modifiedPdfBytes);

    // Step 5: Upload modified PDF to Appwrite Storage
    const modifiedPdfFile = await storage.createFile(
      process.env.APPWRITE_MODIFIED_BUCKET,
      sdk.ID.unique(),
      modifiedPdfBuffer
    );

    // Step 6: Respond with download link
    const modifiedFileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_MODIFIED_BUCKET}/files/${modifiedPdfFile.$id}/view`;
    res.json({ success: true, downloadUrl: modifiedFileUrl });
  } catch (error) {
    console.error("Error:", error);
    res.json({ success: false, error: "Failed to process PDF" });
  }
};
