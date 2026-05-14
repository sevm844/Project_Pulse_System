"use client";

import { useEffect, useMemo, useState } from "react";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import {
  computeDefenseAverage,
  computeDefenseResult,
  getStoredDefensePlans,
  type DefensePlan,
} from "../../_utils/defenseStorage";
import { deanProjects } from "../_data/mockDeanData";

type OutcomeFilter = "All" | "Passed" | "Conditional" | "Needs Revision" | "Pending";
type ReadinessFilter = "All" | "Ready" | "Not Ready" | "Pending";
type StageFilter =
  | "All"
  | "Proposal Review"
  | "Alpha Defense"
  | "Beta Defense"
  | "Final Defense"
  | "Final Approval";

const outcomeOptions: OutcomeFilter[] = [
  "All",
  "Passed",
  "Conditional",
  "Needs Revision",
  "Pending",
];

const readinessOptions: ReadinessFilter[] = [
  "All",
  "Ready",
  "Not Ready",
  "Pending",
];

const stageOptions: StageFilter[] = [
  "All",
  "Proposal Review",
  "Alpha Defense",
  "Beta Defense",
  "Final Defense",
  "Final Approval",
];

function getRequirementsDone(plan: DefensePlan) {
  return plan.requirements.filter((item) => item.status === "Completed").length;
}

function getFilesUploaded(plan: DefensePlan) {
  return plan.files.filter((item) => item.status === "Uploaded").length;
}

function getPlanOutcome(plan: DefensePlan) {
  if (plan.evaluationStatus !== "Submitted") return "Pending";

  return computeDefenseResult(computeDefenseAverage(plan.evaluationData));
}

function getPlanAverage(plan: DefensePlan) {
  if (plan.evaluationStatus !== "Submitted") return 0;

  return computeDefenseAverage(plan.evaluationData);
}

function getPlanRisk(plan: DefensePlan) {
  const requirementsDone = getRequirementsDone(plan);
  const filesUploaded = getFilesUploaded(plan);

  if (plan.readinessStatus === "Not Ready") return "Needs Follow-up";
  if (requirementsDone < plan.requirements.length) return "Missing Requirements";
  if (filesUploaded < plan.files.length) return "Missing Files";
  if (plan.evaluationStatus === "Pending" && plan.readinessStatus === "Ready") {
    return "Awaiting Evaluation";
  }

  return "On Track";
}

