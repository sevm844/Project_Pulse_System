"use client";

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { FIELD_LABELS, segments, type CertificateFields, type CertificateTemplate, type FieldName } from "../../_lib/certificates";

// The certificate as a sheet of paper. The fixed wording is plain text; the parts that change from group to group are in
// bold, and in "edit" mode each of them can be changed right on the page. Nothing else on the form can be edited here.
export default function CertificatePaper({
  template,
  fields,
  editable = false,
  onChange,
  editorName,
  signature,
  number,
}: {
  template: CertificateTemplate;
  fields: CertificateFields;
  editable?: boolean;
  onChange?: (field: FieldName, value: string) => void;
  editorName: string;
  signature: string | null;
  number?: string | null;
}) {
  return (
    <article
      aria-label="Certificate"
      className="mx-auto w-full max-w-[816px] bg-white px-6 py-8 text-[14px] leading-[1.7] text-black shadow-[0_1px_6px_rgba(18,63,43,0.12)] sm:px-14 sm:py-12"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed local logo, shown at its own shape */}
        <img src="/certificate/ub-rpo-logo.png" alt="University of Batangas Research and Publications Office" className="w-[190px] max-w-[55%]" />
        <p className="text-[13px] font-bold">{template.header.form_code}</p>
      </div>

      <div className="mt-3 flex flex-wrap justify-between gap-x-4 border-y border-black py-1 text-[11px]">
        <span>Revision No.: {template.header.revision_no}</span>
        <span>Issue Date: {template.header.issue_date}</span>
        <span>Revision Date: {template.header.revision_date}</span>
      </div>

      <h2 className="mb-5 mt-9 text-center text-[15px] font-bold">{template.title}</h2>

      {template.paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-4 text-justify indent-9">
          {segments(paragraph).map((segment, i) =>
            segment.field ? (
              <Field key={i} name={segment.field} value={fields[segment.field]} editable={editable} onChange={onChange} />
            ) : (
              <span key={i}>{segment.text}</span>
            ),
          )}
        </p>
      ))}

      <p className="mt-6">{template.certified_by}</p>

      <div className="mt-2 min-h-[56px]">
        {signature && (
          // eslint-disable-next-line @next/next/no-img-element -- the Grammarian's own picture (a data URL)
          <img src={signature} alt="Signature of the editor" className="max-h-[70px] max-w-[200px]" />
        )}
      </div>
      <p className="font-bold uppercase">{editorName}</p>
      <p className="select-none overflow-hidden whitespace-nowrap">----------------------------------------</p>
      <p>{template.signature_label}</p>

      <p className="mt-5">
        {template.date_signed_label}{" "}
        <Field name="signed_date" value={fields.signed_date} editable={editable} onChange={onChange} />
      </p>

      {number && <p className="mt-8 text-right text-[10px] text-[#777]">Certificate No. {number}</p>}
    </article>
  );
}

// One fill-in field: bold text. In edit mode it is typed into directly (one line of plain text; Enter does nothing).
function Field({ name, value, editable, onChange }: { name: FieldName; value: string; editable: boolean; onChange?: (field: FieldName, value: string) => void }) {
  const ref = useRef<HTMLSpanElement>(null);

  // The text is set from outside only when it differs from what is typed (a date picker, "start again"), so the cursor
  // never jumps while someone is typing.
  useEffect(() => {
    // A space typed at the end of the field is stored by the browser as a non-breaking space: that is not a change.
    if (ref.current && (ref.current.textContent ?? "").replace(/\s+/g, " ") !== value) ref.current.textContent = value;
  }, [value]);

  if (!editable) return <strong>{value}</strong>;

  return (
    <span
      ref={ref}
      role="textbox"
      aria-label={FIELD_LABELS[name]}
      title={`${FIELD_LABELS[name]}: click to change`}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      onInput={(event) => onChange?.(name, (event.currentTarget.textContent ?? "").replace(/\s+/g, " "))}
      onKeyDown={(event: KeyboardEvent<HTMLSpanElement>) => event.key === "Enter" && event.preventDefault()}
      onPaste={(event: ClipboardEvent<HTMLSpanElement>) => {
        event.preventDefault();
        document.execCommand("insertText", false, event.clipboardData.getData("text/plain").replace(/\s+/g, " "));
      }}
      className="cursor-text rounded-sm border-b border-dashed border-[#4f8f58] bg-[#eef6ee] px-0.5 font-bold outline-none focus:bg-[#e1f0e2] focus:ring-2 focus:ring-[#4f8f58]/40 empty:before:text-[#9aa79d] empty:before:content-['(type_here)']"
    />
  );
}
