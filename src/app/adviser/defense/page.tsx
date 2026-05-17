"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { Cell, Sheet } from "@fortune-sheet/core";
import AdviserShell from "../_components/AdviserShell";
import Card from "../_components/Card";

const Workbook = dynamic(
  () => import("@fortune-sheet/react").then((mod) => mod.Workbook),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[640px] items-center justify-center rounded-xl border border-[#dfe8df] bg-white text-sm text-[#59645d]">
        Loading spreadsheet...
      </div>
    ),
  },
);

type CourseOption = {
  code: string;
  name: string;
  sections: number;
  activeGroups: number;
  icon: string;
};

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

const courseOptions: CourseOption[] = [
  {
    code: "BSIT",
    name: "Bachelor of Science in Information Technology",
    sections: 12,
    activeGroups: 56,
    icon: "/it.png",
  },
  {
    code: "BSIS",
    name: "Bachelor of Science in Information Systems",
    sections: 10,
    activeGroups: 42,
    icon: "/is.png",
  },
  {
    code: "BSCS",
    name: "Bachelor of Science in Computer Science",
    sections: 11,
    activeGroups: 48,
    icon: "/cs.png",
  },
  {
    code: "ACT",
    name: "Associate in Computer Technology",
    sections: 8,
    activeGroups: 31,
    icon: "/act.png",
  },
  {
    code: "BLIS",
    name: "Bachelor of Library and Information Science",
    sections: 6,
    activeGroups: 22,
    icon: "/blis.png",
  },
];

