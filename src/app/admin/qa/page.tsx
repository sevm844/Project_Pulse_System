"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "../_components/AdminShell";
import Card from "../_components/Card";
import {
  getStoredBugReports,
  getStoredQATests,
  updateBugStatus,
  updateQATestStatus,
  type BugReport,
  type QATestCase,
  type QATestStatus,
  type QATestType,
} from "../../_utils/qaStorage";

const testTypes: Array<"All" | QATestType> = [
  "All",
  "Functional",
  "Performance",
  "Bug",
];

const testStatuses: Array<"All" | QATestStatus> = [
  "All",
  "Passed",
  "Failed",
  "Pending",
  "Retesting",
];

function statusClasses(status: string) {
  if (status === "Passed" || status === "Closed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "Fixed" || status === "Retesting") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "Failed" || status === "Open") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-amber-50 text-amber-700";
}

function severityClasses(severity: BugReport["severity"]) {
  if (severity === "High") return "bg-rose-50 text-rose-700";
  if (severity === "Medium") return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
}

export default function AdminQAPage() {
  const [tests, setTests] = useState<QATestCase[]>([]);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [typeFilter, setTypeFilter] = useState<"All" | QATestType>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | QATestStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setTests(getStoredQATests());
    setBugs(getStoredBugReports());
  }, []);

  const visibleTests = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return tests.filter((test) => {
      const matchesType = typeFilter === "All" || test.type === typeFilter;
      const matchesStatus =
        statusFilter === "All" || test.status === statusFilter;
      const matchesSearch =
        !query ||
        [
          test.module,
          test.testCase,
          test.expectedResult,
          test.actualResult,
          test.testedBy,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [searchQuery, statusFilter, tests, typeFilter]);

  function handleTestStatus(id: number, status: QATestStatus) {
    setTests(updateQATestStatus(id, status));
  }

  function handleBugStatus(id: number, status: BugReport["status"]) {
    setBugs(updateBugStatus(id, status));
  }

  const passedCount = tests.filter((test) => test.status === "Passed").length;
  const failedCount = tests.filter((test) => test.status === "Failed").length;
  const openBugCount = bugs.filter((bug) => bug.status === "Open").length;

  return (
    <AdminShell title="Quality Assurance">
      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            Testing & Quality Assurance
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Track functional tests, workflow validation, responsiveness checks,
            scalability notes, bug fixes, and retesting.
          </p>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Total Tests", tests.length],
            ["Passed", passedCount],
            ["Failed", failedCount],
            ["Open Bugs", openBugCount],
          ].map(([label, value]) => (
            <Card key={label} className="p-5">
              <p className="text-xs text-[#7b877f]">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-[#203028]">
                {value}
              </p>
            </Card>
          ))}
        </div>

        <Card className="p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px]">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search module, test case, result, or tester..."
              className="rounded-lg border border-[#dfe8df] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
            />

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "All" | QATestType)
              }
              className="rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none"
            >
              {testTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "All" | QATestStatus)
              }
              className="rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none"
            >
              {testStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Module</th>
                  <th className="px-5 py-3 font-medium">Test Case</th>
                  <th className="px-5 py-3 font-medium">Expected</th>
                  <th className="px-5 py-3 font-medium">Actual</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Retest</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2ec]">
                {visibleTests.map((test) => (
                  <tr key={test.id} className="hover:bg-[#fbfdfb]">
                    <td className="px-5 py-4 text-[#59645d]">{test.type}</td>
                    <td className="px-5 py-4 font-semibold text-[#203028]">
                      {test.module}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {test.testCase}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {test.expectedResult}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {test.actualResult}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                          test.status,
                        )}`}
                      >
                        {test.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={test.status}
                        onChange={(event) =>
                          handleTestStatus(
                            test.id,
                            event.target.value as QATestStatus,
                          )
                        }
                        className="rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none"
                      >
                        {testStatuses
                          .filter((item) => item !== "All")
                          .map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold text-[#203028]">
            Bug Resolution
          </h3>
          <p className="mt-1 text-sm text-[#7b877f]">
            Identify issues, record fixes, and retest after resolution.
          </p>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {bugs.map((bug) => (
              <article
                key={bug.id}
                className="rounded-xl border border-[#dfe8df] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-semibold text-[#203028]">
                    {bug.issue}
                  </h4>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${severityClasses(
                      bug.severity,
                    )}`}
                  >
                    {bug.severity}
                  </span>
                </div>

                <p className="mt-2 text-xs text-[#7b877f]">{bug.module}</p>

                <p className="mt-4 rounded-lg bg-[#f8faf7] p-3 text-xs leading-5 text-[#59645d]">
                  {bug.fixNote || "No fix note yet."}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                      bug.status,
                    )}`}
                  >
                    {bug.status}
                  </span>

                  <select
                    value={bug.status}
                    onChange={(event) =>
                      handleBugStatus(
                        bug.id,
                        event.target.value as BugReport["status"],
                      )
                    }
                    className="rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none"
                  >
                    {["Open", "Fixed", "Retesting", "Closed"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
