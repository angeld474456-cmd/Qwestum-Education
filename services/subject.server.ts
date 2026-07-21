import "server-only";

import { createClient } from "@/lib/supabase/server";

export type TeacherSubject = {
  id: string;
  name: string;
  grade: number | null;
};

export async function getTeacherSubjects(): Promise<TeacherSubject[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, grade")
    .order("name", { ascending: true })
    .order("grade", { ascending: true, nullsFirst: true })
    .order("id", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as TeacherSubject[];
}
