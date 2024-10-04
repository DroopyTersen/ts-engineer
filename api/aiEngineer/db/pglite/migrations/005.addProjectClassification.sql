DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'code_projects' AND column_name = 'classification') THEN
        ALTER TABLE code_projects
        ADD COLUMN classification TEXT CHECK (classification IN ('work', 'private', 'public')) DEFAULT 'private';
    END IF;
END $$;