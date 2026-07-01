export interface Quest {
  id: string;

  title: string;

  description: string;

  subject: string;

  grade: number;

  language: string;

  difficulty: "easy" | "medium" | "hard";

  duration: number;

  price: number;

  image: string;

  author: string;

  premium: boolean;

  tags: string[];

  createdAt: string;

  updatedAt: string;
}