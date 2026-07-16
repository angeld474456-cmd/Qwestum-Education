type UploadQuestImageResponse = {
  imageUrl?: string;
  objectPath?: string;
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
    console.error(error);
    return {
      error: "Unable to upload image.",
      imageUrl: null,
    };
  }
}
