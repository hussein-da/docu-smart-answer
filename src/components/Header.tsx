
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-docuchat-primary" />
          <span className="text-xl font-bold text-docuchat-dark">DocuChat</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-600 hover:text-docuchat-primary">Home</Link>
          <Link to="/documents" className="text-gray-600 hover:text-docuchat-primary">Dokumente</Link>
          <Link to="/chat" className="text-gray-600 hover:text-docuchat-primary">Chat</Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="hidden md:flex items-center">
            <User className="h-4 w-4 mr-2" />
            Login
          </Button>
          <Button className="hidden md:flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Starte Chat
          </Button>
          
          {/* Mobile menu button */}
          <Button variant="ghost" className="md:hidden p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
