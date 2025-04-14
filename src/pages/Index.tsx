
import React from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        
        {/* How it works section */}
        <section className="py-16 bg-gray-50">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Wie DocuChat funktioniert</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="bg-docuchat-primary text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                <h3 className="text-xl font-semibold mb-2">Dokument hochladen</h3>
                <p className="text-gray-600">
                  Lade deine PDFs, Textdateien oder andere Dokumente hoch.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-docuchat-primary text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                <h3 className="text-xl font-semibold mb-2">KI verarbeitet Inhalte</h3>
                <p className="text-gray-600">
                  Unsere KI analysiert und versteht den Inhalt deiner Dokumente.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-docuchat-primary text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                <h3 className="text-xl font-semibold mb-2">Stelle Fragen</h3>
                <p className="text-gray-600">
                  Stelle Fragen in natürlicher Sprache und erhalte präzise Antworten mit Quellenangaben.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA section */}
        <section className="py-16 bg-docuchat-primary text-white">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-4">Bereit, deine Dokumente zu befragen?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Lade dein erstes Dokument hoch und erlebe, wie DocuChat dir hilft, Informationen schneller zu finden.
            </p>
            <button className="bg-white text-docuchat-primary font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Jetzt starten
            </button>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-800 text-white py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-blue-400 mr-2" />
                <span className="text-xl font-bold">DocuChat</span>
              </div>
              <p className="text-gray-400 mt-2">Dein KI-gestützter Dokumenten-Assistent</p>
            </div>
            
            <div className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} DocuChat. Alle Rechte vorbehalten.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
