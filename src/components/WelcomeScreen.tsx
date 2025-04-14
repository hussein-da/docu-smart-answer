
import React from 'react';
import { FileText, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const WelcomeScreen = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Welcome to DocuChat</h1>
        <p className="text-gray-600 text-lg">
          Your AI Assistant for Intelligent Document Analysis and Interaction
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex items-start mb-4">
            <FileText className="h-8 w-8 text-docuchat-primary mr-3" />
            <h2 className="text-xl font-semibold">Upload Documents</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Upload your PDF documents and text files for DocuChat to analyze and understand.
          </p>
          <Button asChild className="w-full">
            <Link to="/documents">Manage Documents</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex items-start mb-4">
            <MessageSquare className="h-8 w-8 text-docuchat-primary mr-3" />
            <h2 className="text-xl font-semibold">Chat with Documents</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Ask natural language questions about your documents and get precise answers with source citations.
          </p>
          <Button asChild className="w-full">
            <Link to="/chat">Start Chatting</Link>
          </Button>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-8">
        <div className="flex items-start mb-2">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Getting Started with DocuChat</h3>
            <p className="text-gray-600 text-sm mt-1">
              To begin using DocuChat, first upload a document on the <Link to="/documents" className="text-docuchat-primary hover:underline">Documents page</Link>. Then, head to the <Link to="/chat" className="text-docuchat-primary hover:underline">Chat page</Link> to start asking questions about your document.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
