import { redirect } from "next/navigation";

export default function LegacyNewQuestPage() {
  redirect("/dashboard/quests/new");
}
