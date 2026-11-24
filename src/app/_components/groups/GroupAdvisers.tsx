"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fetchAvailableAdvisers, setGroupAdvisers, type NamedAdviser } from "../../_lib/advisers";
import { errorMessage, type ApiGroup } from "../../_lib/groups";

// The Capstone adviser and the Technical adviser of a group, named after its Proposal Defense. The AppDev adviser (or the Dean) names them here.
// Naming two other people hands the group over: it leaves the AppDev adviser's working list and stays in her history. A student only reads this.
export default function GroupAdvisers({
  group,
  canAssign = false,
  onChanged,
}: {
  group: ApiGroup;
  canAssign?: boolean;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const projectId = group.project?.project_id;
  const cap = group.capstone_adviser;
  const tech = group.technical_adviser;

  if (!projectId || !group.proposal_passed) return null;

  return (
    <div className="mt-3 rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#203028]">Capstone and Technical advisers</p>
          {cap && tech ? (
            <p className="mt-1 text-xs text-[#59645d]">
              Capstone adviser: <span className="font-semibold text-[#203028]">{cap.name}</span> · Technical adviser: <span className="font-semibold text-[#203028]">{tech.name}</span>
            </p>
          ) : canAssign ? (
            <p className="mt-1 text-xs text-amber-700">This group passed its Proposal Defense. Choose its Capstone adviser and its Technical adviser.</p>
          ) : (
            <p className="mt-1 text-xs text-amber-700">Wait for your Capstone adviser and your Technical adviser to be assigned by your AppDev adviser.</p>
          )}
        </div>
        {canAssign && (
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg bg-[#123f2b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0d3322]">
            {cap && tech ? "Change advisers" : "Assign advisers"}
          </button>
        )}
      </div>

      {open && (
        <AssignDialog
          projectId={projectId}
          groupName={group.group_name}
          capstoneId={cap?.user_id ?? 0}
          technicalId={tech?.user_id ?? 0}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}

function AssignDialog({
  projectId,
  groupName,
  capstoneId,
  technicalId,
  onClose,
  onSaved,
}: {
  projectId: number;
  groupName: string;
  capstoneId: number;
  technicalId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [advisers, setAdvisers] = useState<NamedAdviser[] | null>(null);
  const [capstone, setCapstone] = useState(capstoneId ? String(capstoneId) : "");
  const [technical, setTechnical] = useState(technicalId ? String(technicalId) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchAvailableAdvisers()
      .then((list) => {
        if (!cancelled) setAdvisers(list);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Could not load the advisers."));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setBusy(true);
    setError("");

    try {
      await setGroupAdvisers(projectId, Number(capstone), Number(technical));
      onSaved();
    } catch (err) {
      setError(errorMessage(err, "Could not save the advisers."));
      setBusy(false);
    }
  }

  const select = (value: string, set: (next: string) => void, label: string) => (
    <label className="block text-xs font-semibold text-[#203028]">
      {label}
      <select
        value={value}
        onChange={(event) => set(event.target.value)}
        className="mt-1 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
      >
        <option value="">Choose an adviser</option>
        {(advisers ?? []).map((adviser) => (
          <option key={adviser.user_id} value={adviser.user_id}>
            {adviser.name}
          </option>
        ))}
      </select>
    </label>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div role="dialog" aria-modal="true" aria-label="Assign advisers" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[#203028]">Advisers of {groupName}</h2>
        <p className="mt-1 text-sm leading-6 text-[#7b877f]">
          Choose one Capstone adviser and one Technical adviser. If you choose two other people, this group leaves your working list and stays in your history
          as handled in AppDev. If you choose yourself for either one, it stays with you. The students and both advisers are told.
        </p>

        <div className="mt-4 space-y-3">
          {select(capstone, setCapstone, "Capstone adviser")}
          {select(technical, setTechnical, "Technical adviser")}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-xs font-semibold text-[#b42318]">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold text-[#59645d] hover:bg-[#f3f7f1]">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy || !capstone || !technical || capstone === technical}
            className="rounded-lg bg-[#123f2b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0d3322] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save advisers"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
