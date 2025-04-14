
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6'
import { load } from "https://esm.sh/cheerio@1.0.0-rc.12"
import { encode } from "https://esm.sh/gpt-tokenizer@2.1.2"

interface ProcessRequest {
  documentId: string;
}

// Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OpenAI embedding endpoint
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

// Function to extract and process text from PDFs or text files
async function extractTextFromDocument(filePath: string, fileType: string): Promise<string> {
  try {
    // Get the file from storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('documents')
      .download(filePath);
    
    if (fileError) throw fileError;

    // Process based on file type
    if (fileType === 'application/pdf') {
      // For PDF files, we'd use a PDF parser here
      // This is a simplified approach - in a real app, use a proper PDF parser
      const text = await parseTextFromFile(fileData);
      return text;
    } else if (fileType === 'text/plain') {
      // For text files, just read the text
      const text = await fileData.text();
      return text;
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}

// Parse text from a file (simplified for this example)
async function parseTextFromFile(file: Blob): Promise<string> {
  try {
    // For simplicity, just read the text from the file
    // In a real app, you would use a proper PDF parser
    const text = await file.text();
    // For PDFs, we would extract text from the PDF here
    return text;
  } catch (error) {
    console.error('Error parsing file:', error);
    throw error;
  }
}

// Function to split text into chunks
function splitTextIntoChunks(text: string, maxChunkLength: number = 1500): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    // Check if adding this sentence would make the chunk too long
    if ((currentChunk + sentence).length <= maxChunkLength) {
      currentChunk += sentence + ' ';
    } else {
      // If the current chunk is not empty, add it to the chunks array
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
      }
      
      // Start a new chunk with the current sentence
      currentChunk = sentence + ' ';
    }
  }
  
  // Add the last chunk if not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

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

// Main function to process a document
async function processDocument(documentId: string) {
  try {
    // Get document metadata from the database
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (documentError) throw documentError;
    
    // Extract text from the document
    const text = await extractTextFromDocument(document.file_path, document.file_type);
    
    // Update document with extracted text
    const { error: updateError } = await supabase
      .from('documents')
      .update({ content_text: text })
      .eq('id', documentId);
    
    if (updateError) throw updateError;
    
    // Split text into chunks
    const chunks = splitTextIntoChunks(text);
    
    // Process each chunk and create embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Create embedding for the chunk
      const embedding = await createEmbedding(chunk);
      
      // Store chunk and embedding in the database
      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          chunk_index: i,
          content: chunk,
          embedding: embedding
        });
      
      if (chunkError) throw chunkError;
    }
    
    return { success: true, message: 'Document processed successfully' };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

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

    // Parse request
    const requestData: ProcessRequest = await req.json();
    
    if (!requestData.documentId) {
      return new Response(
        JSON.stringify({ error: 'documentId is required' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Process document
    const result = await processDocument(requestData.documentId);
    
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
