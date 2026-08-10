export const publicCatalogQuestId = "11111111-1111-4111-8111-111111111111";
export const publicCatalogOtherQuestId = "22222222-2222-4222-8222-222222222222";
export const publicCatalogAuthorId = "33333333-3333-4333-8333-333333333333";
export const publicCatalogFileId = "44444444-4444-4444-8444-444444444444";

export const publicCatalogCoverPath =
  "teachers/" +
  publicCatalogAuthorId +
  "/quests/" +
  publicCatalogQuestId +
  "/cover/" +
  publicCatalogFileId +
  ".jpg";

export function createPublicCatalogRpcRow(hasCover: boolean) {
  return {
    id: publicCatalogQuestId,
    title: "Public catalog quest",
    description: "Safe public description",
    subject_name: "Mathematics",
    difficulty: 2,
    language_code: "en",
    grade_min: 5,
    grade_max: 7,
    estimated_duration_minutes: 30,
    category: "Practice",
    tags: ["algebra", "logic"],
    has_cover: hasCover,
    created_at: "2026-07-30T00:00:00.000Z",
    cover_image_path: publicCatalogCoverPath,
    author_id: publicCatalogAuthorId,
    object_path: publicCatalogCoverPath,
  };
}

export const validJpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
export const validPngBytes = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
export const validWebpBytes = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
