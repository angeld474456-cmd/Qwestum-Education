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

type UploadQuestCoverImageResponse = {
  cover_image_path?: string | null;
  cover_image_url?: string | null;
  error?: string;
};

type RemoveQuestCoverImageResponse = {
  success?: boolean;
  cover_image_path?: string | null;
  cover_image_url?: string | null;
  storageDeleted?: boolean;
  error?: string;
};

export async function uploadQuestImage(
  questId: string,
  taskId: string,
  file: File,
  expectedImageUrl: string | null
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("expectedImageUrl", expectedImageUrl ?? "");

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

export async function removeQuestImage(
  questId: string,
  taskId: string,
  expectedImageUrl: string
) {
  try {
    const response = await fetch(
      `/api/teacher/quests/${encodeURIComponent(
        questId
      )}/tasks/${encodeURIComponent(taskId)}/image`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expectedImageUrl }),
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

export async function uploadQuestCoverImage(questId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(
      `/api/teacher/quests/${encodeURIComponent(questId)}/cover`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (isSessionExpiredResponse(response)) {
      redirectToSessionExpiredLogin();
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }

    const result = (await response.json()) as UploadQuestCoverImageResponse;

    if (!response.ok || !result.cover_image_url) {
      return {
        error: result.error ?? "Unable to upload cover image.",
        coverImageUrl: null,
      };
    }

    return {
      error: null,
      coverImageUrl: result.cover_image_url,
    };
  } catch (error) {
    if (error instanceof Error && error.message === SESSION_EXPIRED_MESSAGE) {
      throw error;
    }

    console.error(error);
    return {
      error: "Unable to upload cover image.",
      coverImageUrl: null,
    };
  }
}

export async function removeQuestCoverImage(questId: string) {
  try {
    const response = await fetch(
      `/api/teacher/quests/${encodeURIComponent(questId)}/cover`,
      {
        method: "DELETE",
      }
    );

    if (isSessionExpiredResponse(response)) {
      redirectToSessionExpiredLogin();
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }

    const result = (await response.json()) as RemoveQuestCoverImageResponse;

    if (!response.ok || !result.success) {
      return {
        error: result.error ?? "Unable to remove cover image.",
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
      error: "Unable to remove cover image.",
      storageDeleted: false,
    };
  }
}
