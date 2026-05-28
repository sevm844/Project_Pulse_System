"use client";

import { useMemo, useState } from "react";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";

type VersionStatus = "Approved" | "Under Review" | "Needs Revision";

type DocumentVersion = {
  id: string;
  groupName: string;
  studentName: string;
  course: string;
  section: string;
  adviser: string;
  documentTitle: string;
  version: string;
  submittedAt: string;
  submittedBy: string;
  fileName: string;
  fileSize: string;
  status: VersionStatus;
  summary: string;
  content: string[];
  changes: string[];
};

type WordChange = {
  word: string;
  type: "same" | "added" | "removed";
};

type ParagraphChange = {
  id: string;
  type: "unchanged" | "added" | "removed" | "revised";
  previousText?: string;
  currentText?: string;
  previousWords?: WordChange[];
  currentWords?: WordChange[];
};

type ComparisonAnalysis = {
  unchanged: number;
  added: number;
  removed: number;
  revised: number;
  items: ParagraphChange[];
};

const courseSections: Record<string, string[]> = {
  BSIT: ["4A", "4B", "4C", "4D"],
  BSIS: ["4A", "4B"],
  BSCS: ["4A", "4B", "4C"],
  BLIS: ["4A", "4B"],
  ACT: ["2A", "2B"],
};

