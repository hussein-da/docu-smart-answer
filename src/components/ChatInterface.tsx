
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

  // Get the current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, []);

  // Get the document title whenever the documentId changes
  useEffect(() => {
    const fetchDocumentTitle = async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('title')
          .eq('id', documentId)
          .single();
          
        if (error) throw error;
        
        setDocumentTitle(data.title);
        
        // Add a welcome message with the document name
        if (messages.length === 0) {
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: `Hallo! Ich bin DocuChat, dein Assistent für das Dokument "${data.title}". Was möchtest du über dieses Dokument wissen?`,
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching document title:', error);
      }
    };
    
    if (documentId) {
      fetchDocumentTitle();
    }
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
        
        const formattedMessages: Message[] = [];
        
        // Add welcome message if there's no history
        if (data.length === 0) {
          if (documentTitle) {
            formattedMessages.push({
              id: 'welcome',
              role: 'assistant',
              content: `Hallo! Ich bin DocuChat, dein Assistent für das Dokument "${documentTitle}". Was möchtest du über dieses Dokument wissen?`,
              timestamp: new Date()
            });
          }
        } else {
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
        }
        
        setMessages(formattedMessages);
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
      
      // Add assistant's response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || "Entschuldigung, ich konnte keine Antwort generieren. Bitte versuche es mit einer anderen Frage.",
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error querying document:', error);
      
      setErrorMessage(
        "Es gab ein Problem bei der Verarbeitung deiner Anfrage. Bitte versuche es später erneut."
      );
      
      toast({
        title: "Fehler",
        description: error.message || "Es gab ein Problem bei der Verarbeitung deiner Anfrage.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-lg border border-gray-200 overflow-hidden bg-white">
      {/* Chat header */}
      <div className="py-3 px-4 border-b border-gray-200 bg-gray-50">
        <h2 className="font-medium">Chat mit Dokument: {documentTitle}</h2>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-docuchat-primary text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <div
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
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
