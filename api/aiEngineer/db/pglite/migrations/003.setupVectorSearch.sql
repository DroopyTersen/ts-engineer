-- Enable the vector extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add column if it doesn't exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'files' and column_name = 'embedding') then
    alter table files add column embedding vector(1024);
  end if;
end $$;

-- Create index if it doesn't exist
create index if not exists files_embedding_idx on files using ivfflat (embedding vector_cosine_ops);


create or replace function search_files_with_embedding (
  p_embedding vector(1024),
  p_max_items int = 100,
  p_project_id text = null,
  p_filepath text = null,
  p_extension text = null
) returns table (
  id text,
  filepath text,
  project_id text,
  summary text,
  documentation text,
  content text,
  updated_at timestamp with time zone,
  extension text,
  num_chars int,
  filename text,
  similarity float8
) as $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT id, filepath, project_id, summary, documentation, content, updated_at, extension, num_chars, filename,
            1 - (embedding <=> %L) AS similarity
     FROM files
     WHERE embedding IS NOT NULL
     %s %s %s
     ORDER BY similarity DESC
     LIMIT %s',
    p_embedding,
    CASE WHEN p_project_id IS NOT NULL THEN format('AND project_id = %L', p_project_id) ELSE '' END,
    CASE WHEN p_filepath IS NOT NULL THEN format('AND filepath ILIKE %L', '' || p_filepath || '') ELSE '' END,
    CASE WHEN p_extension IS NOT NULL THEN format('AND extension = %L', p_extension) ELSE '' END,
    p_max_items
  );
END
$$ language plpgsql;