const documentVersions: DocumentVersion[] = [
  {
    id: "pp-proposal-v1",
    groupName: "Project Pulse",
    studentName: "Maria Santos",
    course: "BSIT",
    section: "4A",
    adviser: "Anna Cruz",
    documentTitle: "Project Proposal",
    version: "v1.0",
    submittedAt: "May 10, 2026, 8:40 AM",
    submittedBy: "Maria Santos",
    fileName: "project-pulse-proposal-v1.pdf",
    fileSize: "2.8 MB",
    status: "Needs Revision",
    summary: "Initial proposal with adviser comments pending.",
    content: [
      "The system monitors student capstone submissions and adviser feedback.",
      "Chapter 2 includes local related systems but needs stronger international references.",
      "The methodology uses a descriptive-developmental design with prototype evaluation.",
      "The timeline ends with final documentation after beta defense.",
    ],
    changes: [
      "Missing scope limitations",
      "References need updated publication dates",
      "Timeline lacks final clearance step",
    ],
  },
  {
    id: "pp-proposal-v2",
    groupName: "Project Pulse",
    studentName: "Maria Santos",
    course: "BSIT",
    section: "4A",
    adviser: "Anna Cruz",
    documentTitle: "Project Proposal",
    version: "v2.0",
    submittedAt: "May 16, 2026, 10:15 AM",
    submittedBy: "Maria Santos",
    fileName: "project-pulse-proposal-v2.pdf",
    fileSize: "3.1 MB",
    status: "Under Review",
    summary: "Updated proposal with revised scope, references, and clearance timeline.",
    content: [
      "The system monitors student capstone submissions, adviser feedback, and dean-level approval tracking.",
      "Chapter 2 now includes local and international related systems published from 2021 to 2025.",
      "The methodology uses a descriptive-developmental design with prototype evaluation and stakeholder validation.",
      "The timeline ends with final documentation, records clearance, and archive submission.",
    ],
    changes: [
      "Added dean-level approval tracking",
      "Updated related literature coverage",
      "Added stakeholder validation",
      "Added records clearance and archive submission",
    ],
  },
  {
    id: "pp-final-v1",
    groupName: "Project Pulse",
    studentName: "Maria Santos",
    course: "BSIT",
    section: "4A",
    adviser: "Anna Cruz",
    documentTitle: "Final Manuscript",
    version: "v1.0",
    submittedAt: "May 18, 2026, 1:45 PM",
    submittedBy: "Juan Dela Cruz",
    fileName: "project-pulse-final-manuscript-v1.pdf",
    fileSize: "5.4 MB",
    status: "Under Review",
    summary: "Initial final manuscript package for dean review.",
    content: [
      "The final manuscript consolidates all capstone chapters and testing results.",
      "The recommendations include system adoption for student submission tracking.",
      "Appendices include survey results, screenshots, and approval documentation.",
    ],
    changes: ["Initial final manuscript upload"],
  },
  {
    id: "cc-proposal-v1",
    groupName: "CodeCraft",
    studentName: "Luis Mendoza",
    course: "BSIT",
    section: "4B",
    adviser: "Anna Cruz",
    documentTitle: "Project Proposal",
    version: "v1.0",
    submittedAt: "May 11, 2026, 9:20 AM",
    submittedBy: "Luis Mendoza",
    fileName: "codecraft-proposal-v1.pdf",
    fileSize: "2.2 MB",
    status: "Needs Revision",
    summary: "Proposal requires clearer testing scope and adviser alignment.",
    content: [
      "The proposed tool supports collaborative code review for student teams.",
      "Testing is planned with selected BSIT students.",
      "The scope currently includes web and mobile access.",
    ],
    changes: ["Testing scope is too broad", "Mobile access needs justification"],
  },
  {
    id: "cc-proposal-v2",
    groupName: "CodeCraft",
    studentName: "Luis Mendoza",
    course: "BSIT",
    section: "4B",
    adviser: "Anna Cruz",
    documentTitle: "Project Proposal",
    version: "v2.0",
    submittedAt: "May 17, 2026, 3:05 PM",
    submittedBy: "Luis Mendoza",
    fileName: "codecraft-proposal-v2.pdf",
    fileSize: "2.6 MB",
    status: "Under Review",
    summary: "Updated proposal narrows scope and improves test plan.",
    content: [
      "The proposed tool supports collaborative code review for student teams in a web-based workspace.",
      "Testing is planned with selected BSIT students and two faculty advisers.",
      "The revised scope focuses on web access, document comments, and review status tracking.",
    ],
    changes: ["Narrowed platform scope", "Added faculty advisers to testing"],
  },
  {
    id: "ax-method-v1",
    groupName: "AlgorithmX",
    studentName: "Jessa Ramos",
    course: "BSCS",
    section: "4A",
    adviser: "Marco Reyes",
    documentTitle: "Chapter 3: Methodology",
    version: "v1.0",
    submittedAt: "May 12, 2026, 2:20 PM",
    submittedBy: "Jessa Ramos",
    fileName: "algorithmx-chapter-3-v1.pdf",
    fileSize: "1.9 MB",
    status: "Approved",
    summary: "Methodology chapter approved after adviser review.",
    content: [
      "The research uses a quantitative evaluation framework.",
      "Testing includes accuracy, response time, and usability scores.",
      "Respondents include students, advisers, and panelists.",
    ],
    changes: ["Approved baseline version"],
  },
  {
    id: "lib-cert-v1",
    groupName: "LibraCore",
    studentName: "Elaine Torres",
    course: "BLIS",
    section: "4A",
    adviser: "Elena Rivera",
    documentTitle: "Grammar Certificate",
    version: "v1.0",
    submittedAt: "May 14, 2026, 4:10 PM",
    submittedBy: "Elaine Torres",
    fileName: "libracore-grammar-certificate-v1.pdf",
    fileSize: "820 KB",
    status: "Approved",
    summary: "Grammar certificate accepted for final requirements.",
    content: [
      "The grammar certificate confirms manuscript review completion.",
      "The certificate references the final manuscript title and group members.",
    ],
    changes: ["Validated certificate upload"],
  },
  {
    id: "arch-final-v1",
    groupName: "ArchiveLink",
    studentName: "Nico Villanueva",
    course: "BSIS",
    section: "4A",
    adviser: "Carla Lim",
    documentTitle: "Final Manuscript",
    version: "v1.0",
    submittedAt: "May 15, 2026, 11:30 AM",
    submittedBy: "Nico Villanueva",
    fileName: "archivelink-final-v1.pdf",
    fileSize: "4.9 MB",
    status: "Needs Revision",
    summary: "Final manuscript requires updated appendices.",
    content: [
      "The manuscript presents an archive retrieval system for departmental records.",
      "Appendix B is missing updated screenshots from the beta release.",
      "The recommendation section needs clearer deployment guidance.",
    ],
    changes: ["Missing updated screenshots", "Deployment guidance incomplete"],
  },
  {
    id: "tech-pack-v1",
    groupName: "TechTrack",
    studentName: "Paolo Garcia",
    course: "ACT",
    section: "2A",
    adviser: "Neria Macaraig",
    documentTitle: "Final Submission Package",
    version: "v1.0",
    submittedAt: "May 15, 2026, 5:25 PM",
    submittedBy: "Paolo Garcia",
    fileName: "techtrack-final-package-v1.zip",
    fileSize: "18.7 MB",
    status: "Under Review",
    summary: "Compressed final package submitted for clearance.",
    content: [
      "The package contains final manuscript, source code, approval sheets, and certificates.",
      "The README includes setup notes and account credentials for validation.",
    ],
    changes: ["Initial final package submission"],
  },
];

