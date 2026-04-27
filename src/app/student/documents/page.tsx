"use client";

import { useState } from "react";
import StudentShell from "../_components/StudentShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import { documents as initialDocuments, type DocumentItem } from "../_data/mockStudentData";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState(initialDocuments);
  const [selected, setSelected] = useState<DocumentItem | null>(null);
  const [modal, setModal] = useState<null | "upload" | "history" | "compare">(null);

  function submitToAdviser(document: DocumentItem) {
    setDocuments((current) =>
      current.map((item) =>
        item.id === document.id ? { ...item, status: "Under Review" } : item,
      ),
    );
  }

  function uploadNewVersion() {
    if (!selected) return;

    setDocuments((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              version: `v${Number(item.version.replace("v", "")) + 1}`,
              updated: "Today",
              status: "Under Review",
            }
          : item,
      ),
    );

    setModal(null);
    setSelected(null);
  }

  return (
    <StudentShell title="Documents">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#edf2ec] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#203028]">Documents</h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Submit, store, review, compare, and restore document versions.
            </p>
          </div>

          <button
            onClick={() => {
              setSelected(null);
              setModal("upload");
            }}
            className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
          >
            Upload New Document
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
              <tr>
                <th className="px-5 py-3 font-medium">Document Type</th>
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium">Updated</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Reviewer</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2ec]">
              {documents.map((document) => (
                <tr key={document.id} className="hover:bg-[#fbfdfb]">
                  <td className="px-5 py-4 font-medium text-[#203028]">
                    {document.type}
                  </td>
                  <td className="px-5 py-4 text-[#59645d]">{document.version}</td>
                  <td className="px-5 py-4 text-[#59645d]">{document.updated}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={document.status} />
                  </td>
                  <td className="px-5 py-4 text-[#59645d]">{document.reviewer}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelected(document);
                          setModal("upload");
                        }}
                        className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                      >
                        Upload Version
                      </button>
                      <button
                        onClick={() => {
                          setSelected(document);
                          setModal("history");
                        }}
                        className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                      >
                        History
                      </button>
                      <button
                        onClick={() => {
                          setSelected(document);
                          setModal("compare");
                        }}
                        className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                      >
                        Compare
                      </button>
                      <button
                        onClick={() => submitToAdviser(document)}
                        className="rounded-lg bg-[#202823] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#303a33]"
                      >
                        Submit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#203028]">
                  {modal === "upload" && "Upload Document"}
                  {modal === "history" && "Version History"}
                  {modal === "compare" && "Compare Versions"}
                </h2>
                <p className="mt-1 text-sm text-[#7b877f]">
                  {selected?.type || "New document submission"}
                </p>
              </div>
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"
              >
                Close
              </button>
            </div>

            {modal === "upload" ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-dashed border-[#dfe8df] bg-[#f8faf7] p-6 text-center">
                  <p className="text-sm font-medium text-[#203028]">
                    Select PDF or document file
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    In deployment, this connects to file storage and creates a new version record.
                  </p>
                </div>
                <textarea
                  placeholder="What changed?"
                  className="min-h-24 w-full resize-none rounded-xl border border-[#dfe8df] px-4 py-3 text-sm outline-none"
                />
                <button
                  onClick={selected ? uploadNewVersion : () => setModal(null)}
                  className="w-full rounded-lg bg-[#202823] px-4 py-3 text-sm font-semibold text-white hover:bg-[#303a33]"
                >
                  Submit Upload
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-[#f8faf7] p-5 text-sm leading-7 text-[#59645d]">
                {modal === "history" &&
                  "This will show a timeline of previous versions, upload notes, reviewers, and restore actions."}
                {modal === "compare" &&
                  "This will show side-by-side file previews or document differences when backend file processing is implemented."}
              </div>
            )}
          </div>
        </div>
      )}
    </StudentShell>
  );
}
