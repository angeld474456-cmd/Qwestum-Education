import "server-only";

const bucketName = "quest-images";
const maxCoverImageFileSize = 5 * 1024 * 1024;

const acceptedCoverImageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const coverImageFilenamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i;
const canonicalPublicCoverPathPattern =
  /^teachers\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/quests\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/cover\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(jpg|jpeg|png|webp)$/;

export type PublicQuestCoverObjectPath = {
  authorId: string;
  questId: string;
  fileId: string;
  extension: "jpg" | "jpeg" | "png" | "webp";
};

export const questCoverImageBucketName = bucketName;
export const questCoverImageMaxFileSize = maxCoverImageFileSize;
export const questCoverImageMimeTypes = acceptedCoverImageTypes;

export function getQuestCoverImageExtension(mimeType: string) {
  return acceptedCoverImageTypes[mimeType] ?? null;
}

export function createQuestCoverImageObjectPath(
  userId: string,
  questId: string,
  extension: string
) {
  return `teachers/${userId}/quests/${questId}/cover/${crypto.randomUUID()}.${extension}`;
}

export function getSafeQuestCoverImageObjectPath(
  objectPath: string | null | undefined,
  userId: string,
  questId: string
) {
  if (!objectPath) return null;

  const segments = objectPath.split("/");

  if (segments.length !== 6) return null;
  if (segments[0] !== "teachers") return null;
  if (segments[1] !== userId) return null;
  if (segments[2] !== "quests") return null;
  if (segments[3] !== questId) return null;
  if (segments[4] !== "cover") return null;
  if (!coverImageFilenamePattern.test(segments[5])) return null;

  return objectPath;
}

export function parsePublicQuestCoverImageObjectPath(
  objectPath: string | null | undefined
): PublicQuestCoverObjectPath | null {
  if (typeof objectPath !== "string") return null;

  const match = canonicalPublicCoverPathPattern.exec(objectPath);

  if (!match) return null;

  return {
    authorId: match[1],
    questId: match[2],
    fileId: match[3],
    extension: match[4] as PublicQuestCoverObjectPath["extension"],
  };
}

export function getQuestCoverImagePublicUrl(objectPath: string | null) {
  if (!objectPath) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return null;

  const safePath = objectPath.split("/").map(encodeURIComponent).join("/");

  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${safePath}`;
}

export function getSafeQuestCoverImagePublicUrl(
  objectPath: string | null | undefined,
  userId: string | null | undefined,
  questId: string
) {
  if (!userId) return null;

  const safePath = getSafeQuestCoverImageObjectPath(
    objectPath,
    userId,
    questId
  );

  return getQuestCoverImagePublicUrl(safePath);
}
