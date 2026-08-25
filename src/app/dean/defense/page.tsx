"use client";

import { useEffect, useMemo, useState } from "react";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import {
  computeDefenseAverage,
  computeDefenseResult,
  getStoredDefensePlans,
  saveStoredDefensePlan,
  type DefensePlan,
  type DefenseReadinessStatus,
} from "../../_utils/defenseStorage";
import { deanProjects } from "../_data/mockDeanData";

type ViewTab = "Schedule" | "Readiness" | "Outcomes" | "Rooms";
type CourseFilter = "All" | "BSIT" | "BSIS" | "BSCS" | "BLIS" | "ACT";
type ReadinessFilter = "All" | DefenseReadinessStatus;
type OutcomeFilter = "All" | "Passed" | "Conditional" | "Needs Revision" | "Pending";

const ROOM_STORAGE_KEY = "project-pulse-dean-schedule-rooms";
const defaultRooms = ["H205", "H208", "H202"];
const courseOptions: CourseFilter[] = ["All", "BSIT", "BSIS", "BSCS", "BLIS", "ACT"];
const readinessOptions: ReadinessFilter[] = ["All", "Ready", "Not Ready", "Pending"];
const outcomeOptions: OutcomeFilter[] = ["All", "Passed", "Conditional", "Needs Revision", "Pending"];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function getStoredRooms() {
  if (!canUseStorage()) return defaultRooms;
  const saved = window.localStorage.getItem(ROOM_STORAGE_KEY);
  if (!saved) {
    window.localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(defaultRooms));
    return defaultRooms;
  }
  return JSON.parse(saved) as string[];
}

