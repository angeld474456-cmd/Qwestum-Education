import { redirect } from "next/navigation";

import NewQuestForm from "@/components/quests/NewQuestForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewQuestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <NewQuestForm />;
}
