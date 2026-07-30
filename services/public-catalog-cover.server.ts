import "server-only";

import {
  parsePublicQuestCoverImageObjectPath,
  questCoverImageBucketName,
  questCoverImageMaxFileSize,
} from "@/lib/storage/quest-cover.server";
import { createCatalogMediaClient } from "@/lib/supabase/catalog-media.server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PublicCatalogCoverSuccess = {
  status: "success";
  bytes: Uint8Array;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  contentLength: number;
};

export type PublicCatalogCoverResult =
  | PublicCatalogCoverSuccess
  | { status: "not_found" }
  | { status: "internal_error" };

type ResolverRow = Record<string, unknown>;

function isPlainObject(value: unknown): value is ResolverRow {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function contentTypeForExtension(
  extension: string
): PublicCatalogCoverSuccess["contentType"] | null {
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return null;
}

function detectImageContentType(
  bytes: Uint8Array
): PublicCatalogCoverSuccess["contentType"] | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

function isBlob(value: unknown): value is Blob {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Blob).size === "number" &&
    typeof (value as Blob).arrayBuffer === "function"
  );
}

function isStorageNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    Reflect.get(error, "status") === 404
  );
}

export async function getPublicCatalogCover(
  questId: string
): Promise<PublicCatalogCoverResult> {
  if (!uuidPattern.test(questId)) return { status: "not_found" };

  const normalizedQuestId = questId.toLowerCase();

  try {
    const supabase = createCatalogMediaClient();
    const { data, error } = await supabase.rpc(
      "resolve_public_catalog_cover",
      { p_quest_id: normalizedQuestId }
    );

    if (error || !Array.isArray(data)) return { status: "internal_error" };
    if (data.length === 0) return { status: "not_found" };
    if (data.length !== 1 || !isPlainObject(data[0])) {
      return { status: "internal_error" };
    }

    const objectPath = data[0].object_path;
    if (typeof objectPath !== "string") return { status: "internal_error" };

    const parsedPath = parsePublicQuestCoverImageObjectPath(objectPath);
    if (!parsedPath || parsedPath.questId !== normalizedQuestId) {
      return { status: "not_found" };
    }

    const contentType = contentTypeForExtension(parsedPath.extension);
    if (!contentType) return { status: "not_found" };

    const { data: blob, error: downloadError } = await supabase.storage
      .from(questCoverImageBucketName)
      .download(objectPath);

    if (downloadError !== null) {
      return isStorageNotFoundError(downloadError)
        ? { status: "not_found" }
        : { status: "internal_error" };
    }
    if (!isBlob(blob) || blob.size <= 0 || blob.size > questCoverImageMaxFileSize) {
      return { status: "not_found" };
    }
    if (blob.type && blob.type !== contentType) return { status: "not_found" };

    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (
      bytes.byteLength === 0 ||
      bytes.byteLength > questCoverImageMaxFileSize ||
      detectImageContentType(bytes) !== contentType
    ) {
      return { status: "not_found" };
    }

    return {
      status: "success",
      bytes,
      contentType,
      contentLength: bytes.byteLength,
    };
  } catch {
    return { status: "internal_error" };
  }
}
