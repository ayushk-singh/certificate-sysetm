const { client, storage } = require('node-appwrite'); // Use CommonJS require
const { PDFDocument } = require('pdf-lib');
const QRCode = require('qrcode');

// Define the function to create the certificate
module.exports.main = async (req, res) =>  {
  const client = new sdk.Client();
  client
    .setEndpoint(process.env.APPWRITE_HOSTNAME)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const storage = new Storage(sdk);

  try {
    // Step 1: Retrieve the uploaded file from Appwrite Storage
    const fileId = req.payload.$fileId; // The file ID passed when the file is uploaded
    const fileData = await storage.getFile(fileId); // Get the file from Appwrite Storage

    // Convert fileData into a usable format (ArrayBuffer or Buffer)
    const fileBuffer = await fileData.arrayBuffer();

    // Step 2: Load the PDF document
    const pdfDoc = await PDFDocument.load(fileBuffer); // Load the uploaded PDF

    // Step 3: Add QR code and unique ID to each page
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(PDFDocument.Font.Helvetica);

    for (const page of pages) {
      const certificateId = `CERT-${Date.now()}`;
      const qrCode = await QRCode.toDataURL(certificateId); // Generate QR Code as Data URL

      // Add the certificate ID and QR code to the page
      page.drawText(certificateId, { x: 500, y: 50, size: 12, font });
      page.drawImage(qrCode, { x: 500, y: 80, width: 50, height: 50 });
    }

    // Step 4: Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // Step 5: Upload the modified PDF to Appwrite Storage
    const modifiedPdf = new Blob([modifiedPdfBytes], {
      type: "application/pdf",
    });

    // Use a unique ID for the modified file
    const modifiedPdfFile = await storage.createFile(
      "[MODIFIED_BUCKET_ID]", // The bucket where the modified PDFs will be saved
      "unique-id", // Unique file ID
      modifiedPdf
    );

    // Step 6: Respond with the download link
    const modifiedFileUrl = modifiedPdfFile.getUrl(); // Get the URL for the modified file
    res.json({ success: true, downloadUrl: modifiedFileUrl });
  } catch (error) {
    console.error(error);
    res.json({ success: false, error: "Failed to process PDF" });
  }
}
