DO $$
BEGIN
  -- Create custom dictionary if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_ts_dict WHERE dictname = 'custom_dict') THEN
    CREATE TEXT SEARCH DICTIONARY custom_dict (
      TEMPLATE = pg_catalog.simple
    );
  END IF;

  -- Create custom configuration if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'custom_config') THEN
    CREATE TEXT SEARCH CONFIGURATION custom_config (
      COPY = pg_catalog.simple
    );
  END IF;
END
$$;

-- Alter text search configuration (safe to run multiple times)
ALTER TEXT SEARCH CONFIGURATION custom_config
ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, hword, hword_part, word
WITH custom_dict;

-- Add column if it doesn't exist
ALTER TABLE files ADD COLUMN IF NOT EXISTS tsv tsvector;

-- Create or replace function and trigger
CREATE OR REPLACE FUNCTION files_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.tsv := setweight(to_tsvector('custom_config', COALESCE(NEW.filename, '')), 'A') ||
              setweight(to_tsvector('custom_config', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsvectorupdate ON files;
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE ON files
FOR EACH ROW EXECUTE FUNCTION files_tsv_trigger();

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS files_tsv_idx ON files USING gin (tsv);

-- Create or replace functions
CREATE OR REPLACE FUNCTION rank_search_results(search_query text) RETURNS TABLE (
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
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, filepath, project_id, summary, documentation, content, updated_at, extension, num_chars, filename,
          ts_rank(tsv, to_tsquery('custom_config', search_query)) AS rank
  FROM files
  WHERE tsv @@ to_tsquery('custom_config', search_query)
  ORDER BY rank DESC;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rank_search_results_cd(search_query text) RETURNS TABLE (
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
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, filepath, project_id, summary, documentation, content, updated_at, extension, num_chars, filename,
          ts_rank_cd(tsv, to_tsquery('custom_config', search_query)) AS rank
  FROM files
  WHERE tsv @@ to_tsquery('custom_config', search_query)
  ORDER BY rank DESC;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_files(
  p_search_query text,
  p_max_items int = 100,
  p_project_id text = null,
  p_filepath text = null,
  p_extension text = null
) RETURNS TABLE (
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
  rank real
) AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT id, filepath, project_id, summary, documentation, content, updated_at, extension, num_chars, filename,
            ts_rank(tsv, to_tsquery(''custom_config'', %L)) AS rank
      FROM files
      WHERE tsv @@ to_tsquery(''custom_config'', %L)
      %s %s %s
      ORDER BY rank DESC
      LIMIT %s',
    p_search_query,
    p_search_query,
    CASE WHEN p_project_id IS NOT NULL THEN format('AND project_id = %L', p_project_id) ELSE '' END,
    CASE WHEN p_filepath IS NOT NULL THEN format('AND filepath ILIKE %L', '%' || p_filepath || '%') ELSE '' END,
    CASE WHEN p_extension IS NOT NULL THEN format('AND extension = %L', p_extension) ELSE '' END,
    p_max_items
  );
END
$$ LANGUAGE plpgsql;