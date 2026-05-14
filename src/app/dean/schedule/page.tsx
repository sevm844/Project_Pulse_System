"use client";

import { useEffect, useMemo, useState } from "react";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import {
  getStoredDefensePlans,
  saveStoredDefensePlan,
  type DefensePlan,
  type DefenseReadinessStatus,
} from "../../_utils/defenseStorage";

type CourseFilter = "All" | "BSIT" | "BSIS" | "BSCS" | "BLIS" | "ACT";
type StageFilter =
  | "All"
  | "Proposal Defense"
  | "Chapter 1"
  | "Chapter 2"
  | "Chapter 3"
  | "Chapter 4"
  | "Chapter 5";
type ReadinessFilter = "All" | DefenseReadinessStatus;

const ROOM_STORAGE_KEY = "project-pulse-dean-schedule-rooms";

const courseOptions: CourseFilter[] = [
  "All",
  "BSIT",
  "BSIS",
  "BSCS",
  "BLIS",
  "ACT",
];

const stageOptions: StageFilter[] = [
  "All",
  "Proposal Defense",
  "Chapter 1",
  "Chapter 2",
  "Chapter 3",
  "Chapter 4",
  "Chapter 5",
];

const readinessOptions: ReadinessFilter[] = [
  "All",
  "Ready",
  "Not Ready",
  "Pending",
];

