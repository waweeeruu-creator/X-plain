import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  audienceOptions,
  dossierSections,
  MAX_SOURCE_CHARS,
  type Audience,
} from "@/lib/dossier-schema";
import {
  addSource,
  createProject,
  deleteProject,
  deleteSource,
  generateDossier,
  getProject,
  listProjects,
  updateProject,
} from "@/lib/xplain.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "X-plain: project explainer" },
      {
        name: "description",
        content: "Turn project notes, documents and chats into clear explanations.",
      },
    ],
  }),
  component: Index,
});

type ProjectData = Awaited<ReturnType<typeof getProject>>;
type Dossier = ProjectData["dossiers"][number];

const errorText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

function Index() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
  }
  return session ? <Workspace email={session.user.email ?? ""} /> : <AuthForm />;
}

function AuthForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          });
    setBusy(false);
    if (error) setMessage(error.message);
    else if (mode === "up" && !data.session) {
      setMessage("Check your email to confirm your account, then sign in.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">X-plain</h1>
          <p className="text-sm text-muted-foreground">
            Your projects, explained clearly. Private workspace.
          </p>
        </div>
        <Input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          required
          minLength={8}
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "in" ? "Sign in" : "Create account"}
        </Button>
        <button
          type="button"
          className="text-sm text-muted-foreground underline"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? "No account yet? Create one" : "Have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}

function Workspace({ email }: { email: string }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => listProjects() });

  async function addProject(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      const created = await createProject({ data: { name, summary: "" } });
      setName("");
      await qc.invalidateQueries({ queryKey: ["projects"] });
      setSelected(created.id);
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight">X-plain</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="hidden sm:inline">{email}</span>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="space-y-3">
          <form onSubmit={addProject} className="flex gap-2">
            <Input
              placeholder="New project"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {projects.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {projects.error && (
            <p className="text-sm text-destructive">{errorText(projects.error)}</p>
          )}
          <ul className="space-y-1">
            {projects.data?.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelected(p.id)}
                  className={`w-full truncate rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                    selected === p.id ? "bg-accent font-medium" : ""
                  }`}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
          {projects.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">Create your first project to begin.</p>
          )}
        </aside>

        <main>
          {selected ? (
            <ProjectView key={selected} id={selected} onDeleted={() => setSelected(null)} />
          ) : (
            <p className="text-sm text-muted-foreground">Pick or create a project.</p>
          )}
        </main>
      </div>
    </div>
  );
}

function ProjectView({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const query = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject({ data: { id } }),
  });
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (query.error || !query.data) {
    return <p className="text-sm text-destructive">{errorText(query.error)}</p>;
  }
  return <ProjectBody data={query.data} onDeleted={onDeleted} />;
}