function getRiskClasses(risk: string) {
  if (risk === "On Track") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (risk === "Awaiting Evaluation") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function scheduleTimestamp(plan: DefensePlan) {
  const timestamp = new Date(`${plan.date} ${plan.time}`).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
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
      stage:
        project.stage === "Final Approval" ? "Final Defense" : project.stage,
      date:
        project.defenseOutcome === "Passed"
          ? "Apr 26, 2026"
          : project.id === 2
            ? "May 24, 2026"
            : "May 22, 2026",
      time:
        project.id === 3
          ? "1:00 PM"
          : project.id === 4
            ? "10:00 AM"
            : "9:00 AM",
      venue:
        project.id === 3
          ? "H208"
          : project.id === 4
            ? "H202"
            : "H205",
      adviser: project.adviser,
      readinessStatus:
        project.riskLevel === "Ready"
          ? "Ready"
          : project.riskLevel === "At Risk"
            ? "Not Ready"
            : "Pending",
      panelists: [
        {
          id: 1,
          role: "Adviser",
          name: project.adviser,
          email: `${project.adviser.toLowerCase().replaceAll(" ", ".")}@ub.edu.ph`,
        },
        {
          id: 2,
          role: "Chairperson",
          name: "Dr. Santos",
          email: "santos@ub.edu.ph",
        },
        {
          id: 3,
          role: "Panel 1",
          name: "Prof. Lim",
          email: "lim@ub.edu.ph",
        },
        {
          id: 4,
          role: "Panel 2",
          name: "Ms. Reyes",
          email: "reyes@ub.edu.ph",
        },
      ],
      requirements: [
        {
          id: 1,
          title: "Manuscript submitted",
          detail: "Latest chapter manuscript must be submitted.",
          status: project.riskLevel === "Ready" ? "Completed" : "Pending",
        },
        {
          id: 2,
          title: "Adviser approval",
          detail: "Adviser must approve the group for defense.",
          status: project.riskLevel === "Ready" ? "Completed" : "Pending",
        },
        {
          id: 3,
          title: "Presentation slides",
          detail: "Defense presentation file must be uploaded.",
          status: project.riskLevel === "Ready" ? "Completed" : "Pending",
        },
        {
          id: 4,
          title: "Similarity report",
          detail: "Similarity report must be uploaded before defense.",
          status: "Pending",
        },
      ],
      files: [
        {
          id: 1,
          name: "Chapter Manuscript",
          detail: "Current manuscript workspace",
          uploaded: project.riskLevel === "Ready" ? "Uploaded" : "-",
          status: project.riskLevel === "Ready" ? "Uploaded" : "Pending",
        },
        {
          id: 2,
          name: "Presentation Slides",
          detail: "Defense presentation deck",
          uploaded: project.riskLevel === "Ready" ? "Uploaded" : "-",
          status: project.riskLevel === "Ready" ? "Uploaded" : "Pending",
        },
        {
          id: 3,
          name: "Approval Form",
          detail: "Signed adviser approval file",
          uploaded: project.riskLevel === "Ready" ? "Uploaded" : "-",
          status: project.riskLevel === "Ready" ? "Uploaded" : "Pending",
        },
        {
          id: 4,
          name: "Similarity Report",
          detail: "Required similarity report",
          uploaded: "-",
          status: "Pending",
        },
      ],
      evaluationStatus:
        project.defenseOutcome === "Passed" ? "Submitted" : "Pending",
      evaluationData:
        project.defenseOutcome === "Passed"
          ? {
              presentation: 90,
              documentation: 88,
              systemDemo: 91,
              response: 87,
              remarks: "Defense result submitted and accepted.",
            }
          : {
              presentation: 0,
              documentation: 0,
              systemDemo: 0,
              response: 0,
              remarks: "",
            },
      updatedAt: new Date().toISOString(),
    }));

  return [...plans, ...extraPlans];
}