const defaultRooms = ["H205", "H208", "H202"];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function getStoredRooms() {
  if (!canUseStorage()) return defaultRooms;

  const saved = window.localStorage.getItem(ROOM_STORAGE_KEY);
  if (!saved) {
    saveStoredRooms(defaultRooms);
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

function getCompletedRequirements(plan: DefensePlan) {
  return plan.requirements.filter((item) => item.status === "Completed").length;
}

function getUploadedFiles(plan: DefensePlan) {
  return plan.files.filter((item) => item.status === "Uploaded").length;
}

function getTimelineStatus(plan: DefensePlan) {
  if (plan.readinessStatus === "Ready") return "Ready";
  if (plan.readinessStatus === "Not Ready") return "Not Ready";
  return "Pending";
}

function getTimelineClasses(status: string) {
  if (status === "Ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Not Ready") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getStageMatches(plan: DefensePlan, stageFilter: StageFilter) {
  if (stageFilter === "All") return true;

  const planStage = normalizeText(plan.stage);

  if (stageFilter === "Proposal Defense") {
    return (
      planStage.includes("proposal") ||
      planStage.includes("defense") ||
      planStage.includes("review")
    );
  }

  return (
    planStage.includes(normalizeText(stageFilter)) ||
    normalizeText(plan.projectTitle).includes(normalizeText(stageFilter))
  );
}

export default function DeanSchedulePage() {
  const [plans, setPlans] = useState<DefensePlan[]>([]);
  const [rooms, setRooms] = useState<string[]>(defaultRooms);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("All");
  const [stageFilter, setStageFilter] = useState<StageFilter>("All");
  const [roomFilter, setRoomFilter] = useState("All");
  const [readinessFilter, setReadinessFilter] =
    useState<ReadinessFilter>("All");

  const [newRoom, setNewRoom] = useState("");
  const [editingRoom, setEditingRoom] = useState("");
  const [editingRoomValue, setEditingRoomValue] = useState("");

  useEffect(() => {
    setPlans(getStoredDefensePlans());
    setRooms(getStoredRooms());
  }, []);

  const roomOptions = useMemo(() => ["All", ...rooms], [rooms]);

  const filteredPlans = useMemo(() => {
    const query = normalizeText(searchQuery);

    return plans
      .filter((plan) => {
        const searchable = [
          plan.groupName,
          plan.projectTitle,
          plan.course,
          plan.section,
          plan.stage,
          plan.date,
          plan.time,
          plan.venue,
          plan.adviser,
          plan.readinessStatus,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = !query || searchable.includes(query);
        const matchesCourse =
          courseFilter === "All" || plan.course === courseFilter;
        const matchesStage = getStageMatches(plan, stageFilter);
        const matchesRoom = roomFilter === "All" || plan.venue === roomFilter;
        const matchesReadiness =
          readinessFilter === "All" ||
          plan.readinessStatus === readinessFilter;

        return (
          matchesSearch &&
          matchesCourse &&
          matchesStage &&
          matchesRoom &&
          matchesReadiness
        );
      })
      .sort((left, right) => scheduleTimestamp(left) - scheduleTimestamp(right));
  }, [
    courseFilter,
    plans,
    readinessFilter,
    roomFilter,
    searchQuery,
    stageFilter,
  ]);

  const readyCount = filteredPlans.filter(
    (plan) => plan.readinessStatus === "Ready",
  ).length;

  const notReadyCount = filteredPlans.filter(
    (plan) => plan.readinessStatus === "Not Ready",
  ).length;

  function resetFilters() {
    setSearchQuery("");
    setCourseFilter("All");
    setStageFilter("All");
    setRoomFilter("All");
    setReadinessFilter("All");
  }

  function addRoom() {
    const nextRoom = newRoom.trim().toUpperCase();
    if (!nextRoom) return;

    if (rooms.some((room) => room.toLowerCase() === nextRoom.toLowerCase())) {
      setNewRoom("");
      return;
    }

    const nextRooms = [...rooms, nextRoom];
    setRooms(nextRooms);
    saveStoredRooms(nextRooms);
    setNewRoom("");
  }

  function startEditRoom(room: string) {
    setEditingRoom(room);
    setEditingRoomValue(room);
  }

  function saveRoomEdit() {
    const nextRoom = editingRoomValue.trim().toUpperCase();
    if (!editingRoom || !nextRoom) return;

    const nextRooms = rooms.map((room) =>
      room === editingRoom ? nextRoom : room,
    );

    const nextPlans = plans.map((plan) =>
      plan.venue === editingRoom ? { ...plan, venue: nextRoom } : plan,
    );

    nextPlans.forEach(saveStoredDefensePlan);

    setRooms(nextRooms);
    setPlans(nextPlans);
    saveStoredRooms(nextRooms);

    if (roomFilter === editingRoom) {
      setRoomFilter(nextRoom);
    }

    setEditingRoom("");
    setEditingRoomValue("");
  }

  function deleteRoom(room: string) {
    const confirmed = window.confirm(`Delete room ${room}?`);
    if (!confirmed) return;

    const nextRooms = rooms.filter((item) => item !== room);
    setRooms(nextRooms);
    saveStoredRooms(nextRooms);

    if (roomFilter === room) {
      setRoomFilter("All");
    }

    if (editingRoom === room) {
      setEditingRoom("");
      setEditingRoomValue("");
    }
  }

  function updatePlan(plan: DefensePlan, updates: Partial<DefensePlan>) {
    const savedPlan = saveStoredDefensePlan({
      ...plan,
      ...updates,
    });

    setPlans((current) =>
      current.map((item) => (item.id === savedPlan.id ? savedPlan : item)),
    );
  }

  return (
    <DeanShell title="Schedule">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
            Defense Schedule
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
            Filter schedules by course, stage, room, and readiness. Edit a
            group directly from the defense timeline.
          </p>
        </div>

        <Card className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#203028]">
                Filter Schedule
              </h3>
              <p className="mt-1 text-xs text-[#7b877f]">
                Use the filters to find groups and review their defense timeline.
              </p>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="w-fit rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Reset Filters
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_0.8fr_1fr_0.8fr_0.8fr]">
            <label className="text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search group, adviser, project..."
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Course
              <select
                value={courseFilter}
                onChange={(event) =>
                  setCourseFilter(event.target.value as CourseFilter)
                }
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {courseOptions.map((course) => (
                  <option key={course}>{course}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Stage
              <select
                value={stageFilter}
                onChange={(event) =>
                  setStageFilter(event.target.value as StageFilter)
                }
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {stageOptions.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Room
              <select
                value={roomFilter}
                onChange={(event) => setRoomFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {roomOptions.map((room) => (
                  <option key={room}>{room}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Readiness
              <select
                value={readinessFilter}
                onChange={(event) =>
                  setReadinessFilter(event.target.value as ReadinessFilter)
                }
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {readinessOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#edf2ec] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#203028]">
                  Defense Timeline
                </h3>
                <p className="mt-1 text-xs text-[#7b877f]">
                  {filteredPlans.length} group
                  {filteredPlans.length === 1 ? "" : "s"} found • {readyCount}{" "}
                  ready • {notReadyCount} not ready
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#edf2ec]">
              {filteredPlans.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm font-semibold text-[#203028]">
                    No schedules found.
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    Try changing the course, stage, room, or readiness filters.
                  </p>
                </div>
              ) : (
                filteredPlans.map((plan) => {
                  const isEditing = editingPlanId === plan.id;
                  const timelineStatus = getTimelineStatus(plan);
                  const requirementsDone = getCompletedRequirements(plan);
                  const filesUploaded = getUploadedFiles(plan);
                  const roomChoices = Array.from(
                    new Set([...rooms, plan.venue].filter(Boolean)),
                  );

                  return (
                    <div key={plan.id} className="px-5 py-4">
                      <div className="grid gap-4 lg:grid-cols-[120px_1fr_auto]">
                        <div>
                          <p className="text-sm font-semibold text-[#203028]">
                            {plan.time}
                          </p>
                          <p className="mt-1 text-xs text-[#7b877f]">
                            {plan.date}
                          </p>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-[#203028]">
                              {plan.groupName}
                            </h4>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getTimelineClasses(
                                timelineStatus,
                              )}`}
                            >
                              {timelineStatus}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-[#59645d]">
                            {plan.projectTitle}
                          </p>

                          <p className="mt-2 text-xs text-[#7b877f]">
                            {plan.course} {plan.section} • {plan.stage} •{" "}
                            {plan.venue} • Adviser: {plan.adviser}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[#59645d]">
                            <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                              Requirements {requirementsDone}/
                              {plan.requirements.length}
                            </span>
                            <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                              Files {filesUploaded}/{plan.files.length}
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <StatusBadge status={plan.readinessStatus} />
                            <StatusBadge status={plan.evaluationStatus} />
                          </div>
                        </div>

                        <div className="flex items-start justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingPlanId((current) =>
                                current === plan.id ? null : plan.id,
                              )
                            }
                            className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                          >
                            {isEditing ? "Close" : "Edit"}
                          </button>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-5 rounded-2xl border border-[#dfe8df] bg-[#fbfdfb] p-5">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            <label className="text-xs font-semibold text-[#59645d]">
                              Defense Date
                              <input
                                value={plan.date}
                                onChange={(event) =>
                                  updatePlan(plan, { date: event.target.value })
                                }
                                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                              />
                            </label>

                            <label className="text-xs font-semibold text-[#59645d]">
                              Time
                              <input
                                value={plan.time}
                                onChange={(event) =>
                                  updatePlan(plan, { time: event.target.value })
                                }
                                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                              />
                            </label>

                            <label className="text-xs font-semibold text-[#59645d]">
                              Room
                              <select
                                value={plan.venue}
                                onChange={(event) =>
                                  updatePlan(plan, { venue: event.target.value })
                                }
                                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                              >
                                {roomChoices.map((room) => (
                                  <option key={room}>{room}</option>
                                ))}
                              </select>
                            </label>

                            <label className="text-xs font-semibold text-[#59645d]">
                              Stage
                              <select
                                value={plan.stage}
                                onChange={(event) =>
                                  updatePlan(plan, { stage: event.target.value })
                                }
                                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                              >
                                {stageOptions
                                  .filter((stage) => stage !== "All")
                                  .map((stage) => (
                                    <option key={stage}>{stage}</option>
                                  ))}
                              </select>
                            </label>

                            <label className="text-xs font-semibold text-[#59645d]">
                              Readiness
                              <select
                                value={plan.readinessStatus}
                                onChange={(event) =>
                                  updatePlan(plan, {
                                    readinessStatus: event.target
                                      .value as DefenseReadinessStatus,
                                  })
                                }
                                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                              >
                                <option>Ready</option>
                                <option>Not Ready</option>
                                <option>Pending</option>
                              </select>
                            </label>
                          </div>

                          <div className="mt-4 rounded-xl bg-white px-4 py-3 text-xs leading-5 text-[#59645d]">
                            <p>
                              Requirements: {requirementsDone}/
                              {plan.requirements.length} completed
                            </p>
                            <p>
                              Files: {filesUploaded}/{plan.files.length} uploaded
                            </p>
                            <p>Panelists: {plan.panelists.length}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <Card className="p-5">
              <h3 className="text-base font-semibold text-[#203028]">
                Room Manager
              </h3>
              <p className="mt-1 text-xs text-[#7b877f]">
                Add, edit, or delete rooms used for defense schedules.
              </p>

              <div className="mt-4 flex gap-2">
                <input
                  value={newRoom}
                  onChange={(event) => setNewRoom(event.target.value)}
                  placeholder="Add room"
                  className="min-w-0 flex-1 rounded-lg border border-[#dfe8df] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                />
                <button
                  type="button"
                  onClick={addRoom}
                  className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
                >
                  Add
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {rooms.map((room) => (
                  <div
                    key={room}
                    className="rounded-xl border border-[#edf2ec] p-3"
                  >
                    {editingRoom === room ? (
                      <div className="flex gap-2">
                        <input
                          value={editingRoomValue}
                          onChange={(event) =>
                            setEditingRoomValue(event.target.value)
                          }
                          className="min-w-0 flex-1 rounded-lg border border-[#dfe8df] px-3 py-2 text-sm outline-none"
                        />
                        <button
                          type="button"
                          onClick={saveRoomEdit}
                          className="rounded-lg bg-[#202823] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#203028]">
                          {room}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEditRoom(room)}
                            className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRoom(room)}
                            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </DeanShell>
  );
}
