
import React from 'react';
import Header from '@/components/Header';
import ChatInterface from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

const ChatPage = () => {
  // Mock data for document selection
  const documents = [
    { id: '1', title: 'Jahresbericht 2023.pdf' },
    { id: '2', title: 'Vertrag ABC GmbH.pdf' },
    { id: '3', title: 'Studienmaterial.txt' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Chat</h1>
          
          <div className="flex items-center">
            <span className="mr-2 text-sm text-muted-foreground">Dokument auswählen:</span>
            <select className="border rounded-md px-3 py-1 bg-background">
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.title}</option>
              ))}
              <option value="all">Alle Dokumente</option>
            </select>
          </div>
        </div>
        
        {documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Keine Dokumente vorhanden</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Du musst zuerst ein Dokument hochladen, bevor du mit DocuChat chatten kannst.
            </p>
            <Button asChild>
              <a href="/documents">Dokument hochladen</a>
            </Button>
          </div>
        ) : (
          <div className="flex-1">
            <ChatInterface />
          </div>
        )}
      </main>
      
      <footer className="bg-gray-800 text-white py-6">
        <div className="container text-center text-gray-400">
          &copy; {new Date().getFullYear()} DocuChat. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
};

export default ChatPage;
