
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, AlertCircle, InfoIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  debugInfo?: any;
}

interface ChatInterfaceProps {
  documentId: string;
}

const ChatInterface = ({ documentId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [documentDetails, setDocumentDetails] = useState<any>(null);

  // Get the current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, []);

  // Get document details including processing status
  useEffect(() => {
    const fetchDocumentDetails = async () => {
      if (!documentId) return;

      try {
        // Get document metadata
        const { data: document, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single();
          
        if (error) throw error;
        
        setDocumentTitle(document.title);
        setDocumentDetails(document);
        
        // Check if document has chunks
        const { count, error: countError } = await supabase
          .from('document_chunks')
          .select('id', { count: 'exact', head: true })
          .eq('document_id', documentId);
          
        if (countError) throw countError;
        
        // Add system message about document processing status
        const systemMessages: Message[] = [];
        
        systemMessages.push({
          id: 'welcome',
          role: 'assistant',
          content: `Hallo! Ich bin DocuChat, dein Assistent für das Dokument "${document.title}". Was möchtest du über dieses Dokument wissen?`,
          timestamp: new Date()
        });
        
        if (count === 0) {
          systemMessages.push({
            id: 'processing-warning',
            role: 'system',
            content: `⚠️ Dieses Dokument hat keine verarbeiteten Textabschnitte. Das könnte bedeuten, dass die Verarbeitung noch läuft oder fehlgeschlagen ist. Versuche das Dokument erneut hochzuladen oder warte einen Moment.`,
            timestamp: new Date(),
            debugInfo: { documentInfo: document, chunkCount: count }
          });
        } else {
          systemMessages.push({
            id: 'processing-info',
            role: 'system',
            content: `ℹ️ Dieses Dokument hat ${count} verarbeitete Textabschnitte.`,
            timestamp: new Date(),
            debugInfo: { documentInfo: document, chunkCount: count }
          });
        }
        
        setMessages(systemMessages);
      } catch (error) {
        console.error('Error fetching document details:', error);
        toast({
          title: "Fehler bei Dokumentdetails",
          description: "Es gab ein Problem beim Abrufen der Dokumentdetails.",
          variant: "destructive",
        });
      }
    };
    
    fetchDocumentDetails();
  }, [documentId]);
  
  // Load chat history when documentId changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!documentId || !user) return;
      
      try {
        const { data, error } = await supabase
          .from('chat_history')
          .select('*')
          .eq('document_id', documentId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        // If we have chat history, replace the welcome messages with the history
        if (data && data.length > 0) {
          const formattedMessages: Message[] = [];
          
          // Format the chat history into messages
          data.forEach((item, index) => {
            // Add user question
            formattedMessages.push({
              id: `${item.id}-q`,
              role: 'user',
              content: item.question,
              timestamp: new Date(item.created_at)
            });
            
            // Add AI answer
            formattedMessages.push({
              id: `${item.id}-a`,
              role: 'assistant',
              content: item.answer,
              timestamp: new Date(item.created_at)
            });
          });
          
          // Prepend the system messages
          setMessages((prevMessages) => {
            const systemMessages = prevMessages.filter(msg => msg.role === 'system');
            return [...systemMessages, ...formattedMessages];
          });
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };
    
    fetchChatHistory();
  }, [documentId, user, documentTitle]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    if (!user) {
      toast({
        title: "Nicht eingeloggt",
        description: "Du musst eingeloggt sein, um mit den Dokumenten zu chatten.",
        variant: "destructive",
      });
      return;
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Call the edge function to chat with the document
      const { data, error } = await supabase.functions.invoke('chat-with-document', {
        body: {
          documentId,
          question: input,
          userId: user.id
        }
      });
      
      if (error) throw error;
      
      // Check if there are any chunks found
      let debugInfo = data.debug || {};
      let content = data.answer;
      
      if (data.relevantChunks && data.relevantChunks.length === 0) {
        content = "Ich konnte keine relevanten Informationen im Dokument finden, um deine Frage zu beantworten. Möglicherweise wurde das Dokument nicht vollständig verarbeitet oder enthält nicht die gesuchten Informationen.";
        
        // Add debug information
        debugInfo = {
          ...debugInfo,
          noChunksFound: true
        };
      }
      
      // Add assistant's response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: content || "Entschuldigung, ich konnte keine Antwort generieren. Bitte versuche es mit einer anderen Frage.",
        timestamp: new Date(),
        debugInfo: debugInfo
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error querying document:', error);
      
      setErrorMessage(
        "Es gab ein Problem bei der Verarbeitung deiner Anfrage. Bitte versuche es später erneut."
      );
      
      // Add error message as system message
      const errorDebugMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `Fehler bei der Verarbeitung: ${error.message || "Unbekannter Fehler"}`,
        timestamp: new Date(),
        debugInfo: { error }
      };
      
      setMessages((prev) => [...prev, errorDebugMessage]);
      
      toast({
        title: "Fehler",
        description: error.message || "Es gab ein Problem bei der Verarbeitung deiner Anfrage.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reprocessDocument = async () => {
    if (!documentId || !user) return;

    setIsLoading(true);
    try {
      // Call the process-document function
      const { error } = await supabase.functions.invoke('process-document', {
        body: { documentId }
      });
      
      if (error) throw error;
      
      toast({
        title: "Verarbeitung gestartet",
        description: "Das Dokument wird erneut verarbeitet. Dies kann einige Momente dauern.",
      });
      
      // Add system message
      const systemMessage: Message = {
        id: `reprocess-${Date.now()}`,
        role: 'system',
        content: `🔄 Dokument wird erneut verarbeitet. Bitte warte einen Moment, bevor du weitere Fragen stellst.`,
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, systemMessage]);
    } catch (error: any) {
      console.error('Error reprocessing document:', error);
      
      toast({
        title: "Fehler bei der Verarbeitung",
        description: error.message || "Es gab ein Problem bei der erneuten Verarbeitung des Dokuments.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  return (
    <div className="flex flex-col h-full rounded-lg border border-gray-200 overflow-hidden bg-white">
      {/* Chat header */}
      <div className="py-3 px-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="font-medium">Chat mit Dokument: {documentTitle}</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={reprocessDocument}
            disabled={isLoading}
          >
            Dokument neu verarbeiten
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={toggleDebugInfo}
          >
            <InfoIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Debug panel */}
      {showDebugInfo && documentDetails && (
        <div className="p-3 bg-gray-50 border-b border-gray-200 text-xs">
          <Accordion type="single" collapsible>
            <AccordionItem value="document-info">
              <AccordionTrigger className="py-2">Dokumentinformationen</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
                  {JSON.stringify(documentDetails, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 
              message.role === 'system' ? 'justify-center' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-docuchat-primary text-white'
                  : message.role === 'system'
                  ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <div
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 
                  message.role === 'system' ? 'text-yellow-600' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>

              {/* Debug info for message */}
              {showDebugInfo && message.debugInfo && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="debug-info">
                      <AccordionTrigger className="py-1 text-xs">Debug Infos</AccordionTrigger>
                      <AccordionContent>
                        <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-40 text-xs">
                          {JSON.stringify(message.debugInfo, null, 2)}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-4 bg-gray-100">
              <div className="flex items-center text-gray-500">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Denkt nach...
              </div>
            </div>
          </div>
        )}
        
        {errorMessage && (
          <div className="flex justify-center">
            <div className="max-w-[80%] rounded-lg p-3 bg-red-50 text-red-600 text-center">
              {errorMessage}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Stelle eine Frage zu deinem Dokument..."
            className="flex-1 min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="h-[60px] w-[60px]"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
