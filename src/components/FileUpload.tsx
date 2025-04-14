
import React, { useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const FileUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Check if file is PDF or text
    const validTypes = ['application/pdf', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      setError('Nur PDF und Textdateien werden unterstützt');
      return;
    }
    
    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('Die Datei darf nicht größer als 20MB sein');
      return;
    }
    
    setFile(file);
    setError(null);
  };

  const uploadFile = () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setSuccess(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    // In a real application, we would upload to Supabase here
    // and process the file on the server
  };

  const resetUpload = () => {
    setFile(null);
    setProgress(0);
    setSuccess(false);
    setError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!file ? (
        <div
          className={`file-upload-zone ${isDragging ? 'border-primary bg-primary/5' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Datei hochladen</h3>
          <p className="text-muted-foreground mb-4">
            Ziehe deine PDF oder Textdatei hierher oder klicke zum Auswählen
          </p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.txt"
            onChange={handleFileChange}
          />
          <Button type="button" onClick={() => document.getElementById('file-upload')?.click()}>
            Datei auswählen
          </Button>
          {error && (
            <div className="mt-4 p-2 bg-red-50 text-red-600 rounded flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-6">
          <div className="flex items-start mb-4">
            <File className="h-10 w-10 text-docuchat-primary mr-4" />
            <div className="flex-1">
              <h3 className="font-medium">{file.name}</h3>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
              </p>
              
              {uploading && (
                <div className="mt-2">
                  <Progress value={progress} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">Verarbeitung: {progress}%</p>
                </div>
              )}
              
              {success && (
                <div className="mt-2 flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Erfolgreich hochgeladen</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={resetUpload} disabled={uploading}>
              Abbrechen
            </Button>
            {!success ? (
              <Button onClick={uploadFile} disabled={uploading}>
                {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
              </Button>
            ) : (
              <Button variant="outline" onClick={resetUpload}>
                Neue Datei
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
