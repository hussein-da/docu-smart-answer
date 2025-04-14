
import React from 'react';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import DocumentList from '@/components/DocumentList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUp, Files } from 'lucide-react';

const DocumentsPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6">Dokumente</h1>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="upload" className="flex items-center">
              <FileUp className="mr-2 h-4 w-4" />
              Hochladen
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center">
              <Files className="mr-2 h-4 w-4" />
              Meine Dokumente
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="pt-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Neues Dokument hochladen</h2>
              <p className="text-muted-foreground mb-8">
                Lade ein Dokument hoch, um es mit DocuChat zu analysieren. 
                Unterstützte Formate: PDF und Textdateien (max. 20MB).
              </p>
              <FileUpload />
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="pt-4">
            <DocumentList />
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="bg-gray-800 text-white py-6">
        <div className="container text-center text-gray-400">
          &copy; {new Date().getFullYear()} DocuChat. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
};

export default DocumentsPage;
