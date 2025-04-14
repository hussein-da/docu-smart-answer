
import React from 'react';
import { FileText, Brain, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <div className="py-16 md:py-24 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        <div className="inline-block p-2 bg-blue-100 rounded-full mb-6 animate-bounce-light">
          <Brain className="h-8 w-8 text-docuchat-primary" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Stelle Fragen an deine Dokumente mit KI
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Lade deine PDFs hoch und befrage sie wie einen persönlichen Assistenten. 
          DocuChat findet die relevanten Informationen in Sekundenschnelle.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Button asChild size="lg" className="text-lg px-8">
            <Link to="/documents">
              <FileText className="h-5 w-5 mr-2" />
              Dokument hochladen
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link to="/chat">
              <MessageSquare className="h-5 w-5 mr-2" />
              Zum Chat
            </Link>
          </Button>
        </div>
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <FileText className="text-docuchat-primary h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Dokumente verstehen</h3>
            <p className="text-gray-600">
              Lade PDFs, Textdateien und mehr hoch. DocuChat verarbeitet und analysiert den Inhalt.
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Brain className="text-docuchat-accent h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">KI-Analyse</h3>
            <p className="text-gray-600">
              Fortschrittliche KI versteht den Kontext und die Bedeutung deiner Dokumente.
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="text-green-600 h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Natürliche Gespräche</h3>
            <p className="text-gray-600">
              Stelle Fragen in natürlicher Sprache und erhalte präzise Antworten mit Quellenangaben.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
