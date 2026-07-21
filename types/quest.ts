export interface Quest {
  id: string;

  title: string;

  description: string | null;

  subject_id: string | null;

  author_id: string;

  difficulty: number;

  is_public: boolean;

  created_at: string;
}
