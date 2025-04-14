
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import ChatInterface from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Document {
  id: string;
  title: string;
  created_at: string;
}

const ChatPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if a document ID was passed via location state
    const locationState = location.state as { selectedDocumentId?: string } | null;
    if (locationState?.selectedDocumentId) {
      setSelectedDocumentId(locationState.selectedDocumentId);
    }

    fetchDocuments();
  }, [location]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setDocuments(data || []);
      
      // If no document is selected yet but we have documents, select the first one
      if (!selectedDocumentId && data && data.length > 0) {
        // Use document ID from location state if available, otherwise use first document
        const locationState = location.state as { selectedDocumentId?: string } | null;
        setSelectedDocumentId(locationState?.selectedDocumentId || data[0].id);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        ) : documents.length > 0 ? (
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <label htmlFor="document-select" className="block text-sm font-medium text-gray-700 mb-1">
                Wähle ein Dokument für den Chat
              </label>
              <select
                id="document-select"
                value={selectedDocumentId || ''}
                onChange={(e) => setSelectedDocumentId(e.target.value)}
                className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-docuchat-primary focus:border-docuchat-primary"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedDocumentId ? (
              <div className="flex-1">
                <ChatInterface documentId={selectedDocumentId} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Bitte wähle ein Dokument</h2>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Wähle ein Dokument aus der Liste oben, um mit dem Chat zu beginnen.
                </p>
              </div>
            )}
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
