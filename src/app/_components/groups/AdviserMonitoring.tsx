"use client";

import { useEffect, useState } from "react";
import { fetchAdvising, type AdvisingRow } from "../../_lib/advisers";
import { errorMessage } from "../../_lib/groups";
import RowToggle from "../RowToggle";
import MonitoringForm from "./MonitoringForm";

// On the adviser's Defenses page, under the team's name: the Capstone Monitoring Form of every group she is the Capstone or the Technical adviser of.
// She approves a row here, at least a day before the defense (her signature picture, with the date and time added by the system).
export default function AdviserMonitoring() {
  const [groups, setGroups] = useState<AdvisingRow[] | null>(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    fetchAdvising()
      .then((answer) => setGroups(answer.advising))
      .catch((err) => setError(errorMessage(err, "Could not load your groups.")));
  }, []);

  if (error) return <p role="alert" className="mt-8 text-xs font-semibold text-[#b42318]">{error}</p>;
  if (!groups || groups.length === 0) return null;

  return (
    <section className="mt-10">
      <h3 className="text-lg font-semibold text-[#203028]">Capstone Monitoring Forms</h3>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-[#7b877f]">
        The groups you advise as Capstone or Technical adviser. Open a group to approve the row of its Alpha, Beta or Omega defense with your signature, at least a day before the defense.
      </p>

      <ul className="mt-4 space-y-3">
        {groups.map((group) => {
          const open = openId === group.project_id;

          return (
            <li key={group.project_id} className="overflow-hidden rounded-xl border border-[#dfe8df] bg-white shadow-[0_6px_18px_rgba(31,42,36,0.05)]">
              <button type="button" onClick={() => setOpenId(open ? null : group.project_id)} aria-expanded={open} className="group flex w-full items-center gap-4 px-5 py-4 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#123f2b]">{group.group_name}</span>
                  <span className="mt-0.5 block text-xs text-[#7b877f]">
                    {group.course} {group.section}
                    {group.my_roles && group.my_roles.length > 0 ? ` · Your role: ${group.my_roles.join(" and ")}` : ""}
                  </span>
                </span>
                <RowToggle open={open} />
              </button>

              {open && (
                <div className="border-t border-[#edf2ec] bg-[#fbfdfb] p-5">
                  <MonitoringForm projectId={group.project_id} role="Adviser" />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
