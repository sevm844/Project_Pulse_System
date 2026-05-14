import type { DocumentStatus } from "../../_data/mockStudentData";

export type StoredRevision = {
  id: number;
  revisionNumber: number;
  version: string;
  editedBy: string;
  editedAt: string;
  chapter: string;
  beforeContent: string;
  afterContent: string;
  revisionNote: string;
  uploadedFileName?: string;
};

export type StoredDocument = {
  id: number;
  title: string;
  documentType: string;
  currentVersion: string;
  currentContent: string;
  createdAt: string;
  updatedAt: string;
  status: DocumentStatus;
  reviewer: string;
  notes?: string;
  latestUploadedFileName?: string;
  revisions: StoredRevision[];
};

const DOCUMENT_STORAGE_KEY = "project-pulse-student-documents";

const defaultDocuments: StoredDocument[] = [
  {
    id: 1,
    title: "Chapter 1: Introduction",
    documentType: "Chapter 1",
    currentVersion: "v2.1",
    currentContent: `
      <h1>Chapter 1: Introduction</h1>
      <p>Background of the study, problem statement, objectives, and significance.</p>
      <h2>Background of the Study</h2>
      <p>Start writing your introduction here.</p>
    `,
    createdAt: "2026-05-01T08:00:00.000Z",
    updatedAt: "2026-05-05T08:00:00.000Z",
    status: "Approved",
    reviewer: "Adviser",
    revisions: [
      {
        id: 1,
        revisionNumber: 1,
        version: "v2.1",
        editedBy: "Student Name",
        editedAt: "May 5, 2026",
        chapter: "Chapter 1",
        beforeContent: "",
        afterContent: `
          <h1>Chapter 1: Introduction</h1>
          <p>Background of the study, problem statement, objectives, and significance.</p>
        `,
        revisionNote: "Initial chapter workspace",
      },
    ],
  },
  {
    id: 2,
    title: "Chapter 2: Review of Related Literature",
    documentType: "Chapter 2",
    currentVersion: "v1.3",
    currentContent: `
      <h1>Chapter 2: Review of Related Literature</h1>
      <p>Synthesis of related studies and theoretical framework.</p>
      <h2>Related Literature</h2>
      <p>Start writing your review of related literature here.</p>
    `,
    createdAt: "2026-05-02T08:00:00.000Z",
    updatedAt: "2026-05-03T08:00:00.000Z",
    status: "Under Review",
    reviewer: "Adviser",
    revisions: [
      {
        id: 2,
        revisionNumber: 1,
        version: "v1.3",
        editedBy: "Student Name",
        editedAt: "May 3, 2026",
        chapter: "Chapter 2",
        beforeContent: "",
        afterContent: `
          <h1>Chapter 2: Review of Related Literature</h1>
          <p>Synthesis of related studies and theoretical framework.</p>
        `,
        revisionNote: "Initial chapter workspace",
      },
    ],
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getStoredDocuments() {
  if (!canUseStorage()) return defaultDocuments;

  const saved = window.localStorage.getItem(DOCUMENT_STORAGE_KEY);

  if (!saved) {
    saveStoredDocuments(defaultDocuments);
    return defaultDocuments;
  }

  return JSON.parse(saved) as StoredDocument[];
}

export function saveStoredDocuments(documents: StoredDocument[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(documents));
}

export function getStoredDocument(id: number) {
  return getStoredDocuments().find((document) => document.id === id) || null;
}

export function saveStoredDocument(document: StoredDocument) {
  const documents = getStoredDocuments();
  const exists = documents.some((item) => item.id === document.id);

  const nextDocuments = exists
    ? documents.map((item) => (item.id === document.id ? document : item))
    : [document, ...documents];

  saveStoredDocuments(nextDocuments);

  return document;
}
