import type { Cell, Sheet } from "@fortune-sheet/core";

export type DefenseWorkbookCourse =
  | "BSIT"
  | "BSIS"
  | "BSCS"
  | "ACT"
  | "BLIS"
  | string;

type DefenseRow = {
  id: number;
  time: string;
  team: string;
  members: string;
  projectTitle: string;
  comments: string;
  remarks: "Approved" | "Pending" | "Needs Revision";
  adviser: string;
  technicalAdviser: string;
  status: "Approved" | "Pending";
};

export const DEFENSE_WORKBOOK_STORAGE_PREFIX =
  "project-pulse-shared-defense-workbook";

export const defenseSchedule: DefenseRow[] = [
  {
    id: 1,
    time: "8:00 - 8:30 AM",
    team: "The Governor",
    members: "Gian Pilar, Jef Castillo, Ben Dictalugan",
    projectTitle:
      "BG-SMART: Digitalizing Waste Management Through Geolocation and Technology in Batangas City",
    comments:
      "Finalize location for pilot testing and determine image placement for accident detection.",
    remarks: "Approved",
    adviser: "Bernadet Macaraig",
    technicalAdviser: "Melvin Melo",
    status: "Approved",
  },
  {
    id: 2,
    time: "8:30 - 9:00 AM",
    team: "Carl",
    members: "Cabrera, Povey, Dolor, Clint Ador",
    projectTitle: "Real-Time Accident Detection and Alert System Using Computer Vision",
    comments: "Clarify alert workflow and emergency contact routing.",
    remarks: "Approved",
    adviser: "Bernadet Macaraig",
    technicalAdviser: "Melvin Melo",
    status: "Approved",
  },
  {
    id: 3,
    time: "9:00 - 9:30 AM",
    team: "Katana",
    members: "Pujarbo, John Manuel, Chloe, John Ashley",
    projectTitle:
      "A-LVN: AI-Powered Learning and Video-Based Interview Navigation System for Career Readiness",
    comments:
      "Add dashboard for grading and specify how job recommendations are generated.",
    remarks: "Approved",
    adviser: "Bernadet Macaraig",
    technicalAdviser: "Melvin Melo",
    status: "Approved",
  },
  {
    id: 4,
    time: "9:30 - 10:00 AM",
    team: "Hilltop Colony",
    members: "Delavega, Rhuellyn B., De Torres, Al Francis M.",
    projectTitle:
      "Brahman Radio: An AI-Powered Digital Radio and Broadcast Audio-Content Platform",
    comments: "Remove anonymous blind chat and verify copyright handling.",
    remarks: "Approved",
    adviser: "Bernadet Macaraig",
    technicalAdviser: "Neria Macaraig",
    status: "Approved",
  },
  {
    id: 5,
    time: "10:30 - 11:00 AM",
    team: "Tara",
    members: "Asilo, Kyran B., Dela Trinos, Erin R.",
    projectTitle:
      "Project Pulse: A Unified Research Lifecycle Management and Monitoring System",
    comments:
      "Start scheduling proposal defense and allow panelists to comment inside the system.",
    remarks: "Approved",
    adviser: "Bernadet Macaraig",
    technicalAdviser: "Neria Macaraig",
    status: "Approved",
  },
  {
    id: 6,
    time: "11:30 - 12:00 PM",
    team: "Tyreese",
    members: "Conia, Proclou, Derfin, Myra",
    projectTitle:
      "Auto-eMP Plate: An Online Marketplace for Batangas City Public Market Products",
    comments: "Define deployment scope and vendor onboarding process.",
    remarks: "Approved",
    adviser: "Bernadet Macaraig",
    technicalAdviser: "Sir Vinz Cruz",
    status: "Approved",
  },
  {
    id: 7,
    time: "1:30 - 2:00 PM",
    team: "Carol",
    members: "Alcantara, Ace Gabriel, Macal, John Sirn",
    projectTitle: "ArbiTe: A Tracking System for Ranking, Control and Management",
    comments: "Review AI integration and revise title wording.",
    remarks: "Pending",
    adviser: "Bernadet Macaraig",
    technicalAdviser: "-",
    status: "Pending",
  },
  {
    id: 8,
    time: "2:00 - 2:30 PM",
    team: "Maggie",
    members: "Arro, Luis, Santilo, Bothon",
    projectTitle: "Pilipinas Chronicles",
    comments: "Add more historical events and improve content validation.",
    remarks: "Pending",
    adviser: "Bernadet Macaraig",
    technicalAdviser: "-",
    status: "Pending",
  },
];

