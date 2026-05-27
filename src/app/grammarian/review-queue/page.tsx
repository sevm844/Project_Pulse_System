"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GrammarianShell from "../_components/GrammarianShell";
import Card from "../_components/Card";
import {
  certifyGrammarReview,
  getStoredGrammarReviews,
  returnGrammarReviewForRevision,
  updateGrammarReview,
  type GrammarReviewAssignment,
  type CertificateDetails,
} from "../../_utils/grammarReviewStorage";
import HighlightCommentEditor from "../../student/_components/HighlightCommentEditor";

function statusClasses(status: string) {
  if (status === "Certified") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Under Review") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (status === "For Grammar Review") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function certificateClasses(status: string) {
  if (status === "Issued") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-[#dfe8df] bg-[#f8faf7] text-[#59645d]";
}

export default function GrammarianReviewQueuePage() {
  const [items, setItems] = useState<GrammarReviewAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<number, string>>(
    {},
  );
  const [certificateEditingId, setCertificateEditingId] = useState<
    number | null
  >(null);
  const [certificateDrafts, setCertificateDrafts] = useState<
    Record<number, CertificateDetails>
  >({});
  const certificateEditorRef = useRef<HTMLDivElement | null>(null);

  function buildCertificateHtml(details: CertificateDetails | undefined) {
    const d = details || {
      projectTitle: "",
      authorNames: "",
      degreeType: "",
      dateSigned: "",
      certifiedByName: "",
      certifiedByTitle: "",
    };

    return `
      <div style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #212121; min-height:1060px; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px;">
            <div style="font-size:12px; color:#5f7063;">F-RPO-09</div>
            <div style="text-align:right; max-width:280px;">
              <img src="/ub.png" alt="University of Batangas" style="max-width:100%; height:auto; display:inline-block;" />
            </div>
          </div>

        <div style="text-align:center; margin-bottom:28px;">
          <div style="font-size:13px; letter-spacing:0.3em; text-transform:uppercase; color:#4f6054; margin-bottom:12px;">Certification of Editing/Originality</div>
        </div>

        <div style="max-width:760px; margin:0 auto; font-size:14px; line-height:1.9;">
          <p style="text-align:justify; text-indent:2rem;"><strong>This is to certify that this thesis/dissertation/capstone project entitled “${escapeHtml(d.projectTitle)}”:</strong> in partial fulfillment of the requirements for the degree <strong>${escapeHtml(d.degreeType)}</strong> was properly edited and that no part lifted verbatim from the references, theses, and dissertations used or examined was unacknowledged; hence, no issue of plagiarism can be raised. The manuscript has been subjected to similarity/plagiarism check by Turnitin software.</p>

          <p style="margin-top:36px; text-align:center;"><strong>Done this ${escapeHtml(d.dateSigned)}.</strong></p>

          <div style="margin-top:44px; display:flex; flex-direction:column; gap:8px; align-items:flex-start;">
            <div style="font-size:14px; font-weight:700;">Certified by:</div>
            <div style="margin-top:18px;">
              <img src="/mamB.png" alt="Grammarian signature logo" style="max-width:180px; width:100%; height:auto; display:block;" />
            </div>
            <div style="font-size:12px; color:#4a4a4a;">Printed Name and Signature of Editor</div>
            <div style="margin-top:8px; font-size:12px;">Date Signed: _________________________</div>
          </div>
        </div>
        </div>

        <div style="width:100%; max-width:760px; margin:80px auto 0; padding:0 20px; box-sizing:border-box; display:flex; justify-content:space-between; font-size:11px; color:#6a6f6c;">
          <div style="width:33%; text-align:left;">Revision No.: 0</div>
          <div style="width:33%; text-align:center;">Issue Date: June 9, 2021</div>
          <div style="width:33%; text-align:right;">Revision Date: N/A</div>
        </div>
      </div>
    `;
  }

  function escapeHtml(input: string) {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  useEffect(() => {
    queueMicrotask(() => {
      const reviews = getStoredGrammarReviews();
      setItems(reviews);
      setFeedbackDrafts(
        Object.fromEntries(reviews.map((item) => [item.id, item.feedback])),
      );
      setCertificateDrafts(
        Object.fromEntries(
          reviews.map((item) => [
            item.id,
            item.certificateDetails || {
              projectTitle: item.projectTitle || "",
              authorNames: "",
              degreeType: "Bachelor of Science",
              dateSigned: new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
              certifiedByName: item.assignedGrammarian || "",
              certifiedByTitle: "Editor",
            },
          ]),
        ),
      );
    });
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return items.filter((item) => {
      const searchable = [
        item.groupName,
        item.projectTitle,
        item.course,
        item.section,
        item.documentTitle,
        item.manuscriptFile,
        item.reviewStatus,
        item.adviser,
        item.sentBy,
        item.assignedGrammarian,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (statusFilter === "All" || item.reviewStatus === statusFilter)
      );
    });
  }, [items, searchQuery, statusFilter]);

  const forReview = items.filter(
    (item) => item.reviewStatus === "For Grammar Review",
  ).length;
  const reviewed = items.filter(
    (item) => item.reviewStatus === "Certified",
  ).length;
  const certificates = items.filter(
    (item) => item.certificateStatus === "Issued",
  ).length;

  function startReview(id: number) {
    setItems(updateGrammarReview(id, { reviewStatus: "Under Review" }));
  }

  function returnForRevision(id: number) {
    const feedback = feedbackDrafts[id]?.trim();
    if (!feedback) return;

    setItems(returnGrammarReviewForRevision(id, feedback));
  }

  function certify(id: number) {
    const feedback = feedbackDrafts[id]?.trim();
    const details = certificateDrafts[id];
    const editorHtml = certificateEditorRef.current?.innerHTML;
    const nextDetails = {
      ...details,
      bodyHtml: editorHtml || details?.bodyHtml,
    };
    setCertificateDrafts((current) => ({
      ...current,
      [id]: nextDetails,
    }));
    const next = certifyGrammarReview(id, feedback || "", nextDetails);
    setItems(next);
    setCertificateEditingId(null);
  }

  return (
    <GrammarianShell title="Review Queue">
      <div className="space-y-5">
        <Card className="overflow-x-auto border-[#bfe9c5] bg-[#f0fff4] p-4">
          <div className="flex min-w-[760px] divide-x divide-[#bfe9c5]">
            {[
              ["For Review", forReview, "Awaiting check"],
              ["Reviewed", reviewed, "Grammar completed"],
              ["Certificates", certificates, "Issued"],
              ["Visible", filteredItems.length, "Filtered records"],
            ].map(([label, value, caption]) => (
              <div key={label} className="flex-1 px-4 py-2">
                <p className="text-[11px] font-semibold text-[#4f6f58]">
                  {label}
                </p>
                <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
                  <p className="text-2xl font-semibold leading-none text-[#203028]">
                    {value}
                  </p>
                  <p className="pb-0.5 text-[11px] text-[#59645d]">
                    {caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px_110px]">
            <label className="text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search group, project, document..."
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Review Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                <option>For Grammar Review</option>
                <option>Under Review</option>
                <option>Certified</option>
                <option>Returned for Revision</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
              }}
              className="mt-5 h-10 rounded-lg border border-[#dfe8df] bg-white px-3 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Reset
            </button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-[#edf2ec] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#203028]">
                Manuscript Review Board
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Compact list of final manuscripts needing grammar action.
              </p>
            </div>

            <p className="text-xs font-semibold text-[#7b877f]">
              {filteredItems.length} record
              {filteredItems.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {filteredItems.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#7b877f]">
                No manuscripts match the selected filters.
              </p>
            ) : (
                filteredItems.map((item) => {
                  const expanded = expandedId === item.id;

                  return (
                <div key={item.id} className="px-5 py-4">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#203028]">
                          {item.groupName}
                        </p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                            item.reviewStatus,
                          )}`}
                        >
                          {item.reviewStatus}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-[#59645d]">
                        {item.projectTitle}
                      </p>

                      <p className="mt-1 text-xs text-[#7b877f]">
                        {item.course} {item.section} / Adviser: {item.adviser}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        Sent by {item.sentBy} on {item.sentAt} / Assigned to{" "}
                        {item.assignedGrammarian}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#7b877f]">
                        Document
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-[#203028]">
                        {item.documentTitle}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        Manuscript: {item.manuscriptFile}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${certificateClasses(
                          item.certificateStatus,
                        )}`}
                      >
                        {item.certificateStatus}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : item.id)
                        }
                        className="rounded-lg bg-[#202823] px-3 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
                      >
                        {expanded ? "Close" : "Open"}
                      </button>

                      <button
                        type="button"
                        onClick={() => startReview(item.id)}
                        disabled={
                          item.reviewStatus === "Certified" ||
                          item.reviewStatus === "Returned for Revision"
                        }
                        className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Start Review
                      </button>

                      <button
                        type="button"
                        onClick={() => setCertificateEditingId(item.id)}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Edit Certificate
                      </button>

                      <button
                        type="button"
                        onClick={() => certify(item.id)}
                        disabled={item.reviewStatus === "Certified"}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Certify
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-4 rounded-xl border border-[#dfe8df] bg-[#fbfdfb] p-4">
                      <div className="grid gap-3 lg:grid-cols-3">
                        <DetailBox
                          label="Project"
                          value={item.projectTitle}
                        />
                        <DetailBox
                          label="Certificate"
                          value={item.certificateNumber || "Not issued"}
                        />
                        <DetailBox
                          label="Returned to Dean"
                          value={item.issuedAt || "Pending"}
                        />
                      </div>

                      <label className="mt-4 block text-xs font-semibold text-[#59645d]">
                        Grammar feedback / certification note
                        <textarea
                          value={feedbackDrafts[item.id] || ""}
                          onChange={(event) =>
                            setFeedbackDrafts((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder="Write grammar comments, revision notes, or certification remarks..."
                          className="mt-2 min-h-28 w-full resize-none rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                        />
                      </label>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => returnForRevision(item.id)}
                          disabled={item.reviewStatus === "Certified"}
                          className="rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Return for Revision
                        </button>

                        <button
                          type="button"
                          onClick={() => certify(item.id)}
                          disabled={item.reviewStatus === "Certified"}
                          className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Generate Certification and Send to Dean
                        </button>
                      </div>
                    </div>
                  )}

                  {certificateEditingId === item.id && (
                    <div className="mt-4 rounded-[32px] bg-white p-8 shadow-[0_10px_35px_rgba(31,42,36,0.12)]">
                      <div className="mx-auto max-w-[820px]">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.36em] text-[#7b877f]">
                              Certificate Preview
                            </p>
                            <h3 className="mt-3 text-2xl font-semibold text-[#203028]">
                              Certificate of Editing (F-RPO-09)
                            </h3>
                            <p className="mt-2 text-sm text-[#59645d]">
                              The certificate is rendered as a document page, not a form.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCertificateEditingId(null)}
                            className="text-[#4d6c52] hover:text-[#203028]"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="mt-8 overflow-auto rounded-xl bg-[#e9eee9] px-4 py-8">
                          <HighlightCommentEditor
                            key={`certificate-editor-${item.id}-${certificateDrafts[item.id]?.bodyHtml ? 'saved' : 'new'}`}
                            ref={certificateEditorRef}
                            content={certificateDrafts[item.id]?.bodyHtml || buildCertificateHtml(certificateDrafts[item.id])}
                            fontSize="16"
                            documentId={item.id}
                            version="v1"
                            onInput={() => {}}
                            onFocus={() => {}}
                            onKeyDown={() => {}}
                          />
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setCertificateEditingId(null)}
                            className="rounded-lg border border-[#d1e4d3] bg-white px-4 py-2 text-xs font-semibold text-[#4d6c52] hover:bg-[#f7f9f6]"
                          >
                            Done Editing
                          </button>
                          <button
                            type="button"
                            onClick={() => certify(item.id)}
                            className="rounded-lg bg-[#4d6c52] px-4 py-2 text-xs font-semibold text-white hover:bg-[#203028]"
                          >
                            Save & Send Certificate to Dean
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          </div>
        </Card>
      </div>
    </GrammarianShell>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-[11px] font-semibold text-[#7b877f]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#203028]">
        {value}
      </p>
    </div>
  );
}

