create table if not exists code_projects (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  absolute_path text not null,
  summary text not null,
  exclusions text default '',
  test_code_command text default 'bun run build'
);

create table if not exists code_tasks (
  id text primary key default gen_random_uuid()::text,
  project_id text not null references code_projects (id) on delete cascade,
  title text,
  input text not null,
  specifications text,
  selected_files jsonb,
  plan text,
  file_changes jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists files ( 
  id text primary key default gen_random_uuid()::text,
  filepath text not null,
  project_id text not null references code_projects (id) on delete cascade,
  summary text,
  documentation text,
  content text not null,
  updated_at timestamp with time zone default now() not null,
  extension text not null,
  num_chars int not null,
  filename text not null
);