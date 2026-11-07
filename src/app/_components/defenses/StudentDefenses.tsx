"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../_lib/api";
import { defenseState, formatTime, type ApiDefense } from "../../_lib/defenses";
import { errorMessage } from "../../_lib/groups";
import { formatDate } from "../../_lib/requirements";

// What the group sees: when, where, who is on the panel, and the result once the Dean records it.
export default function StudentDefenses() {
  const [defenses, setDefenses] = useState<ApiDefense[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setDefenses(await apiFetch<ApiDefense[]>("/defenses"));
      } catch (err) {
        setError(errorMessage(err, "Unable to load your defenses."));
      }
    }

    void load();
  }, []);

  const upcoming = (defenses ?? []).filter((item) => item.status === "Scheduled");
  const earlier = (defenses ?? [])
    .filter((item) => item.status !== "Scheduled")
    .sort((a, b) => (b.defense_date ?? "").localeCompare(a.defense_date ?? ""));

  return (
    <div className="mx-auto max-w-3xl">
      {error && (
        <p role="alert" className="text-sm text-[#b42318]">
          {error}
        </p>
      )}

      {defenses === null && !error && <p className="text-sm text-[#7b877f]">Loading...</p>}

      {defenses?.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-sm font-semibold text-[#203028]">No defense scheduled yet</p>
          <p className="mt-1 text-sm text-[#7b877f]">
            Your adviser or the Dean will schedule it. It will appear here.
          </p>
        </div>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#203028]">Coming up</h2>
          <ul className="mt-3 space-y-3">
            {upcoming.map((defense) => (
              <DefenseCard key={defense.defense_id} defense={defense} />
            ))}
          </ul>
        </section>
      )}

      {earlier.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-[#203028]">Earlier</h2>
          <ul className="mt-3 space-y-3">
            {earlier.map((defense) => (
              <DefenseCard key={defense.defense_id} defense={defense} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function DefenseCard({ defense }: { defense: ApiDefense }) {
  const state = defenseState(defense);

  return (
    <li className="rounded-xl border border-[#edf2ec] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#203028]">{defense.defense_type}</p>
          <p className="mt-0.5 text-xs text-[#7b877f]">
            {formatDate(defense.defense_date)} · {formatTime(defense.defense_time)} · {defense.venue}
          </p>
        </div>

        <span className="flex items-center gap-2 text-xs text-[#59645d]">
          <span className={`h-2 w-2 rounded-full ${state.dot}`} />
          {state.label}
        </span>
      </div>

      {defense.panel.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-[#59645d]">
          <span className="font-semibold text-[#203028]">Panel: </span>
          {defense.panel
            .map((member) => `${member.name}${member.role === "Chair" ? " (Chair)" : ""}`)
            .join(", ")}
        </p>
      )}

      {defense.status === "Completed" && defense.remarks && (
        <p className="mt-2 border-l-2 border-[#d7f7d8] pl-3 text-xs leading-5 text-[#59645d]">{defense.remarks}</p>
      )}
    </li>
  );
}
