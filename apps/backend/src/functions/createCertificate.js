const sdk = require("node-appwrite"); // ✅ Use require for CommonJS modules
const { PDFDocument } = require("pdf-lib");
const QRCode = require("qrcode");

module.exports.main = async (req, res) => {
  const client = new sdk.Client();
  client
    .setEndpoint(process.env.APPWRITE_HOSTNAME) // Ensure this is correctly set
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const storage = new sdk.Storage(client); // ✅ Correctly instantiate Storage

  try {
    // Step 1: Retrieve the uploaded file from Appwrite Storage
    const fileId = req.payload.$fileId;
    const file = await storage.getFileView(
      process.env.APPWRITE_CERTIFICATE_BUCKET, 
      fileId
    );

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Step 2: Process the PDF
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(PDFDocument.Font.Helvetica);

    for (const page of pages) {
      const certificateId = `CERT-${Date.now()}`;
      const qrCodeDataUrl = await QRCode.toDataURL(certificateId);

      page.drawText(certificateId, { x: 500, y: 50, size: 12, font });
      // QR Code embedding logic should use a PNG, not directly the DataURL
    }

    // Step 4: Save and upload the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    const modifiedPdfBuffer = Buffer.from(modifiedPdfBytes);

    const modifiedPdfFile = await storage.createFile(
      process.env.APPWRITE_MODIFIED_BUCKET,
      sdk.ID.unique(),
      modifiedPdfBuffer
    );

    const modifiedFileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.APPWRITE_MODIFIED_BUCKET}/files/${modifiedPdfFile.$id}/view`;
    res.json({ success: true, downloadUrl: modifiedFileUrl });
  } catch (error) {
    console.error("Error:", error);
    res.json({ success: false, error: "Failed to process PDF" });
  }
};
