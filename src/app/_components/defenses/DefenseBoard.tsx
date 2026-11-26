"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../_lib/api";
import {
  DEFENSE_RESULTS,
  defenseState,
  formatTime,
  type ApiDefense,
} from "../../_lib/defenses";
import { errorMessage } from "../../_lib/groups";
import { formatDate } from "../../_lib/requirements";
import RowToggle from "../RowToggle";
import { focusId, readFocus, scrollToFocus } from "../../_lib/focus";
import DefenseDocuments from "./DefenseDocuments";
import RubricDialog from "./RubricDialog";
import ScheduleDialog from "./ScheduleDialog";

type Role = "Adviser" | "Dean";

const blurb: Record<Role, string> = {
  Adviser: "Schedule the Proposal Defense of all your groups at once, choose the panel, read the evaluations, and record the result. The later defenses are handled by the Dean.",
  Dean: "Schedule defenses for many groups at once, follow the panels' evaluations, and record the result of every defense after the Proposal Defense.",
};

export default function DefenseBoard({ role }: { role: Role }) {
  const [defenses, setDefenses] = useState<ApiDefense[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [openId, setOpenId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<{ defense?: ApiDefense } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      setDefenses(await apiFetch<ApiDefense[]>("/defenses"));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load defenses."));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  // A notice may name one defense (?defense=7): show the tab it is in, open it and scroll to it, once.
  const focusDone = useRef(false);

  useEffect(() => {
    if (loading || focusDone.current) return;
    focusDone.current = true;

    const wanted = readFocus().defense;
    const target = wanted ? defenses.find((item) => item.defense_id === wanted) : undefined;

    if (!target) return;

    queueMicrotask(() => {
      setTab(target.status === "Scheduled" ? "upcoming" : "past");
      setOpenId(target.defense_id);
    });
    scrollToFocus(focusId.defense(target.defense_id));
  }, [loading, defenses]);

  const upcoming = defenses.filter((item) => item.status === "Scheduled");
  const past = defenses
    .filter((item) => item.status !== "Scheduled")
    .sort((a, b) => (b.defense_date ?? "").localeCompare(a.defense_date ?? ""));
  const visible = tab === "upcoming" ? upcoming : past;

  async function changed(message: string) {
    setNotice(message);
    await load();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-xl text-sm leading-6 text-[#7b877f]">{blurb[role]}</p>
        <Link
          href={role === "Adviser" ? "/adviser/defense/schedule" : "/dean/defense/schedule"}
          className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
        >
          Schedule defense
        </Link>
      </div>

      <div className="mt-6 flex gap-5 border-b border-[#edf2ec] text-xs font-semibold">
        {(
          [
            ["upcoming", `Upcoming (${upcoming.length})`],
            ["past", `Past (${past.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 pb-3 ${
              tab === key ? "border-[#123f2b] text-[#203028]" : "border-transparent text-[#9aa59e] hover:text-[#59645d]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-[#b42318]">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="mt-4 text-sm text-[#2f6f3a]">
          {notice}
        </p>
      )}

      {loading && <p className="mt-8 text-sm text-[#7b877f]">Loading...</p>}

      {!loading && visible.length === 0 && !error && (
        <p className="mt-12 text-center text-sm text-[#9aa59e]">
          {tab === "upcoming" ? "No defenses are scheduled." : "No past defenses yet."}
        </p>
      )}

      {visible.length > 0 && <div className="mt-4 overflow-x-auto rounded-xl border border-[#dfe8df] bg-white shadow-[0_6px_18px_rgba(31,42,36,0.05)]">
      <table className="w-full min-w-[56rem] text-left text-sm">
        <thead className="bg-[#154530] text-xs font-semibold text-white">
          <tr>
            {["Group", "Defense", "Date", "Time", "Room", "Panel", "Evaluated", "Status"].map((heading) => <th key={heading} scope="col" className="px-4 py-3">{heading}</th>)}
            <th scope="col" className="px-4 py-3"><span className="sr-only">Details</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2ec]">
        {visible.map((defense) => (
          <DefenseRow
            key={defense.defense_id}
            defense={defense}
            role={role}
            open={openId === defense.defense_id}
            onToggle={() => {
              setNotice("");
              setOpenId(openId === defense.defense_id ? null : defense.defense_id);
            }}
            onEdit={() => setDialog({ defense })}
            onChanged={changed}
            onError={setError}
          />
        ))}
        </tbody>
      </table>
      </div>}

      {dialog && (
        <ScheduleDialog
          defense={dialog.defense}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null);
            void changed(message);
          }}
        />
      )}
    </div>
  );
}

function DefenseRow({
  defense,
  role,
  open,
  onToggle,
  onEdit,
  onChanged,
  onError,
}: {
  defense: ApiDefense;
  role: Role;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onChanged: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [result, setResult] = useState<string>(DEFENSE_RESULTS[0]);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  // The adviser records the Proposal Defense (the group is still hers); the Dean records every later defense.
  const isProposal = defense.defense_type === "Proposal Defense";
  const canRecord = defense.actionable !== false && (isProposal ? role === "Adviser" || (role === "Dean" && !defense.adviser) : role === "Dean");
  const [viewing, setViewing] = useState<{ id: number; name: string } | null>(null);

  const state = defenseState(defense);
  const evaluated = defense.panel.filter((member) => member.evaluated).length;
  const everyoneDone = defense.panel.length > 0 && evaluated === defense.panel.length;
  const scheduled = defense.status === "Scheduled";

  async function send(path: string, method: "PUT", body: object | null, message: string) {
    setBusy(true);

    try {
      await apiFetch(`/defenses/${defense.defense_id}${path}`, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      });
      await onChanged(`${defense.group_name}: ${message}`);
    } catch (err) {
      onError(errorMessage(err, "Unable to save."));
    }

    setBusy(false);
  }

  function cancel() {
    if (!window.confirm(`Cancel the ${defense.defense_type} of ${defense.group_name}?`)) return;

    void send("/cancel", "PUT", null, "defense cancelled.");
  }

  return (
    <>
      <tr id={focusId.defense(defense.defense_id)} onClick={onToggle} className={`cursor-pointer align-top transition hover:bg-[#fbfdfb] ${open ? "bg-[#fbfdfb]" : ""}`}>
        <td className="px-4 py-3.5">
          <p className="font-bold text-[#123f2b]">{defense.group_name}</p>
          <p className="mt-0.5 text-xs text-[#7b877f]">{defense.course} {defense.section}</p>
        </td>
        <td className="px-4 py-3.5 text-xs font-semibold text-[#2f6b3c]">{defense.defense_type}</td>
        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-[#203028]">{formatDate(defense.defense_date)}</td>
        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-[#203028]">{formatTime(defense.defense_time)}</td>
        <td className="px-4 py-3.5 text-xs text-[#203028]">{defense.venue}</td>
        <td className="px-4 py-3.5 text-xs leading-5 text-[#59645d]">
          {defense.panel.length === 0 ? <span className="text-[#9aa59e]">No panel yet</span> : defense.panel.map((member) => <p key={member.panelist_id}>{member.name}{member.role === "Chair" ? " (Chair)" : ""}</p>)}
        </td>
        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-[#59645d]">{evaluated}/{defense.panel.length}</td>
        <td className="px-4 py-3.5 text-xs text-[#59645d]">
          <span className="flex items-center gap-2 whitespace-nowrap">
            <span className={`h-2 w-2 shrink-0 rounded-full ${state.dot}`} />
            {state.label}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <button type="button" aria-expanded={open} onClick={(event) => { event.stopPropagation(); onToggle(); }} className="group">
            <RowToggle open={open} />
          </button>
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={9} className="p-0">
        <div className="space-y-5 border-t border-[#edf2ec] bg-[#fbfdfb] p-5 text-sm">
          <p className="text-xs text-[#7b877f]">
            {defense.course} {defense.section}
            {defense.adviser ? ` · Adviser ${defense.adviser}` : ""}
            {` · ${defense.project_title ?? "No title chosen yet"}`}
          </p>

          <div>
            <p className="text-xs font-semibold text-[#203028]">Panel</p>
            <ul className="mt-1.5 space-y-1 text-xs text-[#59645d]">
              {defense.panel.map((member) => (
                <li key={member.panelist_id} className="flex items-center justify-between gap-4">
                  <span>
                    {member.name}
                    {member.role === "Chair" ? " · Chair" : ""}
                  </span>
                  <span className="text-[#9aa59e]">{member.evaluated ? "Evaluated" : "Waiting"}</span>
                </li>
              ))}
            </ul>
          </div>

          {defense.evaluations && defense.evaluations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#203028]">
                Evaluations
                {defense.average_score != null ? ` · average ${defense.average_score}` : ""}
              </p>
              <ul className="mt-1.5 divide-y divide-[#edf2ec] text-xs">
                {defense.evaluations.map((evaluation) => (
                  <li key={evaluation.panelist_id} className="py-2">
                    <p className="flex justify-between gap-4 text-[#203028]">
                      <span className="font-semibold">{evaluation.name}</span>
                      <span>
                        {evaluation.rubric ? `${evaluation.rubric.total} / ${evaluation.rubric.max} (${evaluation.score}%)` : evaluation.score} · {evaluation.recommendation}
                      </span>
                    </p>
                    {evaluation.remarks && <p className="mt-1 leading-5 text-[#7b877f]">{evaluation.remarks}</p>}
                    {evaluation.rubric && (
                      <button
                        type="button"
                        onClick={() => setViewing({ id: evaluation.panelist_id, name: evaluation.name ?? "Panelist" })}
                        className="mt-1.5 text-[11px] font-semibold text-[#4f8f58] hover:underline"
                      >
                        View rubric
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {defense.status === "Completed" && (
            <p className="text-xs text-[#59645d]">
              <span className="font-semibold text-[#203028]">Result: {defense.result}.</span>
              {defense.remarks ? ` ${defense.remarks}` : ""}
            </p>
          )}

          <DefenseDocuments defenseId={defense.defense_id} />

          {scheduled && (
            <div className="space-y-3 border-t border-[#edf2ec] pt-4">
              {!canRecord && (
                <p className="text-xs text-[#7b877f]">
                  {isProposal ? "The group's adviser records the Proposal Defense result." : "The Dean records this result once every panelist has evaluated."}
                </p>
              )}
              {canRecord && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#203028]">Record the result</p>
                  {!everyoneDone && (
                    <p className="text-xs text-[#7b877f]">Available once every panelist has evaluated.</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={result}
                      onChange={(event) => setResult(event.target.value)}
                      disabled={!everyoneDone}
                      className="rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none disabled:opacity-50"
                    >
                      {DEFENSE_RESULTS.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                    <input
                      value={remarks}
                      onChange={(event) => setRemarks(event.target.value)}
                      disabled={!everyoneDone}
                      maxLength={2000}
                      placeholder="Remarks for the group (optional)"
                      className="min-w-48 flex-1 rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none disabled:opacity-50"
                    />
                    <button
                      type="button"
                      disabled={busy || !everyoneDone}
                      onClick={() =>
                        void send("/result", "PUT", { result, remarks: remarks.trim() || null }, "result recorded.")
                      }
                      className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
                    >
                      Record
                    </button>
                  </div>
                </div>
              )}

              {defense.actionable !== false && <div className="flex gap-4 text-xs font-semibold">
                <button type="button" onClick={onEdit} className="text-[#4f8f58] hover:underline">
                  Reschedule or change panel
                </button>
                <button type="button" disabled={busy} onClick={cancel} className="text-[#b42318] hover:underline">
                  Cancel defense
                </button>
              </div>}
            </div>
          )}
        </div>
        {viewing && <RubricDialog defenseId={defense.defense_id} panelistId={viewing.id} panelistName={viewing.name} onClose={() => setViewing(null)} />}
          </td>
        </tr>
      )}
    </>
  );
}
