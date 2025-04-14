
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { FileText } from 'lucide-react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Bei Registrierung
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        if (signUpError) throw signUpError;
        
        if (signUpData.user) {
          toast({
            title: "Konto erfolgreich erstellt!",
            description: "Du wurdest automatisch angemeldet.",
          });
          navigate('/documents');
        }
      } else {
        // Bei Login
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        toast({
          title: "Willkommen zurück!",
          description: "Du wurdest erfolgreich angemeldet.",
        });

        navigate('/documents');
      }
    } catch (error: any) {
      let errorMessage = error.message;
      
      // Benutzerfreundlichere Fehlermeldungen
      if (error.message.includes("Email already registered")) {
        errorMessage = "Diese E-Mail ist bereits registriert. Bitte melde dich an.";
      } else if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Falsche E-Mail oder Passwort.";
      }
      
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <FileText className="h-10 w-10 text-docuchat-primary" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isSignUp ? 'Erstelle einen Account' : 'Willkommen zurück'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isSignUp ? 'Registriere dich für DocuChat' : 'Melde dich bei deinem Account an'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <Input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-1">
                Das Passwort muss mindestens 6 Zeichen lang sein.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isSignUp ? 'Registriere...' : 'Melde an...'}
              </>
            ) : (
              isSignUp ? 'Registrieren' : 'Anmelden'
            )}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {isSignUp ? 'Bereits registriert? Anmelden' : 'Noch kein Account? Registrieren'}
          </button>
        </div>
      </div>
    </div>
  );
};
