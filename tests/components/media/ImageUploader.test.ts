import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) =>
    createElement("img", props),
}));

import ImageUploader, {
  getImageUploadErrorMessage,
  getImageUploadButtonLabel,
  getSelectedImageFileLabel,
  ImageUploadStatus,
  imageUploaderIsBusy,
  removeSelectedTaskImage,
  uploadSelectedTaskImage,
} from "@/components/media/ImageUploader";

describe("ImageUploader", () => {
  it("shows an upload action and visually hides the native file input without an image", () => {
    const markup = renderToStaticMarkup(
      createElement(ImageUploader, {
        onUpload: vi.fn(),
      })
    );

    expect(markup).toContain("Загрузить изображение");
    expect(markup).toContain('type="file"');
    expect(markup).toContain('class="sr-only"');
    expect(markup).toContain('accept="image/*"');
    expect(markup).not.toContain("Удалить изображение");
  });

  it("shows replace and delete actions when an image exists", () => {
    const markup = renderToStaticMarkup(
      createElement(ImageUploader, {
        imageUrl: "https://example.test/task.png",
        onUpload: vi.fn(),
        onRemove: vi.fn(),
      })
    );

    expect(markup).toContain("Заменить изображение");
    expect(markup).toContain("Удалить изображение");
    expect(markup).toContain('src="https://example.test/task.png"');
  });

  it("keeps the selected-file status contract concise", () => {
    expect(getSelectedImageFileLabel("filename.png")).toBe(
      "Выбрано: filename.png"
    );
  });

  it("renders accessible uploading and success statuses", () => {
    const uploading = renderToStaticMarkup(
      createElement(ImageUploadStatus, { status: "uploading" })
    );
    const success = renderToStaticMarkup(
      createElement(ImageUploadStatus, { status: "success" })
    );

    expect(uploading).toContain("Загрузка изображения...");
    expect(uploading).toContain('role="status"');
    expect(uploading).toContain("animate-spin");
    expect(success).toContain("Изображение загружено");
    expect(success).toContain('aria-live="polite"');
  });

  it("disables conflicting controls while an upload is pending", () => {
    expect(imageUploaderIsBusy(false, true)).toBe(true);
    expect(imageUploaderIsBusy(true, false)).toBe(true);
    expect(imageUploaderIsBusy(false, false)).toBe(false);
  });

  it("uses the shared fallback while retaining useful upload error detail", () => {
    expect(getImageUploadErrorMessage(undefined)).toBe(
      "Не удалось загрузить изображение. Попробуйте ещё раз."
    );
    expect(getImageUploadErrorMessage(new Error("Слишком большой файл"))).toBe(
      "Не удалось загрузить изображение. Попробуйте ещё раз. Слишком большой файл"
    );
  });

  it("clears the selected filename after the delete callback succeeds", async () => {
    const onRemoved = vi.fn();
    const onRemove = vi.fn().mockResolvedValue(undefined);

    await removeSelectedTaskImage({ onRemove, onRemoved });

    expect(onRemove).toHaveBeenCalledOnce();
    expect(onRemoved).toHaveBeenCalledOnce();
  });

  it("publishes the selected filename and preserves the existing upload callback", async () => {
    const file = new File(["image"], "filename.png", {
      type: "image/png",
    });
    const onSelected = vi.fn();
    const onUpload = vi.fn().mockResolvedValue(undefined);

    await uploadSelectedTaskImage({
      disabled: false,
      file,
      onSelected,
      onUpload,
    });

    expect(onSelected).toHaveBeenCalledWith("filename.png");
    expect(onUpload).toHaveBeenCalledWith(file);
  });

  it("preserves upload failures for the visible error state and keeps an existing image contract intact", async () => {
    const file = new File(["image"], "replacement.png", {
      type: "image/png",
    });
    const onSelected = vi.fn();
    const onUpload = vi.fn().mockRejectedValue(new Error("upload failed"));

    await expect(
      uploadSelectedTaskImage({
        disabled: false,
        file,
        onSelected,
        onUpload,
      })
    ).rejects.toThrow("upload failed");
    expect(onSelected).toHaveBeenCalledWith("replacement.png");

    const markup = renderToStaticMarkup(
      createElement(ImageUploader, {
        imageUrl: "https://example.test/current.png",
        onUpload,
      })
    );
    expect(markup).toContain('src="https://example.test/current.png"');
  });

  it("does not select or upload a file when the control is disabled", async () => {
    const onSelected = vi.fn();
    const onUpload = vi.fn().mockResolvedValue(undefined);

    await uploadSelectedTaskImage({
      disabled: true,
      file: new File(["image"], "filename.png", { type: "image/png" }),
      onSelected,
      onUpload,
    });

    expect(onSelected).not.toHaveBeenCalled();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("uses the image state to choose the custom upload action", () => {
    expect(getImageUploadButtonLabel(null)).toBe("Загрузить изображение");
    expect(getImageUploadButtonLabel("https://example.test/task.png")).toBe(
      "Заменить изображение"
    );
  });
});
