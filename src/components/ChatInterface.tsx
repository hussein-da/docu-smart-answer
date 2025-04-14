
import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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

// Mock initial messages
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      // Mock AI response for demonstration
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Basierend auf deinem Dokument 'Jahresbericht 2023' kann ich folgende Information finden: Die Umsatzziele wurden im 4. Quartal um 15% übertroffen, hauptsächlich dank der neuen Social-Media-Kampagne, die im August gestartet wurde.",
        sender: 'bot',
        timestamp: new Date(),
        sources: [
          {
            documentTitle: 'Jahresbericht 2023.pdf',
            page: 10,
            text: "Im 4. Quartal 2023 wurden die Umsatzziele um 15% übertroffen. Diese positive Entwicklung ist hauptsächlich auf die neue Social-Media-Kampagne zurückzuführen, die im August 2023 gestartet wurde."
          }
        ]
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)]">
      {/* Document selection header */}
      <div className="bg-muted p-3 rounded-t-lg flex items-center">
        <FileText className="h-5 w-5 text-docuchat-primary mr-2" />
        <span className="font-medium">Aktives Dokument: Jahresbericht 2023.pdf</span>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${
              message.sender === 'user' ? 'user-message' : 'bot-message'
            }`}
          >
            {message.content}
            
            {/* Source references */}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                {message.sources.map((source, index) => (
                  <div key={index} className="source-reference">
                    Quelle: {source.documentTitle}
                    {source.page && `, Seite ${source.page}`}: "{source.text}"
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="chat-message bot-message animate-pulse">
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
            placeholder="Stelle eine Frage zu deinem Dokument..."
            className="min-h-[60px] flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !input.trim()}
            className="h-[60px] w-[60px]"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
