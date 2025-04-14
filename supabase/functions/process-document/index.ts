
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

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to extract and process text from PDFs or text files
async function extractTextFromDocument(filePath: string, fileType: string): Promise<string> {
  try {
    console.log(`Extracting text from ${filePath} (${fileType})`);
    
    // Get the file from storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('documents')
      .download(filePath);
    
    if (fileError) {
      console.error('Error downloading file:', fileError);
      throw fileError;
    }
    
    console.log(`File downloaded successfully, size: ${fileData.size} bytes`);

    // Process based on file type
    if (fileType === 'application/pdf') {
      // For PDF files, we'd use a PDF parser here
      // This is a simplified approach - in a real app, use a proper PDF parser
      const text = await parseTextFromFile(fileData);
      return text;
    } else if (fileType === 'text/plain') {
      // For text files, just read the text
      const text = await fileData.text();
      console.log(`Extracted text (first 100 chars): ${text.substring(0, 100)}...`);
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
    console.log(`Parsed text from file (first 100 chars): ${text.substring(0, 100)}...`);
    return text;
  } catch (error) {
    console.error('Error parsing file:', error);
    throw error;
  }
}

// Improved function to split text into more meaningful chunks
function splitTextIntoChunks(text: string, maxChunkLength: number = 1000): string[] {
  console.log(`Splitting text of length ${text.length} into chunks of max length ${maxChunkLength}`);
  
  // Handle empty or very short text
  if (!text || text.length < maxChunkLength / 2) {
    return [text];
  }
  
  const chunks: string[] = [];
  
  // Split by paragraphs first (better semantic separation)
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') continue;
    
    // If paragraph is itself too long, split it into sentences
    if (paragraph.length > maxChunkLength) {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      
      for (const sentence of sentences) {
        if (sentence.trim() === '') continue;
        
        // If adding this sentence would make the chunk too long, start a new chunk
        if ((currentChunk + sentence).length > maxChunkLength) {
          if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
          }
          // If the sentence itself is too long, split it
          if (sentence.length > maxChunkLength) {
            const words = sentence.split(/\s+/);
            let wordChunk = '';
            
            for (const word of words) {
              if ((wordChunk + ' ' + word).length > maxChunkLength) {
                if (wordChunk.length > 0) {
                  chunks.push(wordChunk.trim());
                }
                wordChunk = word;
              } else {
                wordChunk += ' ' + word;
              }
            }
            
            if (wordChunk.length > 0) {
              currentChunk = wordChunk.trim();
            } else {
              currentChunk = '';
            }
          } else {
            currentChunk = sentence;
          }
        } else {
          currentChunk += ' ' + sentence;
        }
      }
    } else {
      // If adding this paragraph would make the chunk too long, start a new chunk
      if ((currentChunk + '\n\n' + paragraph).length > maxChunkLength) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = paragraph;
      } else {
        if (currentChunk.length > 0) {
          currentChunk += '\n\n';
        }
        currentChunk += paragraph;
      }
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  console.log(`Created ${chunks.length} chunks`);
  chunks.forEach((chunk, i) => {
    console.log(`Chunk ${i} length: ${chunk.length}, first 50 chars: ${chunk.substring(0, 50)}...`);
  });
  
  return chunks;
}

// Function to create embeddings using OpenAI's API
async function createEmbedding(text: string): Promise<number[]> {
  try {
    console.log(`Creating embedding for text of length ${text.length}`);
    
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
      console.error('OpenAI API error response:', errorData);
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    console.log('Embedding created successfully');
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw error;
  }
}

// Main function to process a document
async function processDocument(documentId: string) {
  try {
    console.log(`Processing document with ID: ${documentId}`);
    
    // Get document metadata from the database
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (documentError) {
      console.error('Error fetching document:', documentError);
      throw documentError;
    }
    
    console.log(`Found document: ${document.title}, file type: ${document.file_type}`);
    
    // Extract text from the document
    const text = await extractTextFromDocument(document.file_path, document.file_type);
    
    if (!text || text.trim() === '') {
      console.error('Extracted text is empty');
      throw new Error('Failed to extract text from document');
    }
    
    // Update document with extracted text
    const { error: updateError } = await supabase
      .from('documents')
      .update({ content_text: text })
      .eq('id', documentId);
    
    if (updateError) {
      console.error('Error updating document with text:', updateError);
      throw updateError;
    }
    
    console.log('Document updated with extracted text');
    
    // Clear existing chunks first to avoid duplicates
    const { error: deleteChunksError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);
    
    if (deleteChunksError) {
      console.error('Error deleting existing chunks:', deleteChunksError);
      throw deleteChunksError;
    }
    
    console.log('Existing chunks deleted');
    
    // Split text into chunks
    const chunks = splitTextIntoChunks(text);
    
    console.log(`Processing ${chunks.length} chunks for embeddings`);
    
    // Process each chunk and create embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Skip empty chunks
      if (!chunk || chunk.trim() === '') {
        console.log(`Skipping empty chunk at index ${i}`);
        continue;
      }
      
      console.log(`Processing chunk ${i+1}/${chunks.length}, length: ${chunk.length}`);
      
      try {
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
        
        if (chunkError) {
          console.error(`Error storing chunk ${i}:`, chunkError);
          throw chunkError;
        }
        
        console.log(`Chunk ${i+1}/${chunks.length} processed and stored successfully`);
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error);
        // Continue with other chunks even if one fails
      }
    }
    
    return { success: true, message: 'Document processed successfully', chunkCount: chunks.length };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

// Main Deno server
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request
    const requestData: ProcessRequest = await req.json();
    
    if (!requestData.documentId) {
      return new Response(
        JSON.stringify({ error: 'documentId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Document processing request received for ID: ${requestData.documentId}`);
    
    // Process document
    const result = await processDocument(requestData.documentId);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-document function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
