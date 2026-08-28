import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  getMultipleChoiceContentError,
  getSingleChoiceContentError,
} from "@/lib/task-choice-content";
import { isValidSequenceTaskContent } from "@/lib/sequence-task-content";
import { MAX_TASK_POINTS } from "@/lib/task-points";
import type {
  PublicationAction,
  PublicationActionResult,
  PublicationIssue,
  PublicationReadiness,
  PublicationRpcRow,
  PublicationStateDto,
} from "@/types/publication";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Row = Record<string, unknown>;
export type PublicationReadinessResult = { status: "ok"; readiness: PublicationReadiness } | { status: "unauthorized" | "not_found" | "error" };
const nonBlank = (v: unknown): v is string => typeof v === "string" && /\S/.test(v);
const object = (v: unknown): v is Row => typeof v === "object" && v !== null && !Array.isArray(v);
const plainObject = (v: unknown): v is Row => {
  if (!object(v)) return false;
  const prototype = Object.getPrototypeOf(v);
  return prototype === Object.prototype || prototype === null;
};
const add = (items: PublicationIssue[], code: string, message: string, taskId?: string, field?: string) => items.push({ code, message, ...(taskId ? { taskId } : {}), ...(field ? { field } : {}) });

const publicationOutcomes = new Set<string>([
  "published",
  "already_published",
  "unpublished",
  "already_draft",
  "blocked",
  "not_found",
]);

function isPublicationRpcRow(row: unknown): row is PublicationRpcRow {
  return plainObject(row)
    && typeof row.is_public === "boolean"
    && typeof row.outcome === "string"
    && publicationOutcomes.has(row.outcome);
}

function mapPublicationRpcRow(row: unknown): PublicationActionResult {
  if (!isPublicationRpcRow(row)) {
    return { status: "error" };
  }

  const outcome = row.outcome;
  const isPublic = row.is_public;
  if ((outcome === "published" || outcome === "already_published") && !isPublic) return { status: "error" };
  if ((outcome === "unpublished" || outcome === "already_draft" || outcome === "not_found") && isPublic) return { status: "error" };
  if (outcome === "blocked") return { status: "blocked" };
  if (outcome === "not_found") return { status: "not_found" };

  const publication: PublicationStateDto = { isPublic, outcome };
  return { status: "ok", publication };
}

function evaluate(q: Row, tasks: Row[]): PublicationReadiness {
  const blockers: PublicationIssue[] = [], warnings: PublicationIssue[] = [];
  if (!nonBlank(q.title)) add(blockers,"quest_title_blank","Название квеста обязательно.",undefined,"title"); else if(q.title.length>500) add(blockers,"quest_title_too_long","Название квеста слишком длинное.",undefined,"title");
  if(typeof q.description==="string"&&q.description.length>10000)add(blockers,"quest_description_too_long","Описание квеста слишком длинное.",undefined,"description");
  if(tasks.length<1)add(blockers,"task_count_too_low","Добавьте хотя бы одно задание."); if(tasks.length>100)add(blockers,"task_count_too_high","Количество заданий превышает лимит.");
  if(!nonBlank(q.description))add(warnings,"missing_description","Добавьте описание квеста."); if(!q.subject_id)add(warnings,"missing_subject","Выберите предмет."); if(q.grade_min==null||q.grade_max==null)add(warnings,"missing_grades","Укажите классы."); if(!q.language_code)add(warnings,"missing_language","Укажите язык."); if(q.estimated_duration_minutes==null)add(warnings,"missing_duration","Укажите длительность."); if(!q.category)add(warnings,"missing_category","Укажите категорию."); if(!Array.isArray(q.tags)||!q.tags.length)add(warnings,"empty_tags","Добавьте теги."); if(!q.cover_image_path)add(warnings,"missing_cover","Добавьте обложку.");
  let supportedTaskCount = 0;
  const orders = new Set<number>();

  for (const task of tasks) {
    const taskId = typeof task.id === "string" ? task.id : undefined;
    const taskType = task.task_type;

    if (
      taskType !== "text" &&
      taskType !== "single_choice" &&
      taskType !== "multiple_choice" &&
      taskType !== "sequence"
    ) {
      add(blockers, "unsupported_task_type", "Тип задания не поддерживается.", taskId, "task_type");
      continue;
    }

    supportedTaskCount += 1;

    if (!nonBlank(task.title)) {
      add(blockers, "task_title_blank", "Название задания обязательно.", taskId, "title");
    } else if (task.title.length > 500) {
      add(blockers, "task_title_too_long", "Название задания слишком длинное.", taskId, "title");
    }

    if (typeof task.description === "string" && task.description.length > 10000) {
      add(blockers, "task_description_too_long", "Описание задания слишком длинное.", taskId, "description");
    }

    if (task.sort_order == null || (typeof task.sort_order === "number" && orders.has(task.sort_order))) {
      add(warnings, "task_order", "Проверьте порядок заданий.", taskId, "sort_order");
    }
    if (typeof task.sort_order === "number") orders.add(task.sort_order);

    if (taskType === "text") continue;

    if (
      typeof task.points !== "number" ||
      !Number.isSafeInteger(task.points) ||
      task.points < 1 ||
      task.points > MAX_TASK_POINTS
    ) {
      add(blockers, "invalid_points", "Баллы должны быть положительным целым числом.", taskId, "points");
    }

    const contentError = taskType === "single_choice"
      ? getSingleChoiceContentError(task.content)
      : taskType === "multiple_choice"
        ? getMultipleChoiceContentError(task.content)
        : isValidSequenceTaskContent(task.content)
          ? null
          : "invalid_sequence_content";

    if (contentError) {
      add(
        blockers,
        contentError,
        "Настройки выбора ответа некорректны.",
        taskId,
        "content",
      );
    }
  }

  return { ready: !blockers.length, blockers, warnings, taskCount: tasks.length, supportedTaskCount };
}
export async function getOwnedQuestPublicationReadiness(questId:string):Promise<PublicationReadinessResult>{if(!uuid.test(questId))return{status:"not_found"};const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return{status:"unauthorized"};const {data:quest,error}=await supabase.from("quests").select("id,title,description,subject_id,language_code,cover_image_path,category,tags,grade_min,grade_max,estimated_duration_minutes").eq("id",questId).eq("author_id",user.id).maybeSingle();if(error)return{status:"error"};if(!quest)return{status:"not_found"};const {data:tasks,error:taskError}=await supabase.from("quest_tasks").select("id,title,description,points,task_type,content,sort_order").eq("quest_id",questId).order("sort_order",{ascending:true,nullsFirst:false}).order("id",{ascending:true});if(taskError)return{status:"error"};return{status:"ok",readiness:evaluate(quest as Row,(tasks??[]) as Row[])}};

export async function setOwnedQuestPublicationState(
  questId: string,
  action: PublicationAction,
): Promise<PublicationActionResult> {
  if (!uuid.test(questId)) return { status: "not_found" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "unauthorized" };

  const { data, error } = await supabase.rpc(
    "set_owned_quest_publication_state",
    { p_quest_id: questId, p_publish: action === "publish" },
  );
  if (error || !Array.isArray(data) || data.length !== 1) {
    return { status: "error" };
  }

  return mapPublicationRpcRow(data[0]);
}
