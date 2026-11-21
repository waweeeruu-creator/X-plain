# X-plain

> Turn scattered project notes, documents, and chat logs into clear, audience-tailored project explanations.

X-plain is a private personal workspace designed to ingest raw project materials—research PDFs, proposal drafts, pasted chat conversations, and notes—and synthesize them into structured, living dossiers.

---

## Key Features

- **Multi-Source Ingestion**: Feed notes, meeting exports, PDFs, and docs into a unified project knowledge base.
- **Structured Dossiers**: Generates consistent, comprehensive breakdowns covering:
  - **Overview**: What the project is in plain terms.
  - **Problem Statement**: The pain point being addressed and target user.
  - **Value Proposition**: How it helps and why it matters.
  - **Technical Breakdown**: Architecture, stack, and mechanics.
  - **Cost & Feasibility**: Estimated implementation and operational costs.
  - **Gap Detection**: Highlights missing details in your source material so you know what questions to answer next.
- **Audience Switching**: Re-frame the same factual baseline for different stakeholders (e.g., Investor Pitch, Academic/Supervisor Report, Customer Explanation, Technical Team).
- **Private & Single-User**: Built strictly for personal owner use with email authentication—no extraneous profile overhead or public user directory.

---

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (Full-stack React 19 SSR & Server Functions)
- **Styling & UI**: Tailwind CSS v4 & [shadcn/ui](https://ui.shadcn.com/)
- **Backend & Storage**: Lovable Cloud (Database, Authentication, and Storage)
- **Document Processing**: Client and server-side text/document extractors
- **AI Integration**: AI SDK with structured dossier schema validation

---

## Getting Started

### Prerequisites

- Node.js (v20+ recommended) or Bun

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd x-plain
