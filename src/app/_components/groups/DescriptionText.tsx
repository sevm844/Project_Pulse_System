// The project's description is the plain words of the written proposal, one block (paragraph or list item) per line.
// Each line is shown as its own paragraph so the page keeps the shape the student wrote instead of one wall of text.
export default function DescriptionText({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  return (
    <div className={`space-y-3 ${className}`}>
      {lines.map((line, index) => (
        <p key={index} className="break-words">
          {line}
        </p>
      ))}
    </div>
  );
}
