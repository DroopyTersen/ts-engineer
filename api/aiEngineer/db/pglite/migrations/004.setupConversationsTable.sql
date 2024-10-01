create table if not exists conversations (
  id text primary key default gen_random_uuid()::text,
  title text,
  messages jsonb,
  project_id text not null references code_projects (id) on delete cascade,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create an index on project_id for faster queries
create index if not exists idx_conversations_project_id on conversations (project_id);

-- Create an index on updated_at for faster sorting
create index if not exists idx_conversations_updated_at on conversations (updated_at);