function saveStoredRooms(rooms: string[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(rooms));
}

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function scheduleTimestamp(plan: DefensePlan) {
  const timestamp = new Date(`${plan.date} ${plan.time}`).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getRequirementsDone(plan: DefensePlan) {
  return plan.requirements.filter((item) => item.status === "Completed").length;
}

function getFilesUploaded(plan: DefensePlan) {
  return plan.files.filter((item) => item.status === "Uploaded").length;
}

function getPlanAverage(plan: DefensePlan) {
  if (plan.evaluationStatus !== "Submitted") return 0;
  return computeDefenseAverage(plan.evaluationData);
}

function getPlanOutcome(plan: DefensePlan): OutcomeFilter {
  if (plan.evaluationStatus !== "Submitted") return "Pending";
  return computeDefenseResult(computeDefenseAverage(plan.evaluationData));
}

function getPlanRisk(plan: DefensePlan) {
  const requirementsDone = getRequirementsDone(plan);
  const filesUploaded = getFilesUploaded(plan);

  if (plan.readinessStatus === "Not Ready") return "Needs Follow-up";
  if (requirementsDone < plan.requirements.length) return "Missing Requirements";
  if (filesUploaded < plan.files.length) return "Missing Files";
  if (plan.evaluationStatus === "Pending" && plan.readinessStatus === "Ready") return "Awaiting Evaluation";
  return "On Track";
}

function getRiskClasses(risk: string) {
  if (risk === "On Track") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (risk === "Awaiting Evaluation") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getDefaultPlansWithDeanProjects(plans: DefensePlan[]) {
  if (plans.length > 1) return plans;

  const existingIds = new Set(plans.map((plan) => plan.groupId));
  const extraPlans = deanProjects
    .filter((project) => !existingIds.has(project.id))
    .map<DefensePlan>((project) => ({
      id: project.id,
      groupId: project.id,
      groupName: project.groupName,
      projectTitle: project.projectTitle,
      course: project.course,
      section: project.section,
      stage: project.stage === "Final Approval" ? "Final Defense" : project.stage,
      date: project.defenseOutcome === "Passed" ? "Apr 26, 2026" : project.id === 2 ? "May 22, 2026" : "May 23, 2026",
      time: project.id === 3 ? "1:00 PM" : project.id === 4 ? "10:00 AM" : project.id === 2 ? "9:00 AM" : "10:00 AM",
      venue: project.id === 2 ? "H205" : project.id === 3 ? "H208" : project.id === 4 ? "H202" : "H101",
      adviser: project.adviser,
      readinessStatus: project.riskLevel === "Ready" ? "Ready" : project.riskLevel === "At Risk" ? "Not Ready" : "Pending",
      panelists: [
        { id: 1, role: "Adviser", name: project.adviser, email: `${project.adviser.toLowerCase().replaceAll(" ", ".")}@ub.edu.ph` },
        { id: 2, role: "Chairperson", name: "Dr. Santos", email: "santos@ub.edu.ph" },
        { id: 3, role: "Panel 1", name: "Prof. Lim", email: "lim@ub.edu.ph" },
        { id: 4, role: "Panel 2", name: "Ms. Reyes", email: "reyes@ub.edu.ph" },
      ],
      requirements: [
        { id: 1, title: "Manuscript submitted", detail: "Latest manuscript must be submitted.", status: project.riskLevel === "Ready" ? "Completed" : "Pending" },
        { id: 2, title: "Adviser approval", detail: "Adviser must approve defense readiness.", status: project.riskLevel === "Ready" ? "Completed" : "Pending" },
        { id: 3, title: "Presentation slides", detail: "Defense slides must be uploaded.", status: project.riskLevel === "Ready" ? "Completed" : "Pending" },
        { id: 4, title: "Similarity report", detail: "Similarity report must be uploaded before defense.", status: "Pending" },
      ],
      files: [
        { id: 1, name: "Chapter Manuscript", detail: "Current manuscript", uploaded: project.riskLevel === "Ready" ? "Uploaded" : "-", status: project.riskLevel === "Ready" ? "Uploaded" : "Pending" },
        { id: 2, name: "Presentation Slides", detail: "Defense deck", uploaded: project.riskLevel === "Ready" ? "Uploaded" : "-", status: project.riskLevel === "Ready" ? "Uploaded" : "Pending" },
        { id: 3, name: "Approval Form", detail: "Signed adviser approval", uploaded: project.riskLevel === "Ready" ? "Uploaded" : "-", status: project.riskLevel === "Ready" ? "Uploaded" : "Pending" },
        { id: 4, name: "Similarity Report", detail: "Required similarity report", uploaded: "-", status: "Pending" },
      ],
      evaluationStatus: project.defenseOutcome === "Passed" ? "Submitted" : "Pending",
      evaluationData: project.defenseOutcome === "Passed" ? { presentation: 90, documentation: 88, systemDemo: 91, response: 87, remarks: "Defense result submitted and accepted." } : { presentation: 0, documentation: 0, systemDemo: 0, response: 0, remarks: "" },
      updatedAt: new Date().toISOString(),
    }));

  return [...plans, ...extraPlans];
}

export default function DeanDefenseManagementPage() {
  const [plans, setPlans] = useState<DefensePlan[]>([]);
  const [rooms, setRooms] = useState(defaultRooms);
  const [activeTab, setActiveTab] = useState<ViewTab>("Schedule");
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("All");
  const [roomFilter, setRoomFilter] = useState("All");
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>("All");
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("All");
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [newRoom, setNewRoom] = useState("");
  const [editingRoom, setEditingRoom] = useState("");
  const [editingRoomValue, setEditingRoomValue] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      setPlans(getDefaultPlansWithDeanProjects(getStoredDefensePlans()));
      setRooms(getStoredRooms());
    });
  }, []);

  const roomOptions = useMemo(() => ["All", ...rooms], [rooms]);

  const filteredPlans = useMemo(() => {
    const query = normalizeText(searchQuery);

    return plans
      .filter((plan) => {
        const searchable = [plan.groupName, plan.projectTitle, plan.course, plan.section, plan.stage, plan.date, plan.time, plan.venue, plan.adviser, plan.readinessStatus, getPlanOutcome(plan)].join(" ").toLowerCase();
        const matchesSearch = !query || searchable.includes(query);
        const matchesCourse = courseFilter === "All" || plan.course === courseFilter;
        const matchesRoom = roomFilter === "All" || plan.venue === roomFilter;
        const matchesReadiness = readinessFilter === "All" || plan.readinessStatus === readinessFilter;
        const matchesOutcome = outcomeFilter === "All" || getPlanOutcome(plan) === outcomeFilter;
        return matchesSearch && matchesCourse && matchesRoom && matchesReadiness && matchesOutcome;
      })
      .sort((left, right) => scheduleTimestamp(left) - scheduleTimestamp(right));
  }, [courseFilter, outcomeFilter, plans, readinessFilter, roomFilter, searchQuery]);

  const readyCount = filteredPlans.filter((plan) => plan.readinessStatus === "Ready").length;
  const pendingCount = filteredPlans.filter((plan) => plan.readinessStatus !== "Ready" || getPlanOutcome(plan) === "Pending").length;
  const passedCount = filteredPlans.filter((plan) => getPlanOutcome(plan) === "Passed").length;
  const revisionCount = filteredPlans.filter((plan) => ["Conditional", "Needs Revision"].includes(getPlanOutcome(plan))).length;
  const attentionPlans = filteredPlans.filter((plan) => getPlanRisk(plan) !== "On Track");

  function resetFilters() {
    setSearchQuery("");
    setCourseFilter("All");
    setRoomFilter("All");
    setReadinessFilter("All");
    setOutcomeFilter("All");
  }

  function updatePlan(plan: DefensePlan, updates: Partial<DefensePlan>) {
    const saved = saveStoredDefensePlan({ ...plan, ...updates });
    setPlans((current) => current.map((item) => (item.groupId === saved.groupId ? saved : item)));
  }

  function addRoom() {
    const nextRoom = newRoom.trim().toUpperCase();
    if (!nextRoom || rooms.includes(nextRoom)) return;
    const nextRooms = [...rooms, nextRoom];
    setRooms(nextRooms);
    saveStoredRooms(nextRooms);
    setNewRoom("");
  }

  function saveRoomEdit(room: string) {
    const nextRoom = editingRoomValue.trim().toUpperCase();
    if (!nextRoom) return;
    const nextRooms = rooms.map((item) => (item === room ? nextRoom : item));
    setRooms(nextRooms);
    saveStoredRooms(nextRooms);
    setPlans((current) => current.map((plan) => (plan.venue === room ? { ...plan, venue: nextRoom } : plan)));
    setEditingRoom("");
    setEditingRoomValue("");
  }

  function deleteRoom(room: string) {
    const nextRooms = rooms.filter((item) => item !== room);
    setRooms(nextRooms);
    saveStoredRooms(nextRooms);
  }

  return (
    <DeanShell title="Defense Management">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">Defense Management</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">Manage defense schedules, readiness, rooms, outcomes, and groups that need executive attention in one workspace.</p>
        </div>

        <Card className="overflow-hidden !border-[#bfe8b9] !bg-[#f7fff4] p-0 shadow-[0_10px_28px_rgba(32,48,40,0.08)]">
          <div className="overflow-x-auto rounded-2xl bg-[linear-gradient(90deg,#ffffff_0%,#f2fdeb_48%,#e4f8d8_100%)] p-4">
            <div className="flex min-w-[920px] divide-x divide-[#cfe8c8]">
              {[["Total Defenses", filteredPlans.length, "Scheduled records"], ["Ready", readyCount, "Cleared"], ["Pending", pendingCount, "Needs action/result"], ["Passed", passedCount, "Submitted outcomes"], ["Needs Revision", revisionCount, "Conditional or revision"]].map(([label, value, caption]) => (
                <div key={label} className="flex-1 px-4 py-2"><p className="text-[11px] font-semibold text-[#2f6f3a]">{label}</p><div className="mt-1 flex items-end gap-2 whitespace-nowrap"><p className="text-2xl font-semibold leading-none text-[#0f1f16]">{value}</p><p className="pb-0.5 text-[10px] leading-4 text-[#59645d]">{caption}</p></div></div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div><h3 className="text-base font-semibold text-[#203028]">Defense Filters</h3><p className="mt-1 text-xs text-[#7b877f]">Search and narrow records by course, room, readiness, or outcome.</p></div>
            <button type="button" onClick={resetFilters} className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">Reset Filters</button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="text-xs font-semibold text-[#59645d]">Search<input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search group, adviser, project..." className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]" /></label>
            <label className="text-xs font-semibold text-[#59645d]">Course<select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value as CourseFilter)} className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]">{courseOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-xs font-semibold text-[#59645d]">Room<select value={roomFilter} onChange={(event) => setRoomFilter(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]">{roomOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-xs font-semibold text-[#59645d]">Readiness<select value={readinessFilter} onChange={(event) => setReadinessFilter(event.target.value as ReadinessFilter)} className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]">{readinessOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-xs font-semibold text-[#59645d]">Outcome<select value={outcomeFilter} onChange={(event) => setOutcomeFilter(event.target.value as OutcomeFilter)} className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]">{outcomeOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
        </Card>

        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-[#dfe8df] bg-white p-2">
          {(["Schedule", "Readiness", "Outcomes", "Rooms"] as ViewTab[]).map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition ${activeTab === tab ? "bg-[#d7f7d8] text-[#203028]" : "text-[#59645d] hover:bg-[#f3f7f1]"}`}>{tab}</button>)}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-[#edf2ec] px-5 py-4 md:flex-row md:items-center md:justify-between"><div><h3 className="text-base font-semibold text-[#203028]">{activeTab === "Schedule" ? "Defense Schedule Timeline" : activeTab === "Readiness" ? "Defense Readiness Board" : activeTab === "Outcomes" ? "Defense Outcome Board" : "Room Assignment Board"}</h3><p className="mt-1 text-xs text-[#7b877f]">{filteredPlans.length} defense record{filteredPlans.length === 1 ? "" : "s"} shown</p></div></div>
            <div className="divide-y divide-[#edf2ec]">
              {filteredPlans.map((plan) => {
                const requirementsDone = getRequirementsDone(plan);
                const filesUploaded = getFilesUploaded(plan);
                const average = getPlanAverage(plan);
                const outcome = getPlanOutcome(plan);
                const risk = getPlanRisk(plan);
                const isEditing = editingPlanId === plan.groupId;

                return <div key={plan.groupId} className="grid gap-4 px-5 py-5 lg:grid-cols-[150px_1fr_auto]">
                  <div><p className="text-sm font-semibold text-[#203028]">{plan.time}</p><p className="mt-1 text-xs text-[#7b877f]">{plan.date}</p><p className="mt-2 text-xs font-semibold text-[#59645d]">{plan.venue}</p></div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h4 className="text-base font-semibold text-[#203028]">{plan.groupName}</h4><span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getRiskClasses(risk)}`}>{risk}</span><StatusBadge status={plan.readinessStatus} /></div>
                    <p className="mt-1 text-sm text-[#59645d]">{plan.projectTitle}</p><p className="mt-2 text-xs text-[#7b877f]">{plan.course} {plan.section} • {plan.stage} • Adviser: {plan.adviser}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-[#f8faf7] px-3 py-1 font-semibold">Requirements {requirementsDone}/{plan.requirements.length}</span><span className="rounded-full bg-[#f8faf7] px-3 py-1 font-semibold">Files {filesUploaded}/{plan.files.length}</span><span className="rounded-full bg-[#f8faf7] px-3 py-1 font-semibold">Outcome {outcome}</span><span className="rounded-full bg-[#f8faf7] px-3 py-1 font-semibold">Average {average || "-"}</span></div>
                    {isEditing && <div className="mt-4 grid gap-3 rounded-xl border border-[#dfe8df] bg-[#fbfdfb] p-4 md:grid-cols-2 xl:grid-cols-4"><input value={plan.date} onChange={(event) => updatePlan(plan, { date: event.target.value })} className="rounded-lg border border-[#dfe8df] px-3 py-2 text-sm outline-none" /><input value={plan.time} onChange={(event) => updatePlan(plan, { time: event.target.value })} className="rounded-lg border border-[#dfe8df] px-3 py-2 text-sm outline-none" /><select value={plan.venue} onChange={(event) => updatePlan(plan, { venue: event.target.value })} className="rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm outline-none">{rooms.map((room) => <option key={room}>{room}</option>)}</select><select value={plan.readinessStatus} onChange={(event) => updatePlan(plan, { readinessStatus: event.target.value as DefenseReadinessStatus })} className="rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm outline-none"><option>Ready</option><option>Not Ready</option><option>Pending</option></select></div>}
                  </div>
                  <div className="flex flex-col gap-2"><button type="button" onClick={() => setEditingPlanId(isEditing ? null : plan.groupId)} className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">{isEditing ? "Done" : "Edit"}</button><button type="button" onClick={() => setActiveTab("Outcomes")} className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]">Outcome</button></div>
                </div>;
              })}
              {filteredPlans.length === 0 && <p className="px-5 py-10 text-center text-sm text-[#7b877f]">No defense records match these filters.</p>}
            </div>
          </Card>

          <aside className="space-y-5">
            <Card className="p-5"><h3 className="text-base font-semibold text-[#203028]">Needs Attention</h3><div className="mt-4 space-y-3">{attentionPlans.slice(0, 5).map((plan) => <div key={plan.groupId} className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-3"><p className="font-semibold text-[#203028]">{plan.groupName}</p><p className="mt-1 text-xs text-[#7b877f]">{getPlanRisk(plan)}</p></div>)}{attentionPlans.length === 0 && <p className="text-sm text-[#7b877f]">No urgent defense issues.</p>}</div></Card>
            <Card className="p-5"><h3 className="text-base font-semibold text-[#203028]">Room Manager</h3><div className="mt-4 flex gap-2"><input value={newRoom} onChange={(event) => setNewRoom(event.target.value)} placeholder="Add room" className="min-w-0 flex-1 rounded-lg border border-[#dfe8df] px-3 py-2 text-sm outline-none" /><button type="button" onClick={addRoom} className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white">Add</button></div><div className="mt-4 space-y-2">{rooms.map((room) => <div key={room} className="flex items-center gap-2 rounded-xl border border-[#edf2ec] p-3">{editingRoom === room ? <input value={editingRoomValue} onChange={(event) => setEditingRoomValue(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#dfe8df] px-3 py-2 text-sm outline-none" /> : <p className="flex-1 font-semibold">{room}</p>}<button type="button" onClick={() => editingRoom === room ? saveRoomEdit(room) : (setEditingRoom(room), setEditingRoomValue(room))} className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">{editingRoom === room ? "Save" : "Edit"}</button><button type="button" onClick={() => deleteRoom(room)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50">Delete</button></div>)}</div></Card>
          </aside>
        </div>
      </div>
    </DeanShell>
  );
}


