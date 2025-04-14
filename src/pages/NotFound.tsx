
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <FileQuestion className="h-24 w-24 text-docuchat-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">
            Diese Seite konnte nicht gefunden werden. Der angeforderte Inhalt existiert nicht oder wurde verschoben.
          </p>
          <Button asChild size="lg">
            <a href="/">Zurück zur Startseite</a>
          </Button>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white py-6">
        <div className="container text-center text-gray-400">
          &copy; {new Date().getFullYear()} DocuChat. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
};

export default NotFound;
