
-- Function to match document chunks based on embedding similarity
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  document_id_filter uuid,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM
    document_chunks dc
  WHERE
    dc.document_id = document_id_filter
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY
    dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Helper function to create the match function if it doesn't exist
CREATE OR REPLACE FUNCTION create_match_function()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the function already exists
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'match_document_chunks'
  ) THEN
    RETURN;
  END IF;

  -- Create the function if it doesn't exist
  EXECUTE '
    CREATE OR REPLACE FUNCTION match_document_chunks(
      query_embedding vector(1536),
      document_id_filter uuid,
      match_threshold float,
      match_count int
    )
    RETURNS TABLE (
      id uuid,
      document_id uuid,
      chunk_index int,
      content text,
      similarity float
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        dc.id,
        dc.document_id,
        dc.chunk_index,
        dc.content,
        1 - (dc.embedding <=> query_embedding) AS similarity
      FROM
        document_chunks dc
      WHERE
        dc.document_id = document_id_filter
        AND 1 - (dc.embedding <=> query_embedding) > match_threshold
      ORDER BY
        dc.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;
  ';
END;
$$;
