export type PublicCatalogLanguageCode = "ru" | "kk" | "en";

export type PublicCatalogQuest = {
  id: string;
  title: string;
  description: string | null;
  subjectName: string | null;
  difficulty: number | null;
  languageCode: PublicCatalogLanguageCode | null;
  gradeMin: number | null;
  gradeMax: number | null;
  estimatedDurationMinutes: number | null;
  category: string | null;
  tags: string[];
  createdAt: string | null;
};

export type PublicCatalogListQuery = {
  search: string | null;
  subject: string | null;
  grade: number | null;
  difficulty: number | null;
  offset: number;
};

export type PublicCatalogListResult = {
  quests: PublicCatalogQuest[];
  hasNext: boolean;
  offset: number;
  pageSize: number;
};
