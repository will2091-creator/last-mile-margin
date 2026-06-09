-- ============================================================================
-- DOCUMENTS "FILING CABINET" BACKING — applied live 2026-06-09.
-- Powers the business-wide Documents tab (DocumentsDashboard -> DocumentVaultTable
-- -> documentRepository). Files go to the `documents` Storage bucket; metadata
-- rows go to public.documents. Everything is owner-scoped by RLS.
--
-- Idempotent — safe to re-run. (The storage bucket + 4 storage.objects policies
-- already existed in this project; this script ensures the table side.)
-- ============================================================================

-- Columns the uploader writes (no-op if already present).
alter table public.documents
  add column if not exists owner text,
  add column if not exists notes text,
  add column if not exists file_path text,
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists file_size bigint,
  add column if not exists uploaded_at timestamptz default now();

-- Table-level privilege (required IN ADDITION to RLS).
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.documents to authenticated;

-- Owner-scoped RLS. Without an INSERT policy, uploads are denied even with grants.
alter table public.documents enable row level security;
drop policy if exists "documents_select_own" on public.documents;
drop policy if exists "documents_insert_own" on public.documents;
drop policy if exists "documents_update_own" on public.documents;
drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_select_own" on public.documents for select to authenticated using (auth.uid() = owner_id);
create policy "documents_insert_own" on public.documents for insert to authenticated with check (auth.uid() = owner_id);
create policy "documents_update_own" on public.documents for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "documents_delete_own" on public.documents for delete to authenticated using (auth.uid() = owner_id);

-- Storage bucket (private) + per-user folder policies. Files are stored at
-- `{auth.uid()}/...`, so the folder check restricts access to the owner.
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
  on conflict (id) do nothing;

drop policy if exists "documents_objects_insert_own" on storage.objects;
drop policy if exists "documents_objects_select_own" on storage.objects;
drop policy if exists "documents_objects_delete_own" on storage.objects;
create policy "documents_objects_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "documents_objects_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "documents_objects_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

notify pgrst, 'reload schema';
