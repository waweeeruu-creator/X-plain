# X-plain personal project workspace

## What to build
- Replace the template home with a private X-plain workspace for creating projects and adding PDFs, documents, notes, and pasted conversations.
- Turn source materials into a six-part dossier: overview, problem, how it helps, technicality, cost, and open gaps. Let the owner choose an audience, edit the result, save versions, and export Markdown.
- Keep projects and uploaded materials private to the signed-in owner; use a sign-in-only experience rather than public account creation.
- Use Lovable Cloud for sign-in, durable project/source/dossier storage, and private file storage. Keep AI generation on the Lovable AI Gateway and on the server.

## Technical approach
- Keep the first screen at `/` and use the existing TanStack Start structure.
- Extract supported document text in the browser, persist source text and private file references, and call authenticated server functions for reads, writes, and AI generation.
- Use owner-scoped policies on every stored record and file. Do not create a profile table unless requested.
- Define the visual palette and typography in the global design tokens; make the workspace responsive and keyboard-accessible.
- Add a focused test for the six dossier sections and verify the app builds and the signed-in workflow where available.