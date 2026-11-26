"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { openMonitoringForm } from "../../_lib/api";
import { fetchMonitoringForms, uploadMonitoringForm, type MonitoringSlot } from "../../_lib/advisers";
import { errorMessage } from "../../_lib/groups";
import { formatDateTime } from "../../_lib/requirements";

const HELP: Record<string, string> = {
  Alpha: "The Dean signs this part of the form after the Alpha defense, whether the group passed or failed.",
  Beta: "The Dean signs this part of the form after the Beta defense.",
  Omega: "The Dean signs this part of the form after the Omega defense.",
};

// The scanned Capstone Monitoring Form: three places, one for each of the Alpha, Beta and Omega defenses. The students scan the paper after the Dean signs it and
// hand it in; the group's Capstone and Technical advisers (and the Dean) open it in a new tab to see where the group stands.
export default function MonitoringForms({ projectId, canUpload = false }: { projectId: number; canUpload?: boolean }) {
  const [slots, setSlots] = useState<MonitoringSlot[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(() => {
    fetchMonitoringForms(projectId)
      .then((loaded) => {
        setSlots(loaded);
        setError("");
      })
      .catch((err) => setError(errorMessage(err, "Could not load the Capstone Monitoring Form.")));
  }, [projectId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function upload(type: string, file: File | undefined) {
    if (!file) return;
    setBusy(type);
    setError("");
    setNotice("");

    try {
      await uploadMonitoringForm(type, file);
      setNotice(`The ${type} scan was handed in. Your Capstone and Technical advisers were told.`);
      load();
    } catch (err) {
      setError(errorMessage(err, "Could not hand in the scan."));
    } finally {
      setBusy("");
      const input = inputs.current[type];
      if (input) input.value = "";
    }
  }

  async function open(scanId: number, name: string) {
    try {
      await openMonitoringForm(scanId, name);
    } catch (err) {
      setError(errorMessage(err, "Could not open the file."));
    }
  }

  return (
    <div>
      <p className="text-sm leading-6 text-[#7b877f]">
        {canUpload
          ? "After the Dean signs your Capstone Monitoring Form for a defense, scan the paper and hand it in here, once for each of the Alpha, Beta and Omega defenses. Your Capstone adviser and your Technical adviser can then see where your group stands. Supported file types: PDF or a picture, up to 10 MB."
          : "The scanned Capstone Monitoring Form of this group: one place for each of the Alpha, Beta and Omega defenses, signed by the Dean."}
      </p>

      {error && (
        <p role="alert" className="mt-3 text-xs font-semibold text-[#b42318]">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-xs font-semibold text-[#2f6b3c]">
          {notice}
        </p>
      )}
      {!slots && !error && <p className="mt-3 text-sm text-[#7b877f]">Loading...</p>}

      {slots && (
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {slots.map((slot) => (
            <li key={slot.defense_type} className="rounded-xl border border-[#dfe8df] bg-white p-4 shadow-[0_10px_30px_rgba(31,42,36,0.05)]">
              <p className="text-sm font-semibold text-[#203028]">{slot.defense_type} defense</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#7b877f]">{HELP[slot.defense_type]}</p>

              {slot.scans.length === 0 ? (
                <p className="mt-3 text-xs font-semibold text-amber-700">Nothing handed in yet</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {slot.scans.map((scan, index) => (
                    <li key={scan.scan_id} className="text-xs text-[#59645d]">
                      <button type="button" onClick={() => void open(scan.scan_id, scan.file_name)} className="max-w-full truncate text-left font-semibold text-[#123f2b] underline">
                        {scan.file_name}
                      </button>
                      <p className="mt-0.5 text-[11px] text-[#7b877f]">
                        {index === 0 ? "Newest" : "Earlier"} · {scan.submitted_by} · {formatDateTime(scan.submitted_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {canUpload && (
                <>
                  <input
                    ref={(element) => {
                      inputs.current[slot.defense_type] = element;
                    }}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(event) => void upload(slot.defense_type, event.target.files?.[0])}
                  />
                  <button
                    type="button"
                    disabled={busy === slot.defense_type}
                    onClick={() => inputs.current[slot.defense_type]?.click()}
                    className="mt-3 w-full rounded-lg border border-[#123f2b] px-3 py-2 text-xs font-semibold text-[#123f2b] transition hover:bg-[#edf9e9] disabled:opacity-60"
                  >
                    {busy === slot.defense_type ? "Handing in..." : slot.scans.length > 0 ? "Hand in a new scan" : "Hand in the scan"}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
