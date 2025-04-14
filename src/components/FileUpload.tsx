
import React, { useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const FileUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

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

  const uploadFile = async () => {
    if (!file) return;
    
    try {
      setUploading(true);
      setProgress(0);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Nicht eingeloggt');
      }
      
      // Create folder path for the current user
      const folderPath = `${user.id}/${Date.now()}_${file.name}`;
      
      // Upload file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('documents')
        .upload(folderPath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 50);
            setProgress(percent); // Up to 50% for upload progress
          },
        });
        
      if (uploadError) throw uploadError;
      
      // Create database record
      const { error: dbError, data: document } = await supabase
        .from('documents')
        .insert({
          title: file.name,
          file_path: folderPath,
          file_type: file.type,
          file_size: file.size,
          page_count: file.type === 'application/pdf' ? null : 1, // Set page count for text files
          user_id: user.id
        })
        .select()
        .single();
        
      if (dbError) throw dbError;
      
      // Trigger document processing function
      const { error: processingError } = await supabase.functions.invoke('process-document', {
        body: { documentId: document.id }
      });
      
      if (processingError) throw processingError;
      
      // Simulating processing time for the remaining 50%
      let currentProgress = 50;
      const interval = setInterval(() => {
        currentProgress += 5;
        setProgress(currentProgress);
        
        if (currentProgress >= 100) {
          clearInterval(interval);
          setSuccess(true);
          setUploading(false);
          
          toast({
            title: "Dokument erfolgreich verarbeitet",
            description: "Dein Dokument wurde hochgeladen und kann nun verwendet werden.",
          });
        }
      }, 300);
      
    } catch (error: any) {
      console.error('Error uploading document:', error);
      setError(error.message || 'Fehler beim Hochladen des Dokuments');
      setUploading(false);
      
      toast({
        title: "Fehler beim Hochladen",
        description: error.message || 'Fehler beim Hochladen des Dokuments',
        variant: "destructive",
      });
    }
  };

  const resetUpload = () => {
    setFile(null);
    setProgress(0);
    setSuccess(false);
    setError(null);
  };

  const goToDocuments = () => {
    navigate('/documents');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
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
                  <span>Erfolgreich hochgeladen und verarbeitet</span>
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
              <Button onClick={goToDocuments}>
                Zu meinen Dokumenten
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
