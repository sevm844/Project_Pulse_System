"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "../../_lib/api";
import { errorMessage, type ApiGroup } from "../../_lib/groups";
import {
  DEFENSE_TYPES,
  todayInManila,
  type ApiDefense,
  type ApiPanelist,
} from "../../_lib/defenses";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]";

type Props = {
  // Editing keeps the group and type fixed and changes when, where and who.
  defense?: ApiDefense;
  onClose: () => void;
  onSaved: (message: string) => void;
};

export default function ScheduleDialog({ defense, onClose, onSaved }: Props) {
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [panelists, setPanelists] = useState<ApiPanelist[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState(defense ? String(defense.project_id) : "");
  const [type, setType] = useState<string>(defense?.defense_type ?? DEFENSE_TYPES[0]);
  const [date, setDate] = useState(defense?.defense_date ?? "");
  const [time, setTime] = useState(defense?.defense_time ?? "");
  const [venue, setVenue] = useState(defense?.venue ?? "");
  const [picked, setPicked] = useState<number[]>(defense?.panel.map((item) => item.panelist_id) ?? []);
  const [chairId, setChairId] = useState<number | null>(
    defense?.panel.find((item) => item.role === "Chair")?.panelist_id ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [groupList, panelistList] = await Promise.all([
          apiFetch<ApiGroup[]>("/groups"),
          apiFetch<ApiPanelist[]>("/panelists"),
        ]);

        setGroups(groupList.filter((group) => group.project));
        setPanelists(panelistList);
      } catch (err) {
        setError(errorMessage(err, "Unable to load groups and panelists."));
      }

      setLoading(false);
    }

    void load();
  }, []);

  function togglePanelist(id: number) {
    setPicked((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

    if (chairId === id) setChairId(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const schedule = {
      defense_date: date,
      defense_time: time,
      venue: venue.trim(),
      panelist_ids: picked,
      chair_id: chairId,
    };

    try {
      if (defense) {
        await apiFetch(`/defenses/${defense.defense_id}`, {
          method: "PUT",
          body: JSON.stringify(schedule),
        });
      } else {
        await apiFetch("/defenses", {
          method: "POST",
          body: JSON.stringify({ project_id: Number(projectId), defense_type: type, ...schedule }),
        });
      }

      onSaved(defense ? "Defense updated." : "Defense scheduled.");
    } catch (err) {
      setError(errorMessage(err, "Unable to save the defense."));
      setSaving(false);
    }
  }

  const ready = Boolean((defense || projectId) && date && time && venue.trim() && picked.length > 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1f2a24]/40 p-4">
      <form
        onSubmit={save}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-dialog-title"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_70px_rgba(31,42,36,0.22)]"
      >
        <h2 id="schedule-dialog-title" className="text-lg font-semibold text-[#203028]">
          {defense ? "Edit defense" : "Schedule a defense"}
        </h2>
        <p className="mt-1 text-xs text-[#7b877f]">
          {defense
            ? `${defense.group_name} · ${defense.defense_type}`
            : "The group and the panel will see it right away."}
        </p>

        <div className="mt-5 space-y-4">
          {!defense && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-[#59645d]">
                Group
                <select
                  required
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  className={fieldClass}
                >
                  <option value="">{loading ? "Loading..." : "Choose a group"}</option>
                  {groups.map((group) => (
                    <option key={group.group_id} value={group.project?.project_id}>
                      {group.group_name} · {group.course} {group.section}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-[#59645d]">
                Defense
                <select value={type} onChange={(event) => setType(event.target.value)} className={fieldClass}>
                  {DEFENSE_TYPES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-[#59645d]">
              Date
              <input
                required
                type="date"
                min={todayInManila()}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="block text-xs font-semibold text-[#59645d]">
              Time
              <input
                required
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className={fieldClass}
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-[#59645d]">
            Venue
            <input
              required
              maxLength={150}
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="e.g., Room 204 or a meeting link"
              className={fieldClass}
            />
          </label>

          <div>
            <p className="text-xs font-semibold text-[#59645d]">Panel</p>

            {!loading && panelists.length === 0 ? (
              <p className="mt-1.5 text-xs text-[#7b877f]">
                No active panelists yet. The Dean can create Panelist accounts in Administration, Users.
              </p>
            ) : (
              <ul className="mt-1.5 max-h-48 divide-y divide-[#edf2ec] overflow-y-auto rounded-lg border border-[#dfe8df]">
                {panelists.map((panelist) => {
                  const on = picked.includes(panelist.user_id);

                  return (
                    <li key={panelist.user_id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <label className="flex min-w-0 items-center gap-2.5">
                        <input type="checkbox" checked={on} onChange={() => togglePanelist(panelist.user_id)} />
                        <span className="truncate text-[#203028]">{panelist.name}</span>
                      </label>

                      {on && (
                        <button
                          type="button"
                          onClick={() => setChairId(chairId === panelist.user_id ? null : panelist.user_id)}
                          className={`shrink-0 text-xs font-semibold ${
                            chairId === panelist.user_id ? "text-[#2f6f3a]" : "text-[#9aa59e] hover:text-[#203028]"
                          }`}
                        >
                          {chairId === panelist.user_id ? "Chair" : "Make chair"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-[#b42318]">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#59645d] hover:bg-[#f3f7f1]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !ready}
            className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
          >
            {saving ? "Saving..." : defense ? "Save changes" : "Schedule"}
          </button>
        </div>
      </form>
    </div>
  );
}
