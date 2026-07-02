import { supabase } from "@/lib/supabase";

export async function uploadQuestImage(file: File) {
  const extension = file.name.split(".").pop();

  const fileName =
    crypto.randomUUID() + "." + extension;

  const filePath = `tasks/${fileName}`;

  const { error } = await supabase.storage
    .from("quest-images")
    .upload(filePath, file);

  if (error) {
    return {
      error,
      url: null,
    };
  }

  const { data } = supabase.storage
    .from("quest-images")
    .getPublicUrl(filePath);

  return {
    error: null,
    url: data.publicUrl,
  };
}