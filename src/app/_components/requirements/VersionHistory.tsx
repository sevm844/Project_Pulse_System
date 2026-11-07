"use client";

import { useState } from "react";
import { apiFetch, downloadSubmission } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import { formatDate, type ApiSubmissionVersion } from "../../_lib/requirements";

// Earlier versions of one submission. Loaded only when opened.
export default function VersionHistory({
  submissionId,
  versionNo,
}: {
  submissionId: number;
  versionNo: number;
}) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<ApiSubmissionVersion[] | null>(null);
  const [message, setMessage] = useState("");

  if (versionNo <= 1) return null;

  async function toggle() {
    const next = !open;
    setOpen(next);

    if (!next || versions) return;

    try {
      setVersions(await apiFetch<ApiSubmissionVersion[]>(`/submissions/${submissionId}/versions`));
    } catch (err) {
      setMessage(errorMessage(err, "Unable to load earlier versions."));
    }
  }

  async function openVersion(version: ApiSubmissionVersion) {
    try {
      await downloadSubmission(submissionId, version.file_name, version.version_no);
    } catch (err) {
      setMessage(errorMessage(err, "Unable to open the file."));
    }
  }

  return (
    <div className="text-[11px]">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-expanded={open}
        className="font-semibold text-[#7b877f] hover:text-[#203028]"
      >
        {open ? "Hide" : "Show"} earlier versions ({versionNo - 1})
      </button>

      {message && (
        <p role="alert" className="mt-1 text-[#b42318]">
          {message}
        </p>
      )}

      {open && versions && (
        <ul className="mt-2 space-y-2 border-l border-[#dfe8df] pl-3">
          {versions.map((version) => (
            <li key={version.version_no} className="leading-5 text-[#7b877f]">
              <p>
                Version {version.version_no} · {formatDate(version.submitted_at)} ·{" "}
                {version.outcome === "Needs Revision" ? "sent back" : version.outcome.toLowerCase()}
              </p>

              {version.has_file && (
                <button
                  type="button"
                  onClick={() => void openVersion(version)}
                  className="font-semibold text-[#4f8f58] hover:underline"
                >
                  {version.file_name}
                </button>
              )}

              {version.link_url && (
                <a
                  href={version.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-semibold text-[#4f8f58] hover:underline"
                >
                  {version.link_url}
                </a>
              )}

              {version.remarks && <p>“{version.remarks}”</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
