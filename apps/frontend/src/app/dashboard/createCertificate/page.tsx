'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storage, ID } from '@/lib/appwrite'; // Assuming you have appwrite setup
import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';

const UploadCertificateForm = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!files) return;

    setIsLoading(true);

    try {
      const file = files[0];
      const fileId = ID.unique(); // Create a unique file ID

      // Upload the PDF to Appwrite Storage
      const uploadedFile = await storage.createFile(
        process.env.NEXT_PUBLIC_APPWRITE_CERTIFICATE_BUCKET as string, // Bucket ID
        fileId, // Unique file ID
        file // The file object
      );
      
      console.log('File uploaded:', uploadedFile);

      // Retrieve the file URL from Appwrite
      const fileURL = uploadedFile.fileId;

      // Load the PDF from the URL
      const arrayBuffer = await fetch(fileURL).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch PDF file");
        return res.arrayBuffer();
      });

      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Embed built-in font
      const font = await pdfDoc.embedFont(PDFDocument.Font.Helvetica);
      const pages = pdfDoc.getPages();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const certificateId = `CERT-${Date.now() + i}`; // Example certificate ID

        // Generate the QR code for the certificate ID
        const qrCodeDataUrl = await QRCode.toDataURL(certificateId);
        const qrImage = await pdfDoc.embedPng(qrCodeDataUrl);

        // Add the certificate ID and QR code to the page
        page.drawText(certificateId, { x: 500, y: 50, size: 12, font });
        page.drawImage(qrImage, { x: 500, y: 80, width: 50, height: 50 });
      }

      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();

      // Convert modified PDF to a Blob to create a downloadable link
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const modifiedPdfUrl = URL.createObjectURL(blob);
      setDownloadUrl(modifiedPdfUrl);

      alert('Certificate(s) processed successfully!');
    } catch (error) {
      console.error('Error submitting certificate upload:', error);
      alert('Error processing certificate.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="pdfs">Upload Certificate (PDF)</Label>
        <Input
          id="pdfs"
          type="file"
          accept=".pdf"
          multiple={false}
          onChange={handleFileChange}
        />
      </div>
      <Button type="submit" className="w-full bg-primary" disabled={isLoading}>
        {isLoading ? 'Uploading...' : 'Upload and Generate Certificate'}
      </Button>

      {downloadUrl && (
        <a
          href={downloadUrl}
          download="generated-certificate.pdf"
          className="mt-4 inline-block bg-green-500 text-white py-2 px-4 rounded"
        >
          Download Generated Certificate
        </a>
      )}
    </form>
  );
};

export default UploadCertificateForm;
