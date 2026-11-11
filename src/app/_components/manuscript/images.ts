// Pictures are kept inside the document (as data), so each one is shrunk first: at most 1200 px wide and under the
// server's 1 MB-per-image limit. Animated GIFs become still pictures.
const ALLOWED = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_CHARS = 1_400_000;

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

// createImageBitmap decodes without putting a picture on the page, so browsers that delay loading images
// (data-saver modes) cannot leave it waiting. The <img> route is only a fallback for older browsers.
async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      throw new Error("That file could not be read as a picture.");
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () =>
      resolve({ source: image, width: image.naturalWidth, height: image.naturalHeight, release: () => URL.revokeObjectURL(url) });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as a picture."));
    };
    image.src = url;
  });
}

export async function imageToDataUrl(file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Use a PNG, JPEG, GIF or WebP picture.");
  if (file.size > 15 * 1024 * 1024) throw new Error("That picture is too large. Choose one under 15 MB.");

  const image = await decode(file);

  try {
    const attempts: { width: number; type: string; quality?: number }[] = [
      { width: 1200, type: "image/png" },
      { width: 1200, type: "image/jpeg", quality: 0.85 },
      { width: 900, type: "image/jpeg", quality: 0.75 },
      { width: 640, type: "image/jpeg", quality: 0.7 },
    ];

    for (const attempt of attempts) {
      const scale = Math.min(1, attempt.width / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext("2d");
      if (!context) break;

      if (attempt.type === "image/jpeg") {
        // JPEG has no transparency: paint white first so it does not turn black.
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image.source, 0, 0, canvas.width, canvas.height);

      const data = canvas.toDataURL(attempt.type, attempt.quality);
      if (data.length <= MAX_CHARS) return data;
    }
  } finally {
    image.release();
  }

  throw new Error("That picture is too detailed to keep in the document. Try a smaller one.");
}
