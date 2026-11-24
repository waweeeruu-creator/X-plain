import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { audienceSchema, MAX_SOURCE_CHARS } from "./dossier-schema";

const MAX_TOTAL_CHARS = 400_000;

// Optional lock: set ALLOWED_EMAIL on the server and only that account can use the
// workspace (and spend your Anthropic credits). Leave it unset to allow any signed-in user.
const ownerOnly = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const allowed = process.env["ALLOWED_EMAIL"]?.trim().toLowerCase();
    const email = String(context.claims.email ?? "").toLowerCase();
    if (allowed && email !== allowed) throw new Error("This workspace is private.");
    return next();
  });

function must<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error || result.data == null) {
    throw new Error(result.error?.message ?? "Not found.");
  }
  return result.data;
}

const idInput = z.object({ id: z.string().uuid() });

export const listProjects = createServerFn({ method: "GET" })
  .middleware([ownerOnly])
  .handler(async ({ context }) =>
    must(
      await context.supabase
        .from("xplain_projects")
        .select("id, name, summary, updated_at")
        .order("updated_at", { ascending: false }),
    ),
  );

export const createProject = createServerFn({ method: "POST" })
  .middleware([ownerOnly])
  .inputValidator(
    z.object({
      name: z.string().trim().min(1).max(120),
      summary: z.string().max(5000).default(""),
    }),
  )
  .handler(async ({ data, context }) =>
    must(
      await context.supabase
        .from("xplain_projects")
        .insert({ owner_id: context.userId, name: data.name, summary: data.summary })
        .select("id")
        .single(),
    ),
  );

export const updateProject = createServerFn({ method: "POST" })
  .middleware([ownerOnly])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(1).max(120),
      summary: z.string().max(5000),
    }),
  )
  .handler(async ({ data, context }) => {
    must(
      await context.supabase
        .from("xplain_projects")
        .update({ name: data.name, summary: data.summary, updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .select("id")
        .single(),
    );
    return { ok: true };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([ownerOnly])
  .inputValidator(idInput)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("xplain_projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProject = createServerFn({ method: "GET" })
  .middleware([ownerOnly])
  .inputValidator(idInput)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [project, sources, dossiers] = await Promise.all([
      supabase.from("xplain_projects").select("id, name, summary").eq("id", data.id).single(),
      supabase
        .from("xplain_sources")
        .select("id, title, source_type, byte_size, created_at")
        .eq("project_id", data.id)
        .order("created_at"),
      supabase
        .from("xplain_dossiers")
        .select("*")
        .eq("project_id", data.id)
        .order("version_number", { ascending: false }),
    ]);
    return { project: must(project), sources: must(sources), dossiers: must(dossiers) };
  });

export const addSource = createServerFn({ method: "POST" })
  .middleware([ownerOnly])
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      title: z.string().trim().min(1).max(200),
      sourceType: z.string().trim().min(1).max(20),
      content: z.string().min(1).max(MAX_SOURCE_CHARS),
    }),
  )
  .handler(async ({ data, context }) =>
    must(
      await context.supabase
        .from("xplain_sources")
        .insert({
          owner_id: context.userId,
          project_id: data.projectId,
          title: data.title,
          source_type: data.sourceType,
          content_text: data.content,
          byte_size: data.content.length,
        })
        .select("id")
        .single(),
    ),
  );

export const deleteSource = createServerFn({ method: "POST" })
  .middleware([ownerOnly])
  .inputValidator(idInput)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("xplain_sources").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const generateDossier = createServerFn({ method: "POST" })
  .middleware([ownerOnly])
  .inputValidator(z.object({ projectId: z.string().uuid(), audience: audienceSchema }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const project = must(
      await supabase
        .from("xplain_projects")
        .select("name, summary")
        .eq("id", data.projectId)
        .single(),
    );
    const rows = must(
      await supabase
        .from("xplain_sources")
        .select("title, source_type, content_text")
        .eq("project_id", data.projectId)
        .order("created_at"),
    );
    if (rows.length === 0) throw new Error("Add at least one source first.");

    // Keep the prompt within a sane size: stop adding sources once the total cap is reached.
    let budget = MAX_TOTAL_CHARS;
    const sources = rows.flatMap((row) => {
      if (budget <= 0) return [];
      const content_text = row.content_text.slice(0, budget);
      budget -= content_text.length;
      return [{ ...row, content_text }];
    });

    const { generateDossierFromSources } = await import("./ai/dossier.server");
    const result = await generateDossierFromSources(getRequest(), project, data.audience, sources);
    if (!result.ok) throw new Error(result.message);

    const latest = must(
      await supabase
        .from("xplain_dossiers")
        .select("version_number")
        .eq("project_id", data.projectId)
        .order("version_number", { ascending: false })
        .limit(1),
    );

    const saved = must(
      await supabase
        .from("xplain_dossiers")
        .insert({
          owner_id: userId,
          project_id: data.projectId,
          version_number: (latest[0]?.version_number ?? 0) + 1,
          audience: data.audience,
          ...result.content,
        })
        .select("id")
        .single(),
    );
    return saved;
  });
