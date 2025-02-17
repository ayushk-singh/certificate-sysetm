const sdk = require("node-appwrite");
const { PDFDocument } = require("pdf-lib");
const QRCode = require("qrcode");

module.exports = async function (req, res) {
  // Validate input
  const payload = typeof req.payload === 'string' ? JSON.parse(req.payload) : req.payload;
  
  if (!payload || !payload.fileId || !payload.bucketId) {
    return res.json({
      success: false,
      error: "Missing required parameters"
    });
  }

  const client = new sdk.Client();
  client
    .setEndpoint(process.env.APPWRITE_HOSTNAME)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const storage = new sdk.Storage(client);

  try {
    // Retrieve the uploaded file
    const file = await storage.getFileView(
      payload.bucketId,
      payload.fileId
    );

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Process the PDF
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pages = pdfDoc.getPages();
    const helveticaFont = await pdfDoc.embedFont(PDFDocument.Font.Helvetica);

    for (const page of pages) {
      const { width, height } = page.getSize();
      
      // Generate unique certificate ID
      const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(certificateId, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 100
      });
      
      // Convert QR code data URL to PNG image
      const qrCodeImage = await pdfDoc.embedPng(
        Buffer.from(qrCodeDataUrl.split(',')[1], 'base64')
      );
      
      // Add certificate ID text
      page.drawText(certificateId, {
        x: width - 200,
        y: 50,
        size: 12,
        font: helveticaFont
      });
      
      // Add QR code
      page.drawImage(qrCodeImage, {
        x: width - 120,
        y: 70,
        width: 100,
        height: 100
      });
    }

    // Save and upload modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    const modifiedPdfBuffer = Buffer.from(modifiedPdfBytes);

    const modifiedPdfFile = await storage.createFile(
      process.env.APPWRITE_MODIFIED_BUCKET,
      sdk.ID.unique(),
      modifiedPdfBuffer
    );

    const downloadUrl = storage.getFileView(
      process.env.APPWRITE_MODIFIED_BUCKET,
      modifiedPdfFile.$id
    );

    return res.json({
      success: true,
      downloadUrl: downloadUrl.href,
      message: 'Certificate processed successfully'
    });
  } catch (error) {
    console.error("Error processing certificate:", error);
    return res.json({
      success: false,
      error: error.message || "Failed to process PDF"
    });
  }
};