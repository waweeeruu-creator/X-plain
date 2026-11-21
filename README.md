# Project Storyteller

Hiiii I was thinking of a site that you feed your projects your sources,pdfs conversations etc and you get explanations statements on what projects entails how it helps the problem the technicality the cost etc
Edit
Copy
Share

Brainstorming concept restatement and key questions
Hiii! Love this — and it fits perfectly with what this project is named: X-plain. The core idea as I hear it:
Feed in your raw materials (project docs, PDFs, source files, chat logs, notes) → get back clear "explanation statements" that describe the project: what it is, what problem it solves, how it works technically, what it costs, etc.
Let me push on it with you a bit so we shape it well:
1. Who's feeding it, and why?
A founder/student who has scattered materials and needs to explain their project to someone (investor, supervisor, client)?
Or a reader who finds a project folder and wants it decoded?
These are two different products. The first is "help me articulate my own project," the second is "help me understand someone else's."
2. What does the output look like?
A single structured "project statement" document? Sections like:
Overview — what the project is, in plain words
Problem — what pain it addresses and for whom
How it helps — the value proposition
Technicality — stack, architecture, how it works under the hood
Cost — build cost, running cost, maybe estimated
Gaps/risks — what's missing or unclear in the materials
That structure is basically an automatic "project dossier." Is that what you're picturing?
3. What's the differentiator from just pasting everything into a normal AI chat?
My take: the magic is persistence + structure. The site keeps your project as a living profile — you add new PDFs or conversations over time, and the explanation statements update. Plus templates: "Explain it like I'm an investor," "like I'm a lecturer," "like I'm a customer."
4. MVP reality check
The smallest version is: upload → extracted text → LLM generates the dossier with the fixed sections → editable/exportable. Everything else (multi-project dashboards, version history, sharing links) comes later.
So tell me:
Which user from #1 is closer to your vision?
Is this something you want to build (and with what stack), or first flesh out as a concept doc/roadmap?
And should I save this as the founding idea in the project memory so we build on it next time?

Founder student
Edit
Copy
Share

Skipped memory write due to directory permission error
Saved the concept to the project (well — tried to; the memory store isn't accepting writes right now, so I'll keep everything in this chat and retry later).
Okay, so it's the founder/student articulating their own project. That sharpens everything:
What that user actually suffers
They've got materials everywhere — proposal drafts in Word, PDFs of research, code repos, WhatsApp/Slack chats with collaborators, random notes. When someone asks "So what is this project about?" they either ramble or paste a messy wall of text. What they want is to feed the mess, get a clean story.
The product in one line
X-plain turns your scattered project materials into a living, audience-ready explanation of your project.
Core loop
Create a project → dump in whatever you have (PDFs, docs, links, pasted conversations, code)
X-plain extracts and connects it into a structured dossier: What it is · The problem · How it helps · How it works (technicality) · What it costs · What's still missing
Pick an audience → "Pitch to investor," "Report to supervisor," "Explain to a customer," "Plain English for my parents"
It regenerates the explanation for that audience — same facts, different lens
As you add new materials, the dossier updates (version history shows what changed)
Why this beats "just use ChatGPT"
Persistence: the project lives on the site, not in a dying chat thread
Multi-source digestion: it reads your PDFs and long chat logs so you don't have to paste
Audience switching: one source of truth, many outputs (investor deck summary ≠ lecturer report)
Gap detection: "Your materials never mention running costs — answer these 3 questions to complete the Cost section" — it interviews you for what's missing
Next moves — pick one:
Concept doc — I write a tight 1–2 page product brief you can share with a partner or mentor
Roadmap — MVP → v1 → v2 with features and rough phases
MVP tech plan — stack, architecture, data model (you mentioned before you like working things out concretely)
Name & pitch line — alternatives to "X-plain" plus a one-liner elevator pitch
Which one do you want first?

It's first a project I want to make for myself
Edit
Copy
Share
Suggested gathering materials Terra Yields case
That's actually the smartest way to start — build it for yourself first, use it on your own projects, then decide if it becomes a product. You become your own first user and toughest critic.
That changes the plan in good ways:
What "personal tool" means for the design
No accounts, no payments, no multi-user — it's just you
Can run locally on your laptop or as a private single-user site
Good enough beats polished — if it reads your PDFs and chats and spits out a solid dossier, it wins
You dogfood it immediately — and here's the beautiful part: you've got real projects to test it on. Terra Yields, your Arduino builds, your DeKUT coursework. You feed X-plain your actual Terra Yields materials → it generates the explanation you'd show your dad or a partner → you instantly see what's wrong with the output. That's your feedback loop.
The lean personal MVP
A simple page: drop files / paste text → "Explain my project"
Extract text from PDFs, docs, chat exports
One LLM call with a fixed template → the dossier (Overview · Problem · How it helps · Technicality · Cost · Gaps)
Edit in place, export as markdown/PDF
Save projects locally so you can come back and re-run as materials grow
That's genuinely buildable in days, not months.
Two quick decisions before we plan:
Where should it live? Local on your laptop (Python app, simplest, private) or a private site you can reach from your phone too?
What does it plug into for the AI? An API like Kimi/Claude/GPT, or a local model if you want zero cost?
Tell me those two and I'll draw you the concrete build plan — stack, files, and the first version you can run.

