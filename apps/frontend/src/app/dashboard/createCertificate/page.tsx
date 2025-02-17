'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storage, ID, functions } from '@/lib/appwrite';
import { Alert, AlertDescription } from '@/components/ui/alert';

const UploadCertificateForm = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFiles = e.target.files;
    
    if (selectedFiles) {
      if (!selectedFiles[0].type.includes('pdf')) {
        setError('Please upload a PDF file');
        return;
      }
      
      if (selectedFiles[0].size > 10 * 1024 * 1024) {
        setError('File size should be less than 10MB');
        return;
      }
      
      setFiles(selectedFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!files?.length) {
      setError('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const file = files[0];
      const fileId = ID.unique();

      // Upload the PDF to Appwrite Storage
      const uploadedFile = await storage.createFile(
        process.env.NEXT_PUBLIC_APPWRITE_CERTIFICATE_BUCKET!,
        fileId,
        file
      );

      // Process the certificate with proper payload structure
      const execution = await functions.createExecution(
        process.env.NEXT_PUBLIC_APPWRITE_CREATE_CERTIFICATE_FUNCTIONS!,
        JSON.stringify({
          fileId: uploadedFile.$id,
          bucketId: process.env.NEXT_PUBLIC_APPWRITE_CERTIFICATE_BUCKET
        })
      );

      // Handle the response more safely
      let result;
      try {
        result = JSON.parse(execution.responseBody || '{}');
      } catch (parseError) {
        console.error('Failed to parse response:', execution.responseBody);
        throw new Error('Invalid response from server');
      }

      if (result?.success) {
        setDownloadUrl(result.downloadUrl);
      } else {
        throw new Error(result?.error || 'Failed to process certificate.');
      }
    } catch (error) {
      console.error('Error processing certificate:', error);
      setError(error instanceof Error ? error.message : 'Failed to process certificate');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pdfs">Upload Certificate (PDF)</Label>
          <Input
            id="pdfs"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isLoading}
            className="cursor-pointer"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading || !files?.length}
        >
          {isLoading ? 'Processing...' : 'Upload and Generate Certificate'}
        </Button>
      </form>

      {downloadUrl && (
        <Button
          asChild
          variant="secondary"
          className="w-full"
        >
          <a href={downloadUrl} download>
            Download Processed Certificate
          </a>
        </Button>
      )}
    </div>
  );
};

export default UploadCertificateForm;