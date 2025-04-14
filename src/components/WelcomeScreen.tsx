
import React from 'react';
import { FileText, PenSquare, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const WelcomeScreen = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Willkommen bei DocuChat</h1>
        <p className="text-gray-600 text-lg">
          Dein KI-Assistent für intelligente Dokumentenanalyse und -interaktion
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex items-start mb-4">
            <FileText className="h-8 w-8 text-docuchat-primary mr-3" />
            <h2 className="text-xl font-semibold">Dokumente hochladen</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Lade deine PDF-Dokumente und Textdateien hoch, damit DocuChat sie analysieren und verstehen kann.
          </p>
          <Button asChild className="w-full">
            <Link to="/documents">Jetzt Dokumente verwalten</Link>
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex items-start mb-4">
            <MessageSquare className="h-8 w-8 text-docuchat-primary mr-3" />
            <h2 className="text-xl font-semibold">Mit Dokumenten chatten</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Stelle natürlichsprachliche Fragen zu deinen Dokumenten und erhalte präzise Antworten mit Quellenangaben.
          </p>
          <Button asChild className="w-full">
            <Link to="/chat">Jetzt mit Dokumenten chatten</Link>
          </Button>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-8">
        <div className="flex items-start mb-2">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Erste Schritte mit DocuChat</h3>
            <p className="text-gray-600 text-sm mt-1">
              Um mit DocuChat zu beginnen, lade zuerst ein Dokument auf der <Link to="/documents" className="text-docuchat-primary hover:underline">Dokumente-Seite</Link> hoch. Anschließend kannst du auf der <Link to="/chat" className="text-docuchat-primary hover:underline">Chat-Seite</Link> Fragen zu deinem Dokument stellen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
