-- ============================================================
-- Galileo Orientador – Vector Search Setup
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Habilitar pgvector (solo necesario una vez por proyecto)
create extension if not exists vector with schema extensions;

-- 2. Tabla de embeddings de carreras
create table if not exists public.career_embeddings (
  id          bigserial primary key,
  career_name text      not null,
  category    text      not null,
  chunk_type  text      not null,
  chunk_content text    not null,
  embedding   vector(1536),
  created_at  timestamptz default now()
);

-- Índice para búsqueda vectorial eficiente (cosine distance)
create index if not exists career_embeddings_embedding_idx
  on public.career_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 10);

-- 3. Row Level Security
alter table public.career_embeddings enable row level security;

-- Lectura pública (el frontend anon puede leer)
create policy "Public read career_embeddings"
  on public.career_embeddings
  for select
  using (true);

-- Escritura solo para service_role (edge functions usan service role)
create policy "Service write career_embeddings"
  on public.career_embeddings
  for all
  to service_role
  using (true)
  with check (true);

-- 4. Función RPC de búsqueda semántica por similitud coseno
create or replace function public.match_career_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count     int   default 12
)
returns table (
  id            bigint,
  career_name   text,
  category      text,
  chunk_type    text,
  chunk_content text,
  similarity    float
)
language sql stable
as $$
  select
    id,
    career_name,
    category,
    chunk_type,
    chunk_content,
    1 - (embedding <=> query_embedding) as similarity
  from public.career_embeddings
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