function ProjectBody({ data, onDeleted }: { data: ProjectData; onDeleted: () => void }) {
  const qc = useQueryClient();
  const { project, sources, dossiers } = data;
  const id = project.id;

  const [name, setName] = useState(project.name);
  const [summary, setSummary] = useState(project.summary);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [audience, setAudience] = useState<Audience>("general");
  const [versionId, setVersionId] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const dossier = dossiers.find((d) => d.id === versionId) ?? dossiers[0];

  async function run(label: string, task: () => Promise<unknown>) {
    setBusy(label);
    setError("");
    try {
      await task();
    } catch (err) {
      setError(errorText(err));
    } finally {
      await qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      setBusy("");
    }
  }

  const saveDetails = () => run("Saving…", () => updateProject({ data: { id, name, summary } }));

  const removeProject = () => {
    if (!confirm(`Delete "${project.name}" and everything in it?`)) return;
    run("Deleting…", async () => {
      await deleteProject({ data: { id } });
      onDeleted();
    });
  };

  const uploadFiles = (files: File[]) =>
    run("Reading files…", async () => {
      const { extractSourceText } = await import("@/lib/document-extract");
      for (const file of files) {
        const text = (await extractSourceText(file)).trim();
        if (!text)
          throw new Error(`No readable text in ${file.name} (scanned PDFs need OCR first).`);
        await addSource({
          data: {
            projectId: id,
            title: file.name,
            sourceType: file.name.split(".").pop()?.toLowerCase() || "file",
            content: text.slice(0, MAX_SOURCE_CHARS),
          },
        });
      }
    });

  const addPasted = (e: FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim()) return;
    run("Adding…", async () => {
      await addSource({
        data: {
          projectId: id,
          title: pasteTitle.trim() || "Pasted note",
          sourceType: "note",
          content: pasteText.slice(0, MAX_SOURCE_CHARS),
        },
      });
      setPasteTitle("");
      setPasteText("");
    });
  };

  const generate = () =>
    run("Writing the explanation… this can take up to a minute.", async () => {
      const saved = await generateDossier({ data: { projectId: id, audience } });
      setVersionId(saved.id);
    });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-lg font-medium"
        />
        <Textarea
          rows={3}
          placeholder="Project notes: a few lines on what this is (used as context)"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={saveDetails}
            disabled={!!busy || (name === project.name && summary === project.summary)}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={removeProject} disabled={!!busy}>
            Delete project
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Sources
        </h2>
        <ul className="space-y-1">
          {sources.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="truncate">
                {s.title} <span className="text-muted-foreground">· {s.source_type}</span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={!!busy}
                onClick={() => run("Removing…", () => deleteSource({ data: { id: s.id } }))}
              >
                Remove
              </Button>
            </li>
          ))}
          {sources.length === 0 && (
            <li className="text-sm text-muted-foreground">
              No sources yet. Upload files or paste text.
            </li>
          )}
        </ul>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,.csv,.json,.log"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) uploadFiles(files);
          }}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={!!busy}
          onClick={() => fileRef.current?.click()}
        >
          Upload files (PDF, DOCX, TXT, MD, CSV)
        </Button>
        <form onSubmit={addPasted} className="space-y-2">
          <Input
            placeholder="Title for pasted text (optional)"
            value={pasteTitle}
            onChange={(e) => setPasteTitle(e.target.value)}
          />
          <Textarea
            rows={4}
            placeholder="Paste notes, a chat, a proposal…"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={!!busy || !pasteText.trim()}
          >
            Add pasted text
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Explain it
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as Audience)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {audienceOptions.map((a) => (
              <option key={a.value} value={a.value}>
                For: {a.label}
              </option>
            ))}
          </select>
          <Button onClick={generate} disabled={!!busy || sources.length === 0}>
            Generate explanation
          </Button>
        </div>
        {busy && <p className="text-sm text-muted-foreground">{busy}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </section>

      {dossier && (
        <DossierView
          projectName={project.name}
          dossiers={dossiers}
          dossier={dossier}
          onPick={setVersionId}
        />
      )}
    </div>
  );
}

function DossierView({
  projectName,
  dossiers,
  dossier,
  onPick,
}: {
  projectName: string;
  dossiers: Dossier[];
  dossier: Dossier;
  onPick: (id: string) => void;
}) {
  const audienceLabel =
    audienceOptions.find((a) => a.value === dossier.audience)?.label ?? dossier.audience;

  const markdown = () =>
    [
      `# ${projectName}`,
      `_${audienceLabel} version, v${dossier.version_number}_`,
      ...dossierSections.map((s) => `## ${s.label}\n\n${dossier[s.key] || "Not specified."}`),
    ].join("\n\n");

  function download() {
    const url = URL.createObjectURL(new Blob([markdown()], { type: "text/markdown" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectName.replace(/[^\w-]+/g, "-")}-v${dossier.version_number}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          value={dossier.id}
          onChange={(e) => onPick(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {dossiers.map((d) => (
            <option key={d.id} value={d.id}>
              v{d.version_number} ·{" "}
              {audienceOptions.find((a) => a.value === d.audience)?.label ?? d.audience} ·{" "}
              {new Date(d.created_at).toLocaleDateString()}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigator.clipboard.writeText(markdown())}
          >
            Copy
          </Button>
          <Button size="sm" variant="outline" onClick={download}>
            Download .md
          </Button>
        </div>
      </div>
      {dossierSections.map((s) => (
        <article key={s.key} className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">{s.label}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
            {dossier[s.key] || "Not specified."}
          </p>
        </article>
      ))}
    </section>
  );
}