function actionButtonClass(variant: "primary" | "neutral" | "danger") {
  if (variant === "primary") return "bg-[#49a95a] text-white hover:bg-[#3f964f]";
  if (variant === "danger") {
    return "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100";
  }

  return "border border-[#dfe8df] bg-white text-[#59645d] hover:bg-[#f3f7f1]";
}

function VersionActions({ onView }: { onView?: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        ["View File", "neutral"],
        ["Download", "neutral"],
        ["Approve", "primary"],
        ["Request Revision", "danger"],
      ].map(([label, variant]) => (
        <button
          key={label}
          type="button"
          onClick={label === "View File" ? onView : undefined}
          className={`rounded-full px-3 py-2 text-xs font-semibold ${actionButtonClass(
            variant as "primary" | "neutral" | "danger",
          )}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function tokenize(text: string) {
  return text.match(/\S+/g) || [];
}

function buildWordDiff(previousText: string, currentText: string) {
  const previousWords = tokenize(previousText);
  const currentWords = tokenize(currentText);
  const table = Array.from({ length: previousWords.length + 1 }, () =>
    Array(currentWords.length + 1).fill(0) as number[],
  );

  for (let i = previousWords.length - 1; i >= 0; i -= 1) {
    for (let j = currentWords.length - 1; j >= 0; j -= 1) {
      table[i][j] =
        previousWords[i] === currentWords[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const previousDiff: WordChange[] = [];
  const currentDiff: WordChange[] = [];
  let i = 0;
  let j = 0;

  while (i < previousWords.length && j < currentWords.length) {
    if (previousWords[i] === currentWords[j]) {
      previousDiff.push({ word: previousWords[i], type: "same" });
      currentDiff.push({ word: currentWords[j], type: "same" });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      previousDiff.push({ word: previousWords[i], type: "removed" });
      i += 1;
    } else {
      currentDiff.push({ word: currentWords[j], type: "added" });
      j += 1;
    }
  }

  while (i < previousWords.length) {
    previousDiff.push({ word: previousWords[i], type: "removed" });
    i += 1;
  }

  while (j < currentWords.length) {
    currentDiff.push({ word: currentWords[j], type: "added" });
    j += 1;
  }

  return { previousDiff, currentDiff };
}

function analyzeVersions(
  previousVersion?: DocumentVersion,
  currentVersion?: DocumentVersion,
): ComparisonAnalysis {
  if (!previousVersion || !currentVersion) {
    return { unchanged: 0, added: 0, removed: 0, revised: 0, items: [] };
  }

  const maxLength = Math.max(
    previousVersion.content.length,
    currentVersion.content.length,
  );
  const analysis: ComparisonAnalysis = {
    unchanged: 0,
    added: 0,
    removed: 0,
    revised: 0,
    items: [],
  };

  for (let index = 0; index < maxLength; index += 1) {
    const previousText = previousVersion.content[index];
    const currentText = currentVersion.content[index];

    if (previousText && currentText && previousText === currentText) {
      analysis.unchanged += 1;
      analysis.items.push({
        id: `same-${index}`,
        type: "unchanged",
        previousText,
        currentText,
      });
      continue;
    }

    if (previousText && currentText) {
      const { previousDiff, currentDiff } = buildWordDiff(
        previousText,
        currentText,
      );

      analysis.revised += 1;
      analysis.items.push({
        id: `revised-${index}`,
        type: "revised",
        previousText,
        currentText,
        previousWords: previousDiff,
        currentWords: currentDiff,
      });
      continue;
    }

    if (currentText) {
      analysis.added += 1;
      analysis.items.push({
        id: `added-${index}`,
        type: "added",
        currentText,
        currentWords: tokenize(currentText).map((word) => ({
          word,
          type: "added",
        })),
      });
      continue;
    }

    if (previousText) {
      analysis.removed += 1;
      analysis.items.push({
        id: `removed-${index}`,
        type: "removed",
        previousText,
        previousWords: tokenize(previousText).map((word) => ({
          word,
          type: "removed",
        })),
      });
    }
  }

  return analysis;
}

export default function DeanDocumentVersionsPage() {
  const [selectedCourse, setSelectedCourse] = useState("BSIT");
  const [selectedSection, setSelectedSection] = useState("4A");
  const [selectedGroup, setSelectedGroup] = useState("Project Pulse");
  const [selectedDocument, setSelectedDocument] = useState("Project Proposal");
  const [previousId, setPreviousId] = useState("pp-proposal-v1");
  const [currentId, setCurrentId] = useState("pp-proposal-v2");

  const courseOptions = Object.keys(courseSections);
  const sectionOptions = courseSections[selectedCourse] || [];

  const groupsInSection = useMemo(
    () =>
      Array.from(
        new Set(
          documentVersions
            .filter(
              (document) =>
                document.course === selectedCourse &&
                document.section === selectedSection,
            )
            .map((document) => document.groupName),
        ),
      ),
    [selectedCourse, selectedSection],
  );

  const documentsInGroup = useMemo(
    () =>
      Array.from(
        new Set(
          documentVersions
            .filter((document) => document.groupName === selectedGroup)
            .map((document) => document.documentTitle),
        ),
      ),
    [selectedGroup],
  );

  const selectedVersions = useMemo(
    () =>
      documentVersions.filter(
        (document) =>
          document.course === selectedCourse &&
          document.section === selectedSection &&
          document.groupName === selectedGroup &&
          document.documentTitle === selectedDocument,
      ),
    [selectedCourse, selectedDocument, selectedGroup, selectedSection],
  );

  const scopedSectionVersions = documentVersions.filter(
    (document) =>
      document.course === selectedCourse && document.section === selectedSection,
  );

  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null);

  const previousVersion =
    selectedVersions.find((document) => document.id === previousId) ||
    selectedVersions[0];
  const currentVersion =
    selectedVersions.find((document) => document.id === currentId) ||
    selectedVersions[selectedVersions.length - 1];
  const comparisonAnalysis = useMemo(
    () => analyzeVersions(previousVersion, currentVersion),
    [currentVersion, previousVersion],
  );

  function applySelection(input: {
    course?: string;
    section?: string;
    group?: string;
    document?: string;
  }) {
    const nextCourse = input.course || selectedCourse;
    const nextSection =
      input.section ||
      (input.course ? courseSections[nextCourse][0] : selectedSection);

    const nextGroups = Array.from(
      new Set(
        documentVersions
          .filter(
            (document) =>
              document.course === nextCourse && document.section === nextSection,
          )
          .map((document) => document.groupName),
      ),
    );
    const nextGroup = input.group || nextGroups[0] || "";

    const nextDocuments = Array.from(
      new Set(
        documentVersions
          .filter((document) => document.groupName === nextGroup)
          .map((document) => document.documentTitle),
      ),
    );
    const nextDocument = input.document || nextDocuments[0] || "";

    const nextVersions = documentVersions.filter(
      (document) =>
        document.course === nextCourse &&
        document.section === nextSection &&
        document.groupName === nextGroup &&
        document.documentTitle === nextDocument,
    );

    setSelectedCourse(nextCourse);
    setSelectedSection(nextSection);
    setSelectedGroup(nextGroup);
    setSelectedDocument(nextDocument);
    setPreviousId(nextVersions[0]?.id || "");
    setCurrentId(nextVersions[nextVersions.length - 1]?.id || "");
  }

  return (
    <DeanShell title="Document Version Control">
      <div className="space-y-5">
        <section className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-[0_16px_45px_rgba(32,48,40,0.05)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b877f]">
                Dean Review Workspace
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#203028]">
                Document Version Control and Comparison
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
                Narrow the records by course, section, group, and document so
                the dean only sees the versions that matter.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
              <SummaryTile label="Courses" value={courseOptions.length} />
              <SummaryTile
                label="Groups in Section"
                value={groupsInSection.length}
              />
              <SummaryTile label="Versions" value={selectedVersions.length} />
            </div>
          </div>
        </section>

        <Card className="p-5">
          <div className="grid gap-4 lg:grid-cols-4">
            <FilterSelect
              label="1. Course"
              value={selectedCourse}
              options={courseOptions}
              onChange={(value) => applySelection({ course: value })}
            />
            <FilterSelect
              label="2. Section"
              value={selectedSection}
              options={sectionOptions}
              onChange={(value) => applySelection({ section: value })}
            />
            <FilterSelect
              label="3. Group"
              value={selectedGroup}
              options={groupsInSection}
              onChange={(value) => applySelection({ group: value })}
            />
            <FilterSelect
              label="4. Document"
              value={selectedDocument}
              options={documentsInGroup}
              onChange={(value) => applySelection({ document: value })}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[#59645d]">
            <span className="rounded-full bg-[#f8faf7] px-3 py-1.5">
              {selectedCourse}
            </span>
            <span className="rounded-full bg-[#f8faf7] px-3 py-1.5">
              Section {selectedSection}
            </span>
            <span className="rounded-full bg-[#f8faf7] px-3 py-1.5">
              {selectedGroup}
            </span>
            <span className="rounded-full bg-[#f8faf7] px-3 py-1.5">
              {selectedDocument}
            </span>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <div className="border-b border-[#edf2ec] px-5 py-4">
              <h3 className="text-lg font-semibold text-[#203028]">
                Groups
              </h3>
              <p className="mt-1 text-sm text-[#7b877f]">
                {selectedCourse} {selectedSection}
              </p>
            </div>
            <div className="max-h-[430px] overflow-y-auto p-3">
              {groupsInSection.length === 0 ? (
                <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                  No groups have submitted documents in this section yet.
                </p>
              ) : (
                groupsInSection.map((group) => {
                  const groupVersions = scopedSectionVersions.filter(
                    (document) => document.groupName === group,
                  );
                  const isSelected = selectedGroup === group;

                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => applySelection({ group })}
                      className={`mb-2 w-full rounded-xl px-4 py-3 text-left transition ${
                        isSelected
                          ? "bg-[#d7f7d8] text-[#203028]"
                          : "bg-white text-[#59645d] hover:bg-[#f8faf7]"
                      }`}
                    >
                      <p className="text-sm font-semibold">{group}</p>
                      <p className="mt-1 text-xs">
                        {groupVersions.length} submitted version
                        {groupVersions.length === 1 ? "" : "s"}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#edf2ec] px-5 py-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#203028]">
                  Version History
                </h3>
                <p className="mt-1 text-sm text-[#7b877f]">
                  {selectedGroup} • {selectedDocument}
                </p>
              </div>
              <StatusBadge status={currentVersion?.status || "Under Review"} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#f8faf7] text-xs uppercase tracking-[0.08em] text-[#7b877f]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Version</th>
                    <th className="px-5 py-3 font-semibold">Submitted</th>
                    <th className="px-5 py-3 font-semibold">File</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2ec]">
                  {selectedVersions.map((version) => (
                    <tr key={version.id} className="align-top">
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#eefaf0] px-3 py-1 text-xs font-semibold text-[#4f8f58]">
                          {version.version}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#203028]">
                          {version.submittedAt}
                        </p>
                        <p className="mt-1 text-xs text-[#7b877f]">
                          by {version.submittedBy}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#203028]">
                          {version.fileName}
                        </p>
                        <p className="mt-1 text-xs text-[#7b877f]">
                          {version.fileSize}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={version.status} />
                      </td>
                      <td className="px-5 py-4">
                        <VersionActions onView={() => setPreviewVersion(version)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {previousVersion && currentVersion && (
          <Card className="p-5">
            <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#203028]">
                    Compare Selected Versions
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#59645d]">
                    Pick a baseline and a new version. The system compares the
                    extracted text and marks added, removed, revised, and
                    unchanged content.
                  </p>
                </div>

                <FilterSelect
                  label="Previous Version"
                  value={previousVersion.id}
                  options={selectedVersions.map((version) => version.id)}
                  optionLabels={Object.fromEntries(
                    selectedVersions.map((version) => [
                      version.id,
                      `${version.version} - ${version.submittedAt}`,
                    ]),
                  )}
                  onChange={setPreviousId}
                />
                <FilterSelect
                  label="Current/New Version"
                  value={currentVersion.id}
                  options={selectedVersions.map((version) => version.id)}
                  optionLabels={Object.fromEntries(
                    selectedVersions.map((version) => [
                      version.id,
                      `${version.version} - ${version.submittedAt}`,
                    ]),
                  )}
                  onChange={setCurrentId}
                />

                <div className="rounded-xl bg-[#f8faf7] p-4 text-sm leading-6 text-[#59645d]">
                  <p className="font-semibold text-[#203028]">
                    {previousVersion.studentName}
                  </p>
                  <p>{selectedCourse} {selectedSection}</p>
                  <p>Adviser: {previousVersion.adviser}</p>
                </div>

                <div className="rounded-xl border border-[#dfe8df] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7b877f]">
                    System Analysis
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <AnalysisTile label="Added" value={comparisonAnalysis.added} />
                    <AnalysisTile
                      label="Revised"
                      value={comparisonAnalysis.revised}
                    />
                    <AnalysisTile
                      label="Removed"
                      value={comparisonAnalysis.removed}
                    />
                    <AnalysisTile
                      label="Unchanged"
                      value={comparisonAnalysis.unchanged}
                    />
                  </div>
                  <p className="mt-4 text-xs leading-5 text-[#59645d]">
                    In production, uploaded PDF/DOCX files are converted into
                    readable text first, then this comparison result is shown to
                    the Dean.
                  </p>
                </div>
              </aside>

              <div className="grid gap-5 2xl:grid-cols-2">
                <ComparisonPanel
                  label="Previous Version"
                  tone="previous"
                  version={previousVersion}
                  analysis={comparisonAnalysis}
                  onView={() => setPreviewVersion(previousVersion)}
                />
                <ComparisonPanel
                  label="Current/New Version"
                  tone="current"
                  version={currentVersion}
                  analysis={comparisonAnalysis}
                  onView={() => setPreviewVersion(currentVersion)}
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      {previewVersion && (
        <div className="fixed inset-0 z-50 bg-[#d0d5cf]">
          <div className="flex h-full w-full flex-col">
            <div className="border-b border-[#bcc5bb] bg-white px-6 py-4 shadow-sm">
              <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b877f]">
                    Document Viewer
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-[#203028]">
                    {previewVersion.documentTitle} {previewVersion.version}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewVersion(null)}
                  className="rounded-full border border-[#dfe8df] bg-white px-4 py-2 text-sm font-semibold text-[#59645d] shadow-sm hover:bg-[#f8faf7]"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#d0d5cf] p-8 flex justify-center">
              <div className="w-[850px] min-h-[1400px]">
                <div className="mx-auto min-h-full rounded-[32px] border border-[#dfe8df] bg-[#fbfdf9] px-8 py-10 shadow-[0_30px_90px_rgba(15,23,18,0.08)]">
                  <div className="mx-auto min-h-[1280px] max-w-[720px] rounded-[24px] border border-[#e6ece4] bg-white px-14 py-14 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
                    <div className="mb-12 border-b-2 border-[#e8efe7] pb-12">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#7b877f]">
                        {previewVersion.documentTitle}
                      </p>
                      <h1 className="mt-6 text-5xl font-bold text-[#203028] leading-tight">
                        {previewVersion.documentTitle}
                      </h1>
                      <p className="mt-6 text-base leading-8 text-[#59645d]">
                        <strong>Submitted by:</strong> {previewVersion.submittedBy} on {previewVersion.submittedAt}
                      </p>
                      <p className="mt-4 text-base leading-8 text-[#59645d]">
                        <strong>Group:</strong> {previewVersion.groupName} | <strong>Adviser:</strong> {previewVersion.adviser}
                      </p>
                      <p className="mt-4 text-base leading-8 text-[#59645d]">
                        <strong>Student:</strong> {previewVersion.studentName} | <strong>Course:</strong> {previewVersion.course} {previewVersion.section}
                      </p>
                    </div>

                    <div className="space-y-10 text-[#222f24] pb-20">
                      {previewVersion.content.map((paragraph, index) => (
                        <p key={index} className="text-lg leading-9">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DeanShell>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] px-4 py-3">
      <p className="text-xs font-semibold text-[#7b877f]">{label}</p>
      <p className="mt-1 text-2xl font-semibold leading-none text-[#203028]">
        {value}
      </p>
    </div>
  );
}

function AnalysisTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[#f8faf7] px-3 py-2">
      <p className="text-[11px] font-semibold text-[#7b877f]">{label}</p>
      <p className="mt-1 text-xl font-semibold leading-none text-[#203028]">
        {value}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  optionLabels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  optionLabels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-semibold text-[#203028]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-[#dfe8df] bg-white px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels?.[option] || option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ComparisonPanel({
  label,
  tone,
  version,
  analysis,
  onView,
}: {
  label: string;
  tone: "previous" | "current";
  version: DocumentVersion;
  analysis: ComparisonAnalysis;
  onView?: () => void;
}) {
  const visibleItems = analysis.items.filter((item) =>
    tone === "previous" ? item.type !== "added" : item.type !== "removed",
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dfe8df] bg-white">
      <div
        className={`border-b px-5 py-4 ${
          tone === "current"
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-[0.16em] ${
            tone === "current" ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {label}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-[#203028]">
          {version.documentTitle} {version.version}
        </h3>
        <p className="mt-1 text-xs text-[#59645d]">
          Submitted {version.submittedAt}
        </p>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={version.status} />
          <p className="text-xs font-semibold text-[#7b877f]">
            {version.fileSize}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7b877f]">
            Summary
          </p>
          <p className="mt-2 text-sm leading-6 text-[#203028]">
            {version.summary}
          </p>
        </div>

        <div className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7b877f]">
            System-Highlighted Text
          </p>
          <div className="mt-4 space-y-3">
            {visibleItems.map((item) => (
              <HighlightedParagraph key={`${tone}-${item.id}`} item={item} tone={tone} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7b877f]">
            {tone === "current" ? "New / Updated Items" : "Previous Notes"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {version.changes.map((change) => (
              <span
                key={change}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  tone === "current"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {change}
              </span>
            ))}
          </div>
        </div>

        <VersionActions onView={onView} />
      </div>
    </div>
  );
}

function HighlightedParagraph({
  item,
  tone,
}: {
  item: ParagraphChange;
  tone: "previous" | "current";
}) {
  const words = tone === "previous" ? item.previousWords : item.currentWords;
  const fallbackText = tone === "previous" ? item.previousText : item.currentText;
  const statusLabel =
    item.type === "unchanged"
      ? "Unchanged"
      : item.type === "revised"
        ? "Revised"
        : item.type === "added"
          ? "Added"
          : "Removed";

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm leading-6 ${
        item.type === "unchanged"
          ? "border-[#edf2ec] bg-white text-[#203028]"
          : tone === "current"
            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
            : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7b877f]">
        {statusLabel}
      </p>
      <p>
        {words
          ? words.map((word, index) => (
              <span
                key={`${word.word}-${index}`}
                className={
                  word.type === "added"
                    ? "rounded bg-emerald-200/70 px-1 font-semibold text-emerald-950"
                    : word.type === "removed"
                      ? "rounded bg-rose-100 px-1 font-semibold text-rose-800 line-through"
                      : ""
                }
              >
                {word.word}{" "}
              </span>
            ))
          : fallbackText}
      </p>
    </div>
  );
}
