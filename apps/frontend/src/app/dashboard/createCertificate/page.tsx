'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storage, ID, functions } from '@/lib/appwrite'; // Assuming you have appwrite setup



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

      // Step 1: Trigger the Appwrite function to process the certificate
      const response = await functions.createExecution(
        process.env.NEXT_PUBLIC_APPWRITE_CREATE_CERTIFICATE_FUNCTIONS as string,  // The function ID you created in Appwrite
        JSON.stringify({ $fileId: uploadedFile.$id })  // Pass the file ID to the function
      );

      // Step 2: Process the function response
      const result = await response.json();

      if (result.success) {
        // Step 3: Set the download URL for the generated certificate
        setDownloadUrl(result.downloadUrl);
      } else {
        throw new Error('Failed to process certificate.');
      }

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
