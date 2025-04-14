
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ChatInterface from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
  const [documentsExist, setDocumentsExist] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkDocuments = async () => {
      try {
        setIsLoading(true);
        // Prüfen, ob Dokumente vorhanden sind
        const { count, error } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        
        setDocumentsExist(count !== null && count > 0);
      } catch (error) {
        console.error('Error checking documents:', error);
        setDocumentsExist(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkDocuments();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Chat</h1>
        </div>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-docuchat-primary border-t-transparent rounded-full"></div>
          </div>
        ) : documentsExist ? (
          <div className="flex-1">
            <ChatInterface />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Keine Dokumente vorhanden</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Du musst zuerst ein Dokument hochladen, bevor du mit DocuChat chatten kannst.
            </p>
            <Button 
              onClick={() => navigate('/documents')}
              className="px-6"
            >
              Dokument hochladen
            </Button>
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