const defenseSheetHeaders = [
  "DAY 1",
  "TIME",
  "TEAM",
  "MEMBERS",
  "",
  "Proposal 1",
  "COMMENTS/SUGGESTIONS",
  "REMARKS",
  "Adviser",
  "Technical Adviser",
];

function sheetCell(
  value: string | number,
  options: Partial<Cell> = {},
): Cell {
  return {
    v: value,
    m: value,
    ...options,
  };
}

function createDefenseSheet(name: string, order: number): Sheet {
  const data: (Cell | null)[][] = [
    defenseSheetHeaders.map((header) =>
      sheetCell(header, {
        bl: 1,
        bg: header === "Proposal 1" ? "#fff200" : "#f8faf7",
        ht: 0,
        vt: 0,
      }),
    ),
    ...defenseSchedule.map((row) => [
      null,
      sheetCell(row.time),
      sheetCell(row.team),
      sheetCell(row.members),
      null,
      sheetCell(row.projectTitle, { bg: "#fff200", tb: "2" }),
      sheetCell(row.comments, { tb: "2" }),
      sheetCell(row.remarks, { bl: 1 }),
      sheetCell(row.adviser),
      sheetCell(row.technicalAdviser),
    ]),
  ];

  return {
    name,
    id: `defense-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    order,
    row: 40,
    column: 18,
    data,
    defaultRowHeight: 34,
    defaultColWidth: 120,
    config: {
      rowlen: {
        1: 68,
        2: 68,
        3: 68,
        4: 86,
        5: 86,
        12: 86,
        13: 86,
      },
      columnlen: {
        0: 90,
        1: 220,
        2: 130,
        3: 230,
        4: 230,
        5: 250,
        6: 270,
        7: 140,
        8: 140,
        9: 150,
      },
    },
    showGridLines: true,
  };
}

function createBlankSheet(name: string, order: number): Sheet {
  return {
    name,
    id: `defense-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    order,
    row: 40,
    column: 18,
    defaultRowHeight: 34,
    defaultColWidth: 120,
    data: [[sheetCell(name, { bl: 1, bg: "#f4faee" })]],
    showGridLines: true,
  };
}

export function createInitialDefenseWorkbook(): Sheet[] {
  return [
    createBlankSheet("IT3-1", 0),
    createBlankSheet("IT3-2", 1),
    createBlankSheet("IT3-3", 2),
    createDefenseSheet("SCHEDULE OF DEFENSE", 3),
    createBlankSheet("REDEFENSE", 4),
    createBlankSheet("REMINDERS", 5),
    createBlankSheet("FILES and PRESENTATION LINK", 6),
  ];
}

export function getDefenseWorkbookStorageKey(courseCode: DefenseWorkbookCourse) {
  return `${DEFENSE_WORKBOOK_STORAGE_PREFIX}-${courseCode}`;
}

export function getStoredDefenseWorkbook(courseCode: DefenseWorkbookCourse) {
  if (typeof window === "undefined") return createInitialDefenseWorkbook();

  const saved = window.localStorage.getItem(
    getDefenseWorkbookStorageKey(courseCode),
  );

  return saved ? (JSON.parse(saved) as Sheet[]) : createInitialDefenseWorkbook();
}

export function saveStoredDefenseWorkbook(
  courseCode: DefenseWorkbookCourse,
  workbookData: Sheet[],
) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    getDefenseWorkbookStorageKey(courseCode),
    JSON.stringify(workbookData),
  );
}