export default function DeanDefensePage() {
  const [plans, setPlans] = useState<DefensePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("All");
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("All");
  const [readinessFilter, setReadinessFilter] =
    useState<ReadinessFilter>("All");

  useEffect(() => {
    const storedPlans = getDefaultPlansWithDeanProjects(getStoredDefensePlans());

    setPlans(storedPlans);
    setSelectedPlanId(storedPlans[0]?.id ?? null);
  }, []);

  const filteredPlans = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return plans
      .filter((plan) => {
        const outcome = getPlanOutcome(plan);

        const searchable = [
          plan.groupName,
          plan.projectTitle,
          plan.course,
          plan.section,
          plan.stage,
          plan.date,
          plan.venue,
          plan.adviser,
          plan.readinessStatus,
          outcome,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = !query || searchable.includes(query);
        const matchesStage =
          stageFilter === "All" || plan.stage === stageFilter;
        const matchesOutcome =
          outcomeFilter === "All" || outcome === outcomeFilter;
        const matchesReadiness =
          readinessFilter === "All" ||
          plan.readinessStatus === readinessFilter;

        return (
          matchesSearch &&
          matchesStage &&
          matchesOutcome &&
          matchesReadiness
        );
      })
      .sort((left, right) => scheduleTimestamp(left) - scheduleTimestamp(right));
  }, [outcomeFilter, plans, readinessFilter, searchQuery, stageFilter]);

  const selectedPlan =
    filteredPlans.find((plan) => plan.id === selectedPlanId) ||
    filteredPlans[0] ||
    null;

  const totalDefenses = plans.length;
  const readyDefenses = plans.filter(
    (plan) => plan.readinessStatus === "Ready",
  ).length;
  const pendingDefenses = plans.filter(
    (plan) =>
      plan.readinessStatus === "Pending" || getPlanOutcome(plan) === "Pending",
  ).length;
  const passedDefenses = plans.filter(
    (plan) => getPlanOutcome(plan) === "Passed",
  ).length;
  const needsRevisionDefenses = plans.filter((plan) =>
    ["Needs Revision", "Conditional"].includes(getPlanOutcome(plan)),
  ).length;

  const attentionItems = filteredPlans.filter(
    (plan) => getPlanRisk(plan) !== "On Track",
  );

  function resetFilters() {
    setSearchQuery("");
    setStageFilter("All");
    setOutcomeFilter("All");
    setReadinessFilter("All");
  }

  return (
    <DeanShell title="Defense Outcomes">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
            Defense Monitoring
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
            Monitor defense readiness, outcomes, evaluations, and groups that
            need executive attention.
          </p>
        </div>

  <div
    className="overflow-x-auto rounded-2xl border border-[#86d993] bg-[#dcfce7] p-4 shadow-[0_10px_30px_rgba(34,197,94,0.14)]"
    style={{ backgroundColor: "#dcfce7" }}
  >
    <div className="flex min-w-[920px] divide-x divide-[#86d993]">
      {[
        ["Total Defenses", totalDefenses, "All defense records"],
        ["Ready", readyDefenses, "Cleared for defense"],
        ["Pending", pendingDefenses, "Awaiting readiness/result"],
        ["Passed", passedDefenses, "Submitted outcomes"],
        ["Needs Revision", needsRevisionDefenses, "Conditional or revision"],
      ].map(([label, value, caption]) => (
        <div key={label} className="flex-1 px-4 py-2">
          <p className="text-[11px] font-semibold text-[#7b877f]">{label}</p>

          <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
            <p className="text-2xl font-semibold leading-none text-[#203028]">
              {value}
            </p>
            <p className="pb-0.5 text-[10px] leading-4 text-[#7b877f]">
              {caption}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>

        <Card className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#203028]">
                Defense Filters
              </h3>
              <p className="mt-1 text-xs text-[#7b877f]">
                Search and narrow defense outcomes by stage, result, or
                readiness.
              </p>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="w-fit rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
            >
              Reset Filters
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <label className="text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search group, adviser, course..."
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Stage
              <select
                value={stageFilter}
                onChange={(event) =>
                  setStageFilter(event.target.value as StageFilter)
                }
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {stageOptions.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Outcome
              <select
                value={outcomeFilter}
                onChange={(event) =>
                  setOutcomeFilter(event.target.value as OutcomeFilter)
                }
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {outcomeOptions.map((outcome) => (
                  <option key={outcome}>{outcome}</option>
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
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {readinessOptions.map((readiness) => (
                  <option key={readiness}>{readiness}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden">
            <div className="border-b border-[#edf2ec] px-5 py-4">
              <h3 className="text-base font-semibold text-[#203028]">
                Defense Outcome Board
              </h3>
              <p className="mt-1 text-xs text-[#7b877f]">
                {filteredPlans.length} defense record
                {filteredPlans.length === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="divide-y divide-[#edf2ec]">
              {filteredPlans.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm font-semibold text-[#203028]">
                    No defense records found.
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    Try changing the search or filters.
                  </p>
                </div>
              ) : (
                filteredPlans.map((plan) => {
                  const selected = selectedPlan?.id === plan.id;
                  const outcome = getPlanOutcome(plan);
                  const average = getPlanAverage(plan);
                  const risk = getPlanRisk(plan);
                  const requirementsDone = getRequirementsDone(plan);
                  const filesUploaded = getFilesUploaded(plan);

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`block w-full px-5 py-4 text-left transition hover:bg-[#fbfdfb] ${
                        selected ? "bg-[#f3faf4]" : ""
                      }`}
                    >
                      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-semibold text-[#203028]">
                              {plan.groupName}
                            </h4>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getRiskClasses(
                                risk,
                              )}`}
                            >
                              {risk}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-[#59645d]">
                            {plan.projectTitle}
                          </p>

                          <p className="mt-2 text-xs text-[#7b877f]">
                            {plan.course} {plan.section} • {plan.stage} •{" "}
                            {plan.date} {plan.time} • {plan.venue}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[#59645d]">
                            <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                              Adviser: {plan.adviser}
                            </span>
                            <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                              Requirements {requirementsDone}/
                              {plan.requirements.length}
                            </span>
                            <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                              Files {filesUploaded}/{plan.files.length}
                            </span>
                            <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                              Average {average || "-"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                          <StatusBadge status={plan.readinessStatus} />
                          <StatusBadge status={outcome} />
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <Card className="p-5">
              <h3 className="text-base font-semibold text-[#203028]">
                Needs Attention
              </h3>

              <div className="mt-4 space-y-3">
                {attentionItems.length === 0 ? (
                  <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                    No urgent defense issues found.
                  </p>
                ) : (
                  attentionItems.slice(0, 4).map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className="block w-full rounded-xl border border-[#edf2ec] bg-white p-3 text-left hover:bg-[#fbfdfb]"
                    >
                      <p className="text-sm font-semibold text-[#203028]">
                        {plan.groupName}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {getPlanRisk(plan)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-semibold text-[#203028]">
                Selected Defense
              </h3>

              {selectedPlan ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-[#203028]">
                      {selectedPlan.groupName}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#59645d]">
                      {selectedPlan.projectTitle}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#f8faf7] p-3 text-xs leading-5 text-[#59645d]">
                    <p>
                      <span className="font-semibold text-[#203028]">
                        Schedule:
                      </span>{" "}
                      {selectedPlan.date} • {selectedPlan.time}
                    </p>
                    <p>
                      <span className="font-semibold text-[#203028]">
                        Venue:
                      </span>{" "}
                      {selectedPlan.venue}
                    </p>
                    <p>
                      <span className="font-semibold text-[#203028]">
                        Stage:
                      </span>{" "}
                      {selectedPlan.stage}
                    </p>
                    <p>
                      <span className="font-semibold text-[#203028]">
                        Adviser:
                      </span>{" "}
                      {selectedPlan.adviser}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={selectedPlan.readinessStatus} />
                    <StatusBadge status={getPlanOutcome(selectedPlan)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#edf2ec] p-3">
                      <p className="text-xs text-[#7b877f]">Requirements</p>
                      <p className="mt-1 text-sm font-semibold text-[#203028]">
                        {getRequirementsDone(selectedPlan)}/
                        {selectedPlan.requirements.length}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#edf2ec] p-3">
                      <p className="text-xs text-[#7b877f]">Files</p>
                      <p className="mt-1 text-sm font-semibold text-[#203028]">
                        {getFilesUploaded(selectedPlan)}/
                        {selectedPlan.files.length}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#7b877f]">
                      Panel Members
                    </p>
                    <div className="mt-2 space-y-2">
                      {selectedPlan.panelists.map((panelist) => (
                        <div
                          key={panelist.id}
                          className="rounded-xl border border-[#edf2ec] px-3 py-2"
                        >
                          <p className="text-xs font-semibold text-[#203028]">
                            {panelist.role}
                          </p>
                          <p className="mt-0.5 text-xs text-[#59645d]">
                            {panelist.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedPlan.evaluationStatus === "Submitted" && (
                    <div className="rounded-xl bg-[#fbfdfb] p-3">
                      <p className="text-xs font-semibold text-[#7b877f]">
                        Evaluation Summary
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[#203028]">
                        {getPlanAverage(selectedPlan)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#4f8f58]">
                        {getPlanOutcome(selectedPlan)}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[#59645d]">
                        {selectedPlan.evaluationData.remarks ||
                          "No remarks submitted."}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#7b877f]">
                  Select a defense record to view details.
                </p>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </DeanShell>
  );
}
