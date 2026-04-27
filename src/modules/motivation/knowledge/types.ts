export type KnowledgeCategory =
  | "habit-science"
  | "goal-psychology"
  | "deep-work"
  | "our-approach";

export type KnowledgeSnippet = {
  id: string;
  category: KnowledgeCategory;
  body: string;
  source?: string;
};
