
import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, CornerDownLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Message type
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: {
    documentTitle: string;
    page?: number;
    text: string;
  }[];
}

// Document type
interface Document {
  id: string;
  title: string;
  file_type: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    content: 'Willkommen bei DocuChat! Ich kann dir helfen, Informationen in deinen Dokumenten zu finden. Was möchtest du wissen?',
    sender: 'bot',
    timestamp: new Date(),
  },
];

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch user's documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoadingDocuments(true);
        const { data, error } = await supabase
          .from('documents')
          .select('id, title, file_type');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setDocuments(data);
          setSelectedDocumentId(data[0].id); // Default wählt das erste Dokument
        } else {
          // Keine Dokumente gefunden
          setDocuments([]);
        }
      } catch (error: any) {
        console.error('Error fetching documents:', error);
        toast({
          title: 'Fehler beim Laden der Dokumente',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setIsLoadingDocuments(false);
      }
    };

    fetchDocuments();
  }, [toast]);

  const askQuestion = async (question: string, documentId: string) => {
    // Hier würden wir normalerweise einen API-Call an unsere Supabase Edge Function machen
    // Für jetzt simulieren wir eine Antwort
    try {
      setIsLoading(true);
      
      // Dokument-Informationen für die simulierte Antwort abrufen
      const { data: documentData } = await supabase
        .from('documents')
        .select('title')
        .eq('id', documentId)
        .single();
      
      const documentTitle = documentData?.title || 'Unbekanntes Dokument';
      
      // Simulierte verzögerte Antwort
      // In der realen Implementierung würde hier die Edge Function aufgerufen werden
      setTimeout(() => {
        const botResponse: Message = {
          id: Date.now().toString(),
          content: `Basierend auf dem Dokument "${documentTitle}" kann ich folgende Information finden: Dies ist eine simulierte Antwort auf deine Frage "${question}". In einer vollständigen Implementierung würde hier die KI-generierte Antwort stehen, die auf dem tatsächlichen Inhalt des Dokuments basiert.`,
          sender: 'bot',
          timestamp: new Date(),
          sources: [
            {
              documentTitle,
              page: 1,
              text: "Dies ist ein Beispieltext aus dem Dokument, der als Quelle für die Antwort dient. In einer vollständigen Implementierung würde hier der tatsächliche Textausschnitt aus dem Dokument stehen."
            }
          ]
        };
        
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
      }, 2000);
      
    } catch (error: any) {
      console.error('Error generating answer:', error);
      toast({
        title: 'Fehler bei der Verarbeitung',
        description: 'Es gab ein Problem bei der Verarbeitung deiner Anfrage.',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    if (!selectedDocumentId) {
      toast({
        title: 'Kein Dokument ausgewählt',
        description: 'Bitte wähle ein Dokument aus, bevor du eine Frage stellst.',
        variant: 'destructive'
      });
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    const question = input;
    setInput('');
    
    // Generate answer
    askQuestion(question, selectedDocumentId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Find the selected document title
  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)]">
      {/* Document selection header */}
      <div className="bg-muted p-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-docuchat-primary mr-2" />
          <span className="font-medium">Dokument auswählen:</span>
        </div>
        
        {isLoadingDocuments ? (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Dokumente werden geladen...</span>
          </div>
        ) : documents.length === 0 ? (
          <span className="text-sm text-amber-600">
            Keine Dokumente vorhanden. Bitte lade zuerst ein Dokument hoch.
          </span>
        ) : (
          <Select 
            value={selectedDocumentId} 
            onValueChange={setSelectedDocumentId}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Dokument auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Deine Dokumente</SelectLabel>
                {documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.title} ({doc.file_type})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 p-4 rounded-lg ${
              message.sender === 'user' 
                ? 'bg-blue-100 ml-auto max-w-3xl' 
                : 'bg-white border border-gray-200 mr-auto max-w-3xl'
            }`}
          >
            <div className="text-sm font-semibold mb-1">
              {message.sender === 'user' ? 'Du' : 'DocuChat'}
            </div>
            <div className="text-gray-800 whitespace-pre-wrap">
              {message.content}
            </div>
            
            {/* Source references */}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-1">Quellen:</p>
                {message.sources.map((source, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-xs text-gray-600 mt-1">
                    <p className="font-medium">{source.documentTitle}
                    {source.page && `, Seite ${source.page}`}</p>
                    <p className="mt-1 italic">"{source.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="bg-white border border-gray-200 p-4 rounded-lg mr-auto max-w-3xl mb-4">
            <div className="text-sm font-semibold mb-1">DocuChat</div>
            <div className="flex space-x-2 items-center">
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="p-4 border-t">
        <div className="flex items-end space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={documents.length === 0 
              ? "Bitte lade zuerst ein Dokument hoch..." 
              : "Stelle eine Frage zu deinem Dokument..."}
            className="min-h-[60px] flex-1"
            disabled={documents.length === 0 || isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !input.trim() || documents.length === 0 || !selectedDocumentId}
            className="h-[60px] w-[60px]"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="flex items-center mt-2 text-xs text-muted-foreground">
          <CornerDownLeft className="h-3 w-3 mr-1" />
          <span>Drücke Enter zum Senden, Shift+Enter für neue Zeile</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