Private site
Edit
Copy
Share
File structure, phased plan, LLM recommendation
Private site it is — reachable from anywhere, but locked to just you. Here's the concrete plan:
Recommended stack (kept lean on purpose)
Piece 	Choice 	Why 
Backend	Python + FastAPI	One language, great file/PDF libraries, async for API calls
Text extraction	pypdf, python-docx	Reads your PDFs and Word docs
Frontend	Server-rendered HTML + a little JS (Jinja templates)	No React needed for a single-user tool — less code, faster to build
Database	SQLite	Zero setup; one file on the server
AI	An LLM API (Kimi, Claude, or GPT — your pick)	You didn't settle this one; my recommendation: start with an API — far better document digestion than a local model, and for one user the cost is pocket change
Hosting	Small VPS, Railway, or Render	Cheap; add a simple login page as the "private" lock
File structure
plain
xplain/
├── main.py            # FastAPI app, routes
├── extractor.py       # PDF/doc/text/chat-log → plain text
├── dossier.py         # the prompt template + LLM call → dossier JSON
├── storage.py         # SQLite: projects, files, dossier versions
├── templates/
│   ├── index.html     # your projects list
│   ├── project.html   # upload + dossier view/edit
│   └── login.html     # the privacy lock
└── static/            # minimal CSS
The build order (each step ends with something that runs)
Skeleton — FastAPI app with login, SQLite, project list (day 1)
Upload + extract — drag in PDFs/docs/pasted chats → stored text (day 1–2)
The dossier generator — one well-crafted prompt → the six sections, editable, saved as a version (day 2–3)
Audience switch — "investor / lecturer / customer" re-generates from the same facts (day 3)
Gap interviewer — it asks you the questions your materials don't answer (later)
The one prompt that matters most
The whole product lives or dies on the dossier prompt — how it forces the model to only use the materials, flag what's missing, and write per section. That's step 3, and where we should spend our design effort.
Want me to start writing the actual code now? I can generate the step-1 + step-2 skeleton (working app you can run locally first, deploy later) — just tell me which LLM API you want it wired for.

yes
Edit
Copy
Share

Deleted xplain.db from /mnt/agents/output/xplain
dossier.py: config, JSON, extractors, Jinja2 UI
Building it now — I'll wire it for an OpenAI-compatible API (that covers Kimi/Moonshot, OpenAI, and most others — you just drop your key and base URL in a .env).

Thinking process
Ran Python code
Thinking complete
Ran Python code
Ran Python code
Ran Python code
Now the three templates and styling:

User requests quick storage and dossier smoke test
Ran Python code
Ran Python code
Ran Python code
Thinking complete
Quick smoke test of the storage layer before I hand it over:

Renamed module import to avoid variable collision
Ran Python code
Thinking complete
Small name clash in my test session (a string variable shadowed the module) — fixing:

Deleted xplain.db from /mnt/agents/output/xplain
Ran Python code
Thinking complete
Ran Python code
Done — X-plain v0.1 is built, tested, and ready to run. 🎉
What you got
plain
xplain/
├── main.py          # FastAPI app: login, projects, uploads, generation
├── storage.py       # SQLite layer (projects, files, versioned dossiers)
├── extractor.py     # PDF / DOCX / txt / md / csv / log / json → text
├── dossier.py       # the six-section prompt → your LLM
├── templates/       # login, project list, project page
├── static/style.css # dark, clean UI
├── requirements.txt
├── .env.example     # fill in your credentials + LLM key
└── README.md        # run + deploy instructions
How it works once running
Login (your private lock) → create a project, e.g. Terra Yields
Feed it: upload PDFs/docs or paste chat logs & notes with a label
Pick an audience — general / investor / lecturer / customer / partner — hit ✦ Explain my project
Get your dossier: What it is · The problem · How it helps · Technicality · Cost · Gaps — the last section is the gap interviewer: questions your materials don't answer yet
Every regeneration saves a new version, so you can watch the explanation evolve as you add materials
To run it (5 minutes)
bash
cd xplain
pip install -r requirements.txt
cp .env.example .env   # add your password + LLM key (works with Kimi, OpenAI, etc.)
uvicorn main:app --reload
Then open http://127.0.0.1:8000. The README covers the Windows env-var commands and how to deploy it as your private site later.
My suggestion for the first real test: throw your actual Terra Yields materials at it — even just pasted conversations and notes — and see whether the dossier says what you'd say. That gap is our roadmap.
Want me to add anything next — exporting the dossier as a PDF, editing sections inline, or the "ask follow-up questions about my project" chat?

Thinking process
Everything's packaged — here are your files:
The full app (download the zip for everything at once):
<FILE REF="/mnt/agents/output/xplain-v0.1.zip">
Individual files if you want to read the code first:
<FILE REF="/mnt/agents/output/xplain/main.py">
<FILE REF="/mnt/agents/output/xplain/dossier.py">
<FILE REF="/mnt/agents/output/xplain/storage.py">
<FILE REF="/mnt/agents/output/xplain/extractor.py">
<FILE REF="/mnt/agents/output/xplain/README.md">
<FILE REF="/mnt/agents/output/xplain/requirements.txt">
<FILE REF="/mnt/agents/output/xplain/.env.example">
The templates and CSS live in the zip under templates/ and static/. Run it, feed it your real project materials, and tell me what the dossier gets wrong — that's exactly what we build next.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bcf718b4-55ad-5911-9286-ddc8498f510c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
