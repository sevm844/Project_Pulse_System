import { imageToDataUrl } from "../_components/manuscript/images";

// Bring a Word file (.docx) into the manuscript editor. Everything happens in the browser: the file is never sent anywhere.
// mammoth reads the document into plain HTML (headings, bold, italic, lists, tables, pictures); the editor then keeps only what its own
// schema knows, and the server checks the saved result again with the manuscript whitelist. The HTML is never put on the page.
// Word's exact fonts, colours and spacing are not carried over, only the content and its structure.

export const MAX_DOCX_MB = 25;

export type WordImport = {
  html: string;
  /** Pictures that were put in the document (shrunk), and how many could not be read. */
  pictures: number;
  skippedPictures: number;
  /** True when the file has no text and no pictures. */
  empty: boolean;
};

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function checkWordFile(file: File): string | null {
  if (!/\.docx$/i.test(file.name) && file.type !== DOCX_TYPE) {
    return /\.doc$/i.test(file.name)
      ? "That is an older Word file (.doc). Open it in Word and use Save As, then choose Word Document (.docx)."
      : "Choose a Word file that ends in .docx.";
  }
  if (file.size > MAX_DOCX_MB * 1024 * 1024) return `That file is too large. Choose one under ${MAX_DOCX_MB} MB.`;

  return null;
}

export async function importWordFile(file: File): Promise<WordImport> {
  const problem = checkWordFile(file);
  if (problem) throw new Error(problem);

  const loaded = await import("mammoth");
  const mammoth = loaded.default ?? loaded;
  const arrayBuffer = await file.arrayBuffer();
  let pictures = 0;
  let skippedPictures = 0;

  let result;
  try {
    result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        // Word underline is dropped by default; the editor has it.
        styleMap: ["u => u"],
        convertImage: mammoth.images.imgElement(async (image) => {
          try {
            const bytes = await image.read("base64");
            const binary = atob(bytes);
            const data = Uint8Array.from(binary, (char) => char.charCodeAt(0));
            const src = await imageToDataUrl(new File([data], "picture", { type: image.contentType }));
            pictures += 1;

            return { src };
          } catch {
            // Word pictures the browser cannot show (for example EMF/WMF drawings) are left out.
            skippedPictures += 1;

            return { src: "" };
          }
        }),
      },
    );
  } catch {
    throw new Error("That file could not be read. Check that it is a Word document (.docx) and is not damaged or password protected.");
  }

  // Remove the pictures that could not be read, then give back clean markup. DOMParser builds a detached document: nothing runs.
  const parsed = new DOMParser().parseFromString(result.value, "text/html");
  parsed.querySelectorAll("img").forEach((img) => {
    if (!img.getAttribute("src")) img.remove();
  });
  const html = parsed.body.innerHTML;
  const empty = parsed.body.textContent?.trim() === "" && parsed.body.querySelector("img, table") === null;

  return { html, pictures, skippedPictures, empty };
}
