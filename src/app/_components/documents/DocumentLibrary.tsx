"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VersionHistory from "../requirements/VersionHistory";
import { apiFetch, downloadProjectDocuments, downloadSubmission, openSubmissionInTab } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import { formatDate, formatDateTime, toneDot, type StatusTone } from "../../_lib/requirements";

type ApiDocument = {
  submission_id: number;
  project_id: number;
  requirement_id: number;
  requirement_title: string;
  stage: string;
  group_id: number;
  group_name: string;
  course: string;
  section: string;
  file_name: string | null;
  has_file: boolean;
  file_type: string | null;
  can_preview: boolean;
  link_url: string | null;
  version_no: number;
  earlier_versions: number;
  status: "Submitted" | "Needs Revision" | "Approved";
  grammar_status: "Approved" | "Needs Revision" | null;
  submitted_at: string | null;
  submitted_by: string | null;
};

type Role = "Student" | "Adviser" | "Dean";

// A hit inside the text of a submitted manuscript (newest version of each group).
type ManuscriptHit = {
  project_id: number;
  group_id: number;
  group_name: string;
  course: string;
  section: string;
  version_no: number;
  submitted_at: string | null;
  match_count: number;
  snippets: string[];
};

// An adviser has no manuscript side (the Dean's subject), so there is nothing to open for her.
const OPEN_MANUSCRIPT: Partial<Record<Role, (hit: ManuscriptHit) => string>> = {
  Student: () => "/student/manuscript",
  Dean: () => "/dean/manuscripts",
};

const MIN_WORDS_SEARCH = 3;

