
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessDocumentRequest {
  documentId: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      throw new Error('OPENAI_API_KEY ist nicht konfiguriert');
    }

    // Supabase Client initialisieren
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Request-Body parsen
    const { documentId } = await req.json() as ProcessDocumentRequest;

    // Dokument-Info abrufen
    const { data: documentData, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !documentData) {
      throw new Error(`Dokument nicht gefunden: ${docError?.message || 'Unbekannter Fehler'}`);
    }

    // Dokumenteninhalt aus dem Storage holen
    const { data: fileData, error: fileError } = await supabase.storage
      .from('documents')
      .download(`${documentData.user_id}/${documentData.file_path}`);

    if (fileError || !fileData) {
      throw new Error(`Fehler beim Abrufen der Datei: ${fileError?.message || 'Unbekannter Fehler'}`);
    }

    // Text-Extraktion basierend auf dem Dateityp
    let text = '';
    
    if (documentData.file_type === 'text/plain') {
      // Für Textdateien
      text = await fileData.text();
    } else if (documentData.file_type === 'application/pdf') {
      // Für PDF-Dateien würden wir hier eine PDF-Extraction-Bibliothek verwenden
      // In dieser vereinfachten Version geben wir eine Nachricht zurück
      text = "PDF-Extraktion simuliert. In einer vollständigen Implementierung würde hier der extrahierte Text aus dem PDF stehen.";
    } else {
      text = "Nicht unterstütztes Dateiformat für Textextraktion.";
    }

    // Text in Chunks aufteilen (vereinfacht)
    // In einer vollständigen Implementierung würden wir den Text intelligent in semantische Chunks teilen
    const chunkSize = 1000;
    const chunks = [];
    
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }

    // Dokument mit extrahiertem Text aktualisieren
    const { error: updateError } = await supabase
      .from('documents')
      .update({ content_text: text })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Fehler beim Aktualisieren des Dokuments: ${updateError.message}`);
    }

    // Embeddings für jeden Chunk erstellen und speichern
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Embedding mit OpenAI erstellen
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: chunk
        }),
      });

      const embeddingData = await embeddingResponse.json();
      
      if (!embeddingData.data || !embeddingData.data[0]) {
        console.error('Fehler beim Erstellen des Embeddings:', embeddingData);
        continue;
      }
      
      const embedding = embeddingData.data[0].embedding;

      // Chunk mit Embedding in der Datenbank speichern
      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          chunk_index: i,
          content: chunk,
          embedding
        });

      if (chunkError) {
        console.error(`Fehler beim Speichern des Chunks ${i}:`, chunkError);
      }
    }

    // Erfolgreiche Antwort zurückgeben
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Dokument erfolgreich verarbeitet',
        chunks_processed: chunks.length
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in process-document function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