const defenseSchedule: DefenseRow[] = [
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

const initialDefenseWorkbook: Sheet[] = [
  createBlankSheet("IT3-1", 0),
  createBlankSheet("IT3-2", 1),
  createBlankSheet("IT3-3", 2),
  createDefenseSheet("SCHEDULE OF DEFENSE", 3),
  createBlankSheet("REDEFENSE", 4),
  createBlankSheet("REMINDERS", 5),
  createBlankSheet("FILES and PRESENTATION LINK", 6),
];

const courseCardClass =
  "group rounded-xl border border-[#e2f5df] bg-lime-50/50 p-5 text-left shadow-[0_14px_34px_rgba(31,42,36,0.04)] transition hover:-translate-y-0.5 hover:border-[#a3e635] hover:shadow-[0_18px_42px_rgba(163,230,53,0.1)]"
export default function AdviserDefensePage() {
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(
    null,
  );

  const overview = useMemo(() => {
    return {
      sections: courseOptions.reduce((total, item) => total + item.sections, 0),
      activeGroups: courseOptions.reduce(
        (total, item) => total + item.activeGroups,
        0,
      ),
      upcomingDefenses: defenseSchedule.length,
      pendingApprovals: defenseSchedule.filter(
        (item) => item.status === "Pending",
      ).length,
    };
  }, []);

  if (!selectedCourse) {
    return (
      <AdviserShell
        title="Defense Workspace"
        subtitle="Select a course to manage defense schedules, approvals, redefense and reminders."
      >
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courseOptions.map((course) => (
              <button
                key={course.code}
                type="button"
                onClick={() => setSelectedCourse(course)}
                className={courseCardClass}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-19 w-19 shrink-0 items-center justify-center rounded-full bg-[#e9f8df]">
                    <Image
                      src={course.icon}
                      alt=""
                      width={40}
                      height={40}
                      className="opacity-80"
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold tracking-tight text-[#17211b]">
                      {course.code}
                    </h2>
                    <p className="mt-1 min-h-[38px] text-sm leading-5 text-[#59645d]">
                      {course.name}
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-4">
                  <Metric label="Sections" value={course.sections} />
                  <Metric label="Active Groups" value={course.activeGroups} />
                </div>

                <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white transition group-hover:bg-[#245329]">
                  Open Workspace
                  <span aria-hidden="true">-&gt;</span>
                </div>
              </button>
            ))}
          </div>

          {/* 1. This wrapper pushes everything above it up, and forces the card down */}
          <div className="mt-auto pt-6">
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-[#203028]">Overview</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <OverviewTile
                  icon="/total.png"
                  label="Total Sections"
                  value={overview.sections}
                />
                <OverviewTile
                  icon="/group.png"
                  label="Total Active Groups"
                  value={overview.activeGroups}
                />
                <OverviewTile
                  icon="/date.png"
                  label="Upcoming Defenses"
                  value={overview.upcomingDefenses}
                />
                <OverviewTile
                  icon="/pending.png"
                  label="Pending Approvals"
                  value={overview.pendingApprovals}
                  accent="orange"
                />
              </div>
            </Card>
          </div>
        </div>
      </AdviserShell>
    );
  }

  return (
    <AdviserShell title={selectedCourse.code} subtitle="Defense Workspace">
      <div className="flex min-h-[760px] flex-col">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => setSelectedCourse(null)}
              className="mb-2 inline-flex items-center rounded-lg border border-[#9ed58c] px-4 py-2 text-xs font-semibold text-black transition hover:border-[#7abf45]"
              style={{ backgroundColor: "#d7f7c9" }}
            >
              &lt; Course selection
            </button>
            <p className="text-sm text-[#59645d]">{selectedCourse.name}</p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <ScheduleView courseName={selectedCourse.code} />
          </div>
        </Card>
      </div>
    </AdviserShell>
  );
}

function ScheduleView({ courseName }: { courseName: string }) {
  const [workbookData, setWorkbookData] = useState<Sheet[]>(
    initialDefenseWorkbook,
  );
  const [saveStatus, setSaveStatus] = useState("Autosaved locally");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-xl border border-[#dfe8df] bg-[#fbfef8] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7b877f]">
            {courseName} Defense Sheet
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#203028]">
            Editable defense workbook
          </h2>
          <p className="mt-1 text-sm text-[#59645d]">
            Use the sheet tabs below for sections, schedule, redefense,
            reminders, and files. Add rows or columns directly inside the
            spreadsheet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#e4f8da] px-3 py-1.5 text-xs font-semibold text-[#245329]">
            {saveStatus}
          </span>
          <button
            type="button"
            onClick={() => setSaveStatus("Saved just now")}
            className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#245329]"
          >
            Save Sheet
          </button>
          <ControlButton label="Print" icon="/docs.png" />
        </div>
      </div>

      <div className="h-[680px] overflow-hidden rounded-xl border border-[#dfe8df] bg-white">
        <Workbook
          data={workbookData}
          onChange={setWorkbookData}
          allowEdit
          showToolbar
          showFormulaBar
          showSheetTabs
          row={40}
          column={18}
          defaultRowHeight={34}
          defaultColWidth={120}
        />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xl font-semibold text-[#17211b]">{value}</p>
      <p className="mt-1 text-xs text-[#59645d]">{label}</p>
    </div>
  );
}

function OverviewTile({
  icon,
  label,
  value,
  accent = "green",
}: {
  icon: string;
  label: string;
  value: number;
  accent?: "green" | "orange";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#dfe8df] bg-white p-4">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-lg ${
          accent === "orange" ? "bg-orange-50" : "bg-[#e9f8df]"
        }`}
      >
        <Image src={icon} alt="" width={28} height={18} />
      </div>

      <div>
        <p className="text-xs text-[#59645d]">{label}</p>
        <p
          className={`text-xl font-semibold ${
            accent === "orange" ? "text-orange-600" : "text-[#203028]"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  icon,
  strong = false,
}: {
  label: string;
  icon: string;
  strong?: boolean;
}) {
  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-xs font-semibold ${
        strong
          ? "border-[#cfe9c5] bg-[#f4faee] text-[#245329]"
          : "border-[#dfe8df] bg-white text-[#203028] hover:bg-[#f8faf7]"
      }`}
    >
      <Image src={icon} alt="" width={14} height={14} />
      {label}
    </button>
  );
}
