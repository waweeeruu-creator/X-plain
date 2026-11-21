CREATE TABLE public.xplain_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.xplain_projects TO authenticated;
GRANT ALL ON public.xplain_projects TO service_role;
ALTER TABLE public.xplain_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their X-plain projects" ON public.xplain_projects
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE TABLE public.xplain_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.xplain_projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  content_text TEXT NOT NULL DEFAULT '',
  storage_path TEXT,
  mime_type TEXT,
  byte_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.xplain_sources TO authenticated;
GRANT ALL ON public.xplain_sources TO service_role;
ALTER TABLE public.xplain_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their X-plain sources" ON public.xplain_sources
  FOR ALL TO authenticated
  USING (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.xplain_projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.xplain_projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE TABLE public.xplain_dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.xplain_projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  audience TEXT NOT NULL DEFAULT 'general',
  overview TEXT NOT NULL DEFAULT '',
  problem TEXT NOT NULL DEFAULT '',
  how_it_helps TEXT NOT NULL DEFAULT '',
  technicality TEXT NOT NULL DEFAULT '',
  cost TEXT NOT NULL DEFAULT '',
  gaps TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, version_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.xplain_dossiers TO authenticated;
GRANT ALL ON public.xplain_dossiers TO service_role;
ALTER TABLE public.xplain_dossiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their X-plain dossiers" ON public.xplain_dossiers
  FOR ALL TO authenticated
  USING (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.xplain_projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.xplain_projects p
      WHERE p.id = project_id AND p.owner_id = auth.uid()
    )
  );

CREATE INDEX xplain_projects_owner_updated_idx ON public.xplain_projects (owner_id, updated_at DESC);
CREATE INDEX xplain_sources_project_created_idx ON public.xplain_sources (project_id, created_at);
CREATE INDEX xplain_dossiers_project_version_idx ON public.xplain_dossiers (project_id, version_number DESC);

CREATE POLICY "Owners read their X-plain files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'xplain-sources' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners upload their X-plain files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'xplain-sources' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners update their X-plain files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'xplain-sources' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'xplain-sources' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete their X-plain files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'xplain-sources' AND (storage.foldername(name))[1] = auth.uid()::text);