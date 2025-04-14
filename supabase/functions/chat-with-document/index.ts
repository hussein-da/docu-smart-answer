
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequestBody {
  question: string;
  documentId: string;
}

interface DocumentChunk {
  content: string;
  document_id: string;
  embedding: number[];
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
    const { question, documentId } = await req.json() as ChatRequestBody;

    // Dokument-Info abrufen
    const { data: documentData, error: docError } = await supabase
      .from('documents')
      .select('title, content_text')
      .eq('id', documentId)
      .single();

    if (docError || !documentData) {
      throw new Error(`Dokument nicht gefunden: ${docError?.message || 'Unbekannter Fehler'}`);
    }

    // Embeddings für die Frage mit OpenAI generieren
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: question
      }),
    });

    const embeddingData = await embeddingResponse.json();
    const questionEmbedding = embeddingData.data[0].embedding;

    // Relevante Chunks aus dem Dokument basierend auf Embedding-Ähnlichkeit abrufen
    // Hier vereinfachen wir und verwenden direkt den Dokumenteninhalt
    // In einer vollständigen Implementierung würden wir Vector-Suche mit pgvector für die relevantesten Chunks verwenden

    // Prompt für OpenAI zusammenstellen
    const prompt = `
    Du bist ein hilfreicher Assistent für die Dokumentenanalyse. 
    Beantworte die folgende Frage basierend auf dem bereitgestellten Dokumenteninhalt.
    
    Dokument: ${documentData.title}
    
    Dokumenteninhalt:
    ${documentData.content_text || "Kein Textinhalt verfügbar."}
    
    Frage: ${question}
    
    Bitte beantworte die Frage präzise und beziehe dich nur auf Informationen, die im Dokument enthalten sind.
    Wenn die Information nicht im Dokument zu finden ist, sage ehrlich, dass du es nicht weißt.
    `;

    // Chat completion mit OpenAI durchführen
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // oder ein anderes verfügbares Modell
        messages: [
          { role: 'system', content: 'Du bist ein präziser Dokumentenanalyst, der Fragen basierend auf dem Inhalt von Dokumenten beantwortet.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    const chatData = await chatResponse.json();
    const answer = chatData.choices[0].message.content;

    // Chat-Verlauf speichern
    const { error: chatHistoryError } = await supabase.from('chat_history').insert({
      user_id: req.headers.get('authorization')?.split(' ')[1] || null,
      question,
      answer,
      document_id: documentId
    });

    if (chatHistoryError) {
      console.error('Fehler beim Speichern des Chat-Verlaufs:', chatHistoryError);
    }

    // Antwort zurückgeben
    return new Response(
      JSON.stringify({
        answer,
        sources: [
          {
            documentTitle: documentData.title,
            text: documentData.content_text ? 
              documentData.content_text.substring(0, 200) + '...' : 
              'Kein Textinhalt verfügbar.'
          }
        ]
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in chat-with-document function:', error);
    
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
