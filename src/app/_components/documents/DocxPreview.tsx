"use client";

import { useEffect, useState } from "react";
import ManuscriptView from "../manuscript/ManuscriptView";
import { importWordFile } from "../../_lib/manuscriptImport";

// A Word (.docx) file read in the browser and shown as pages: converted to plain structure by mammoth, then drawn by the same read-only editor
// the manuscript uses (so only what its schema knows is shown, never raw HTML). Fonts, colours and exact spacing of the original are not shown:
// the Download button gives the real file.
export default function DocxPreview({ url, name }: { url: string; name: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then((response) => response.blob())
      .then((blob) => importWordFile(new File([blob], name || "document.docx")))
      .then((result) => {
        if (cancelled) return;
        if (result.empty) setError("This Word file has no text to show. Download it to open it in Word.");
        else setHtml(result.html);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "This Word file could not be shown. Download it instead.");
      });

    return () => {
      cancelled = true;
    };
  }, [url, name]);

  if (error) return <p role="alert" className="p-6 text-sm text-[#b42318]">{error}</p>;
  if (html === null) return <p className="p-6 text-sm text-[#7b877f]">Reading the Word file...</p>;

  return (
    <div className="h-full overflow-y-auto">
      <p className="border-b border-[#dfe8df] bg-white px-4 py-2 text-xs text-[#7b877f]">
        A reading view of the Word file: text, headings, lists, tables and pictures. Fonts and exact layout may differ from the original; download it for that.
      </p>
      <ManuscriptView content={html} />
    </div>
  );
}
