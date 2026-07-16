import {
  isSessionExpiredResponse,
  redirectToSessionExpiredLogin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/auth/session-expired.client";

type UploadQuestImageResponse = {
  imageUrl?: string;
  objectPath?: string;
  error?: string;
};

type RemoveQuestImageResponse = {
  success?: boolean;
  imageUrl?: string | null;
  storageDeleted?: boolean;
  error?: string;
};

export async function uploadQuestImage(
  questId: string,
  taskId: string,
  file: File
) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(
      `/api/teacher/quests/${encodeURIComponent(
        questId
      )}/tasks/${encodeURIComponent(taskId)}/image`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (isSessionExpiredResponse(response)) {
      redirectToSessionExpiredLogin();
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }

    const result = (await response.json()) as UploadQuestImageResponse;

    if (!response.ok || !result.imageUrl) {
      return {
        error: result.error ?? "Unable to upload image.",
        imageUrl: null,
      };
    }

    return {
      error: null,
      imageUrl: result.imageUrl,
    };
  } catch (error) {
    if (error instanceof Error && error.message === SESSION_EXPIRED_MESSAGE) {
      throw error;
    }

    console.error(error);
    return {
      error: "Unable to upload image.",
      imageUrl: null,
    };
  }
}

export async function removeQuestImage(questId: string, taskId: string) {
  try {
    const response = await fetch(
      `/api/teacher/quests/${encodeURIComponent(
        questId
      )}/tasks/${encodeURIComponent(taskId)}/image`,
      {
        method: "DELETE",
      }
    );

    if (isSessionExpiredResponse(response)) {
      redirectToSessionExpiredLogin();
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }

    const result = (await response.json()) as RemoveQuestImageResponse;

    if (!response.ok || !result.success) {
      return {
        error: result.error ?? "Unable to remove image.",
        storageDeleted: false,
      };
    }

    return {
      error: null,
      storageDeleted: result.storageDeleted ?? false,
    };
  } catch (error) {
    if (error instanceof Error && error.message === SESSION_EXPIRED_MESSAGE) {
      throw error;
    }

    console.error(error);
    return {
      error: "Unable to remove image.",
      storageDeleted: false,
    };
  }
}
