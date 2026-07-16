import "server-only";

const bucketName = "quest-images";

export function getSafeQuestImageObjectPath(
  imageUrl: string,
  userId: string,
  questId: string,
  taskId: string
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return null;

  try {
    const publicUrl = new URL(imageUrl);
    const projectUrl = new URL(supabaseUrl);

    if (publicUrl.origin !== projectUrl.origin) return null;

    const publicPrefix = `/storage/v1/object/public/${bucketName}/`;

    if (!publicUrl.pathname.startsWith(publicPrefix)) return null;

    const objectPath = decodeURIComponent(
      publicUrl.pathname.slice(publicPrefix.length)
    );
    const segments = objectPath.split("/");

    if (segments.length !== 7) return null;
    if (segments[0] !== "teachers") return null;
    if (segments[1] !== userId) return null;
    if (segments[2] !== "quests") return null;
    if (segments[3] !== questId) return null;
    if (segments[4] !== "tasks") return null;
    if (segments[5] !== taskId) return null;
    if (!segments[6]) return null;

    return objectPath;
  } catch {
    return null;
  }
}

export const questImageBucketName = bucketName;
