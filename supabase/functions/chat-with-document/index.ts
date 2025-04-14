
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6'

// Request interface
interface ChatRequest {
  documentId: string;
  question: string;
  userId: string;
}

// Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OpenAI API
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

// Function to create embeddings using OpenAI's API
async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw error;
  }
}

// Function to get relevant chunks based on semantic similarity
async function getRelevantChunks(documentId: string, questionEmbedding: number[], limit: number = 5) {
  try {
    const { data: chunks, error } = await supabase.rpc(
      'match_document_chunks',
      {
        query_embedding: questionEmbedding,
        document_id_filter: documentId,
        match_threshold: 0.5,
        match_count: limit
      }
    );
    
    if (error) throw error;
    
    return chunks;
  } catch (error) {
    console.error('Error getting relevant chunks:', error);
    throw error;
  }
}

// Function to get document title
async function getDocumentTitle(documentId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('title')
      .eq('id', documentId)
      .single();
    
    if (error) throw error;
    
    return data.title;
  } catch (error) {
    console.error('Error getting document title:', error);
    throw error;
  }
}

// Function to generate an answer using OpenAI
async function generateAnswer(question: string, chunks: any[], documentTitle: string): Promise<string> {
  try {
    // Prepare context from chunks
    const context = chunks.map(chunk => chunk.content).join('\n\n');
    
    // Create messages for the chat completion
    const messages = [
      {
        role: "system",
        content: `Du bist ein hilfreicher Assistent für Dokumentenanalyse. 
        Beantworte die Frage basierend nur auf dem folgenden Kontext aus dem Dokument "${documentTitle}". 
        Wenn die Antwort nicht im Kontext enthalten ist, sage "Ich kann diese Frage basierend auf dem Dokument nicht beantworten." 
        Gib keine Informationen weiter, die nicht im Kontext enthalten sind. 
        Antworte auf Deutsch.`
      },
      {
        role: "user",
        content: `Kontext: ${context}\n\nFrage: ${question}`
      }
    ];
    
    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.3,
        max_tokens: 800
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating answer:', error);
    throw error;
  }
}

// Main chat function
async function chatWithDocument(documentId: string, question: string, userId: string) {
  try {
    // Generate embedding for the question
    const questionEmbedding = await createEmbedding(question);
    
    // Get the document title
    const documentTitle = await getDocumentTitle(documentId);
    
    // Get relevant chunks
    const relevantChunks = await getRelevantChunks(documentId, questionEmbedding);
    
    if (!relevantChunks || relevantChunks.length === 0) {
      return { answer: "Ich konnte keine relevanten Informationen im Dokument finden, um deine Frage zu beantworten." };
    }
    
    // Generate answer
    const answer = await generateAnswer(question, relevantChunks, documentTitle);
    
    // Store the chat history
    const { error: historyError } = await supabase
      .from('chat_history')
      .insert({
        user_id: userId,
        question: question,
        answer: answer,
        document_id: documentId
      });
    
    if (historyError) throw historyError;
    
    return { answer };
  } catch (error) {
    console.error('Error in chat with document:', error);
    throw error;
  }
}

// Create the RPC function for matching document chunks based on embedding
async function createMatchFunction() {
  try {
    const { error } = await supabase.rpc('create_match_function', {});
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error creating match function:', error);
    throw error;
  }
}

// Main Deno server
Deno.serve(async (req) => {
  try {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers });
    }

    // Create the match function if it doesn't exist
    await createMatchFunction();

    // Parse request
    const requestData: ChatRequest = await req.json();
    
    if (!requestData.documentId || !requestData.question || !requestData.userId) {
      return new Response(
        JSON.stringify({ error: 'documentId, question and userId are required' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Chat with document
    const result = await chatWithDocument(requestData.documentId, requestData.question, requestData.userId);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