// The searched words, shown in bold inside a snippet.
function Highlighted({ text, words }: { text: string; words: string }) {
  const needle = words.trim();
  if (!needle) return <>{text}</>;
  // Cut the text at each match without building a pattern from what the person typed.
  const parts: string[] = [];
  const lower = text.toLowerCase();
  const find = needle.toLowerCase();
  let from = 0;
  for (let at = lower.indexOf(find); at !== -1; at = lower.indexOf(find, from)) {
    parts.push(text.slice(from, at), text.slice(at, at + find.length));
    from = at + find.length;
  }
  parts.push(text.slice(from));

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="font-semibold text-[#203028]">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

const statusLook: Record<ApiDocument["status"], { label: string; tone: StatusTone }> = {
  Submitted: { label: "Under review", tone: "waiting" },
  "Needs Revision": { label: "Needs revision", tone: "problem" },
  Approved: { label: "Approved", tone: "done" },
};

const selectClass =
  "rounded-lg border border-[#dfe8df] bg-white px-3 py-1.5 text-xs text-[#59645d] outline-none focus:ring-2 focus:ring-[#d7f7d8]";

// Every file a group has submitted, in one place. Preview PDFs and images without leaving the page.
export default function DocumentLibrary({ role }: { role: Role }) {
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [assignment, setAssignment] = useState("All");
  const [group, setGroup] = useState("All");
  const [zipping, setZipping] = useState(false);
  const [hits, setHits] = useState<ManuscriptHit[]>([]);
  const [hitsLoading, setHitsLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setDocuments(await apiFetch<ApiDocument[]>("/documents"));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load the documents."));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  // Words typed in the search box are also looked for inside the submitted manuscripts (a moment after typing stops).
  useEffect(() => {
    const words = search.trim();
    if (words.length < MIN_WORDS_SEARCH) {
      queueMicrotask(() => {
        setHits([]);
        setHitsLoading(false);
      });
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setHitsLoading(true);
      apiFetch<ManuscriptHit[]>(`/manuscripts/search?q=${encodeURIComponent(words)}`)
        .then((found) => {
          if (!cancelled) setHits(found);
        })
        .catch(() => {
          if (!cancelled) setHits([]);
        })
        .finally(() => {
          if (!cancelled) setHitsLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  // A file opens in a new tab (PDF, picture or Word); other kinds are saved to the computer.
  async function openFile(document: ApiDocument) {
    setError("");

    try {
      await openSubmissionInTab(document.submission_id, document.file_name);
    } catch (err) {
      setError(errorMessage(err, "Unable to open the file."));
    }
  }

  const assignments = useMemo(
    () => [...new Set(documents.map((item) => item.requirement_title))].sort(),
    [documents],
  );

  const groups = useMemo(
    () => [...new Map(documents.map((item) => [item.project_id, item.group_name])).entries()].sort((a, b) => a[1].localeCompare(b[1])),
    [documents],
  );

  const visible = documents.filter((item) => {
    const needle = search.trim().toLowerCase();
    const haystack = `${item.file_name ?? ""} ${item.link_url ?? ""} ${item.requirement_title} ${item.group_name}`.toLowerCase();

    return (
      (!needle || haystack.includes(needle)) &&
      (status === "All" || statusLook[item.status].label === status) &&
      (assignment === "All" || item.requirement_title === assignment) &&
      (group === "All" || String(item.project_id) === group)
    );
  });

  // One group's files can be taken as a ZIP: always for a student, and for staff once a single group is chosen (or the search leaves only one).
  const shownProjects = [...new Set(visible.map((item) => item.project_id))];
  const zipProject = shownProjects.length === 1 && visible.some((item) => item.has_file || item.link_url) ? visible[0] : null;

  async function downloadAll(item: ApiDocument) {
    setZipping(true);
    setError("");

    try {
      await downloadProjectDocuments(item.project_id, item.group_name);
    } catch (err) {
      setError(errorMessage(err, "Unable to download the documents."));
    }

    setZipping(false);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <p className="max-w-xl text-sm leading-6 text-[#7b877f]">
        {role === "Student"
          ? "Every file your group has sent, with its versions and review status."
          : role === "Adviser"
            ? "Every file your groups have sent. Open one to read it, or go to Requirements to review it."
            : "Every file submitted across all groups."}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-[#edf2ec] pb-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={role === "Student" ? "Search files, assignments or words in your manuscript" : "Search files, groups or words inside manuscripts"}
          aria-label="Search documents"
          className="min-w-0 flex-1 rounded-lg border border-[#dfe8df] bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#d7f7d8] sm:max-w-xs"
        />

        {role !== "Student" && groups.length > 1 && (
          <select value={group} onChange={(event) => setGroup(event.target.value)} aria-label="Filter by group" className={selectClass}>
            <option value="All">All groups</option>
            {groups.map(([id, name]) => (
              <option key={id} value={String(id)}>
                {name}
              </option>
            ))}
          </select>
        )}

        <select value={assignment} onChange={(event) => setAssignment(event.target.value)} aria-label="Filter by assignment" className={selectClass}>
          <option value="All">All assignments</option>
          {assignments.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status" className={selectClass}>
          {["All", "Under review", "Needs revision", "Approved"].map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "Any status" : item}
            </option>
          ))}
        </select>

        <p className="ml-auto text-xs text-[#9aa59e]">
          {visible.length} document{visible.length === 1 ? "" : "s"}
        </p>
        {zipProject && (
          <button
            type="button"
            disabled={zipping}
            onClick={() => void downloadAll(zipProject)}
            className="text-xs font-semibold text-[#4f8f58] hover:underline disabled:opacity-60"
          >
            {zipping ? "Preparing the ZIP..." : role === "Student" ? "Download everything (ZIP)" : `Download ${zipProject.group_name} (ZIP)`}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-[#b42318]">
          {error}
        </p>
      )}

      {(hits.length > 0 || hitsLoading) && (
        <section className="mt-4" aria-label="Found inside manuscripts">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7b877f]">
            Found inside manuscripts{hitsLoading ? " · searching..." : ` · ${hits.length} group${hits.length === 1 ? "" : "s"}`}
          </h3>
          <ul className="mt-1 divide-y divide-[#edf2ec]">
            {hits.map((hit) => (
              <li key={hit.project_id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
                  <p className="text-sm font-semibold text-[#203028]">
                    {role === "Student" ? "Your manuscript" : `${hit.group_name} (${hit.course} ${hit.section})`}
                    <span className="ml-2 text-xs font-normal text-[#7b877f]">
                      Version {hit.version_no} · {hit.match_count} {hit.match_count === 1 ? "match" : "matches"}
                      {hit.submitted_at ? ` · ${formatDate(hit.submitted_at)}` : ""}
                    </span>
                  </p>
                  <Link href={(OPEN_MANUSCRIPT[role] ?? OPEN_MANUSCRIPT.Dean)!(hit)} className="text-xs font-semibold text-[#4f8f58] hover:underline">
                    {role === "Student" ? "Open manuscript" : "Open manuscripts"}
                  </Link>
                </div>
                {hit.snippets.map((snippet, index) => (
                  <p key={index} className="mt-1 text-xs leading-5 text-[#59645d]">
                    <Highlighted text={snippet} words={search} />
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </section>
      )}

      {loading && <p className="mt-8 text-sm text-[#7b877f]">Loading...</p>}

      {!loading && visible.length === 0 && !error && hits.length === 0 && (
        <p className="mt-12 text-center text-sm text-[#9aa59e]">
          {documents.length === 0
            ? role === "Student"
              ? "Nothing sent yet. Files you submit in Requirements will appear here."
              : "No files have been submitted yet."
            : "No documents match your search."}
        </p>
      )}

      {visible.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-[#dfe8df] bg-white shadow-[0_6px_18px_rgba(31,42,36,0.05)]">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="bg-[#154530] text-xs font-semibold text-white">
              <tr>
                <th scope="col" className="px-4 py-3">Document</th>
                <th scope="col" className="px-4 py-3">Assignment</th>
                {role !== "Student" && <th scope="col" className="px-4 py-3">Group</th>}
                <th scope="col" className="px-4 py-3">Sent by</th>
                <th scope="col" className="px-4 py-3">Sent on</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            {visible.map((item) => {
              const look = statusLook[item.status];

              return (
                <tbody key={item.submission_id} className="border-t border-[#edf2ec] first:border-t-0">
                  <tr className="align-top">
                    <td className="max-w-[16rem] px-4 py-3.5">
                      <p className="truncate font-semibold text-[#123f2b]" title={(item.has_file ? item.file_name : item.link_url) ?? undefined}>
                        {item.has_file ? item.file_name : item.link_url}
                      </p>
                      <p className="mt-0.5 text-xs text-[#7b877f]">Version {item.version_no}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#203028]">{item.requirement_title}</td>
                    {role !== "Student" && (
                      <td className="px-4 py-3.5 text-xs text-[#203028]">
                        <p className="font-semibold">{item.group_name}</p>
                        <p className="mt-0.5 text-[#7b877f]">{item.course} {item.section}</p>
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-xs text-[#203028]">{item.submitted_by ?? <span className="text-[#9aa59e]">Not recorded</span>}</td>
                    <td className="px-4 py-3.5 text-xs text-[#203028]">{item.submitted_at ? formatDateTime(item.submitted_at) : ""}</td>
                    <td className="px-4 py-3.5 text-xs text-[#59645d]">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${toneDot[look.tone]}`} />
                        {look.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs">
                      <span className="inline-flex items-center gap-4 whitespace-nowrap">
                        {item.has_file && (
                          <button type="button" onClick={() => void openFile(item)} className="font-semibold text-[#4f8f58] hover:underline">
                            Open
                          </button>
                        )}
                        {item.has_file && (
                          <button
                            type="button"
                            onClick={() => void downloadSubmission(item.submission_id, item.file_name).catch((err) => setError(errorMessage(err, "Unable to open the file.")))}
                            className="font-semibold text-[#4f8f58] hover:underline"
                          >
                            Download
                          </button>
                        )}
                        {item.link_url && (
                          <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#4f8f58] hover:underline">
                            Open link
                          </a>
                        )}
                      </span>
                    </td>
                  </tr>
                  {item.version_no > 1 && (
                    <tr>
                      <td colSpan={role === "Student" ? 6 : 7} className="px-4 pb-3 pt-0">
                        <VersionHistory submissionId={item.submission_id} versionNo={item.version_no} />
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
      )}

    </div>
  );
}
