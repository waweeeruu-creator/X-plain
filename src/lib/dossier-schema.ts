import { z } from "zod";

export const dossierSections = [
  { key: "overview", label: "What it is" },
  { key: "problem", label: "The problem" },
  { key: "how_it_helps", label: "How it helps" },
  { key: "technicality", label: "How it works" },
  { key: "cost", label: "Cost" },
  { key: "gaps", label: "Open questions" },
] as const;

export const audienceOptions = [
  { value: "general", label: "General" },
  { value: "investor", label: "Investor" },
  { value: "lecturer", label: "Lecturer" },
  { value: "customer", label: "Customer" },
  { value: "partner", label: "Project partner" },
  { value: "plain_english", label: "Plain English" },
] as const;

export const audienceSchema = z.enum([
  "general",
  "investor",
  "lecturer",
  "customer",
  "partner",
  "plain_english",
]);

export const dossierSchema = z.object({
  overview: z.string(),
  problem: z.string(),
  how_it_helps: z.string(),
  technicality: z.string(),
  cost: z.string(),
  gaps: z.string(),
});

export type DossierContent = z.infer<typeof dossierSchema>;
export type Audience = z.infer<typeof audienceSchema>;

export function createEmptyDossier(): DossierContent {
  return {
    overview: "",
    problem: "",
    how_it_helps: "",
    technicality: "",
    cost: "",
    gaps: "",
  };
}