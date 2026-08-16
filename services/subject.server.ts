import "server-only";

import { createClient } from "@/lib/supabase/server";

const LEGACY_GENERIC_LITERATURE_SUBJECT_ID =
  "12a38e01-8e61-45e9-a6b4-bd00a6b76cd9";

export type TeacherSubject = {
  id: string;
  name: string;
  grade: number | null;
};

type GetTeacherSubjectsOptions = {
  includeSubjectIds?: readonly string[];
};

function sortTeacherSubjects(first: TeacherSubject, second: TeacherSubject) {
  const nameComparison = first.name.localeCompare(second.name, "ru");

  if (nameComparison !== 0) return nameComparison;
  if (first.grade === null && second.grade !== null) return -1;
  if (first.grade !== null && second.grade === null) return 1;

  const gradeComparison = (first.grade ?? 0) - (second.grade ?? 0);
  if (gradeComparison !== 0) return gradeComparison;

  return first.id.localeCompare(second.id);
}

export async function getTeacherSubjects(
  options: GetTeacherSubjectsOptions = {}
): Promise<TeacherSubject[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: canonicalSubjects, error: canonicalError } = await supabase
    .from("subjects")
    .select("id, name, grade")
    .is("grade", null)
    .neq("id", LEGACY_GENERIC_LITERATURE_SUBJECT_ID)
    .order("name", { ascending: true })
    .order("grade", { ascending: true, nullsFirst: true })
    .order("id", { ascending: true });

  if (canonicalError) {
    throw canonicalError;
  }

  const includeSubjectIds = Array.from(
    new Set(options.includeSubjectIds?.filter(Boolean) ?? [])
  );
  let includedSubjects: TeacherSubject[] = [];

  if (includeSubjectIds.length > 0) {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name, grade")
      .in("id", includeSubjectIds)
      .order("name", { ascending: true })
      .order("grade", { ascending: true, nullsFirst: true })
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    includedSubjects = (data ?? []) as TeacherSubject[];
  }

  const subjectsById = new Map<string, TeacherSubject>();

  for (const subject of canonicalSubjects ?? []) {
    subjectsById.set(subject.id, subject as TeacherSubject);
  }

  for (const subject of includedSubjects) {
    subjectsById.set(subject.id, subject);
  }

  return Array.from(subjectsById.values()).sort(sortTeacherSubjects);
}
