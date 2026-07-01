export interface User {
  id: string;

  name: string;

  email: string;

  role:
    | "teacher"
    | "student"
    | "school"
    | "admin";

  avatar?: string;

  createdAt: string;
}