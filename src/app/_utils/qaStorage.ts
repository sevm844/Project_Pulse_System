export type QATestStatus = "Passed" | "Failed" | "Pending" | "Retesting";
export type QATestType = "Functional" | "Performance" | "Bug";
export type BugSeverity = "Low" | "Medium" | "High";

export type QATestCase = {
  id: number;
  type: QATestType;
  module: string;
  testCase: string;
  expectedResult: string;
  actualResult: string;
  status: QATestStatus;
  testedBy: string;
  testedAt: string;
};

export type BugReport = {
  id: number;
  issue: string;
  module: string;
  severity: BugSeverity;
  status: "Open" | "Fixed" | "Retesting" | "Closed";
  fixNote: string;
  reportedAt: string;
};

const QA_TESTS_STORAGE_KEY = "project-pulse-qa-tests";
const QA_BUGS_STORAGE_KEY = "project-pulse-qa-bugs";

const defaultQATests: QATestCase[] = [
  {
    id: 1,
    type: "Functional",
    module: "Authentication",
    testCase: "Login with active account and redirect by role.",
    expectedResult: "User is redirected to the correct dashboard.",
    actualResult: "User logs in and redirects based on role.",
    status: "Passed",
    testedBy: "QA Tester",
    testedAt: "May 10, 2026",
  },
  {
    id: 2,
    type: "Functional",
    module: "Documents",
    testCase: "Upload PDF, DOC, or DOCX document.",
    expectedResult: "System accepts valid file types and rejects invalid files.",
    actualResult: "Valid files are accepted and invalid files show an error.",
    status: "Passed",
    testedBy: "QA Tester",
    testedAt: "May 10, 2026",
  },
  {
    id: 3,
    type: "Functional",
    module: "Final Submission",
    testCase: "Submit final requirements with missing files.",
    expectedResult: "System prevents incomplete final submission.",
    actualResult: "Incomplete submission is marked and blocked.",
    status: "Passed",
    testedBy: "QA Tester",
    testedAt: "May 10, 2026",
  },
  {
    id: 4,
    type: "Performance",
    module: "Responsive Layout",
    testCase: "Open dashboards on desktop and mobile widths.",
    expectedResult: "Layout adjusts without overlapping content.",
    actualResult: "Cards, tables, and sidebars remain usable.",
    status: "Passed",
    testedBy: "QA Tester",
    testedAt: "May 10, 2026",
  },
  {
    id: 5,
    type: "Performance",
    module: "Repository",
    testCase: "Search and filter archived projects.",
    expectedResult: "Repository filters records quickly and correctly.",
    actualResult: "Search, course filter, and status filter return matching records.",
    status: "Passed",
    testedBy: "QA Tester",
    testedAt: "May 10, 2026",
  },
  {
    id: 6,
    type: "Bug",
    module: "Records Navigation",
    testCase: "Check Records sidebar links.",
    expectedResult: "Dashboard, Final Validation, Archive, and Repository links are visible.",
    actualResult: "All Records links are visible after update.",
    status: "Retesting",
    testedBy: "QA Tester",
    testedAt: "May 10, 2026",
  },
];

const defaultBugReports: BugReport[] = [
  {
    id: 1,
    issue: "Records sidebar did not show Archive and Repository links.",
    module: "Records",
    severity: "Medium",
    status: "Fixed",
    fixNote: "Added Archive and Repository links to records pages.",
    reportedAt: "May 10, 2026",
  },
  {
    id: 2,
    issue: "Final submission page had an incomplete className line.",
    module: "Final Submission",
    severity: "High",
    status: "Closed",
    fixNote: "Replaced the full page with corrected JSX.",
    reportedAt: "May 10, 2026",
  },
  {
    id: 3,
    issue: "Chat Attach button did not select files.",
    module: "Communication",
    severity: "Medium",
    status: "Closed",
    fixNote: "Added file picker, selected file label, and attachment display.",
    reportedAt: "May 10, 2026",
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getStoredQATests() {
  if (!canUseStorage()) return defaultQATests;

  const saved = window.localStorage.getItem(QA_TESTS_STORAGE_KEY);

  if (!saved) {
    saveStoredQATests(defaultQATests);
    return defaultQATests;
  }

  return JSON.parse(saved) as QATestCase[];
}

export function saveStoredQATests(tests: QATestCase[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(QA_TESTS_STORAGE_KEY, JSON.stringify(tests));
}

export function updateQATestStatus(id: number, status: QATestStatus) {
  const tests = getStoredQATests().map((test) =>
    test.id === id
      ? {
          ...test,
          status,
          testedAt: new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
        }
      : test,
  );

  saveStoredQATests(tests);
  return tests;
}

export function getStoredBugReports() {
  if (!canUseStorage()) return defaultBugReports;

  const saved = window.localStorage.getItem(QA_BUGS_STORAGE_KEY);

  if (!saved) {
    saveStoredBugReports(defaultBugReports);
    return defaultBugReports;
  }

  return JSON.parse(saved) as BugReport[];
}

export function saveStoredBugReports(bugs: BugReport[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(QA_BUGS_STORAGE_KEY, JSON.stringify(bugs));
}

export function updateBugStatus(
  id: number,
  status: BugReport["status"],
  fixNote?: string,
) {
  const bugs = getStoredBugReports().map((bug) =>
    bug.id === id
      ? {
          ...bug,
          status,
          fixNote: fixNote || bug.fixNote,
        }
      : bug,
  );

  saveStoredBugReports(bugs);
  return bugs;
}
