"use client";

import { useEffect, useState } from "react";
import DeanShell from "../../_components/DeanShell";
import Card from "../../_components/Card";
import {
  clockLabel,
  fetchMessagingSettings,
  saveMessagingSettings,
  type MessagingSettings,
} from "../../../_lib/messages";

const DEFAULT_SETTINGS: MessagingSettings = {
  enabled: true,
  start_time: "05:00",
  end_time: "20:00",
  note: "Students can message during the configured availability window.",
  open_now: true,
};

export default function DeanMessageSettingsPage() {
  const [schedule, setSchedule] = useState<MessagingSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMessagingSettings()
      .then((settings) => {
        setSchedule(settings);
        setLoaded(true);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load the messaging window."),
      );
  }, []);

  function updateSchedule<K extends keyof MessagingSettings>(
    field: K,
    value: MessagingSettings[K],
  ) {
    setSchedule((current) => ({
      ...current,
      [field]: value,
    }));
    setSavedMessage("");
  }

  async function persist(next: MessagingSettings, done: string) {
    setSaving(true);
    setError("");
    setSavedMessage("");

    try {
      setSchedule(await saveMessagingSettings(next));
      setSavedMessage(done);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the messaging window.");
    } finally {
      setSaving(false);
    }
  }

  const saveSchedule = () => persist(schedule, "Messaging window updated.");
  const resetSchedule = () => persist(DEFAULT_SETTINGS, "Default messaging window restored.");

  const currentlyOpen = schedule.open_now;
  const windowLabel = `${clockLabel(schedule.start_time)} - ${clockLabel(schedule.end_time)}`;

  return (
    <DeanShell title="Messaging Window">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#203028]">
                Student Messaging Availability
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#59645d]">
                Control when students can send messages from the portal.
                Advisers and staff can message at any time.
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                schedule.enabled
                  ? currentlyOpen
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {schedule.enabled
                ? currentlyOpen
                  ? "Currently open"
                  : "Currently closed"
                : "Restriction off"}
            </span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4 text-xs font-semibold text-[#203028]">
              Start time
              <input
                type="time"
                value={schedule.start_time}
                onChange={(event) =>
                  updateSchedule("start_time", event.target.value)
                }
                className="mt-2 h-11 w-full rounded-lg border border-[#dfe8df] bg-white px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4 text-xs font-semibold text-[#203028]">
              End time
              <input
                type="time"
                value={schedule.end_time}
                onChange={(event) =>
                  updateSchedule("end_time", event.target.value)
                }
                className="mt-2 h-11 w-full rounded-lg border border-[#dfe8df] bg-white px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-xl border border-[#edf2ec] bg-white p-4">
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={(event) =>
                updateSchedule("enabled", event.target.checked)
              }
              className="mt-1 h-4 w-4 accent-[#123f2b]"
            />
            <span>
              <span className="block text-sm font-semibold text-[#203028]">
                Restrict student sending outside this window
              </span>
              <span className="mt-1 block text-xs leading-5 text-[#59645d]">
                When enabled, students can read messages anytime but cannot
                send outside the allowed hours.
              </span>
            </span>
          </label>

          <label className="mt-5 block text-xs font-semibold text-[#203028]">
            Admin note
            <textarea
              value={schedule.note}
              onChange={(event) => updateSchedule("note", event.target.value)}
              className="mt-2 min-h-24 w-full resize-none rounded-xl border border-[#dfe8df] bg-white px-3 py-3 text-sm font-normal leading-6 text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
            />
          </label>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveSchedule}
              disabled={!loaded || saving}
              className="rounded-full bg-[#123f2b] px-5 py-2.5 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(73,169,90,0.22)] hover:bg-[#0f3324] disabled:opacity-50"
            >
              Save messaging window
            </button>

            <button
              type="button"
              onClick={resetSchedule}
              disabled={!loaded || saving}
              className="rounded-full border border-[#dfe8df] bg-white px-5 py-2.5 text-xs font-semibold text-[#59645d] hover:bg-[#f3f7f1]"
            >
              Restore default
            </button>

            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

            {savedMessage && (
              <p className="text-xs font-semibold text-emerald-700">
                {savedMessage}
              </p>
            )}
          </div>
        </Card>

        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-[#203028]">
              Active Rule
            </h2>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-[#203028]">
              {windowLabel}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#59645d]">
              {schedule.enabled
                ? "Students can send messages only during this window."
                : "Students can send messages at any time."}
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-[#203028]">
              Recommended Setup
            </h2>
            <div className="mt-4 space-y-3 text-sm text-[#59645d]">
              <p className="rounded-xl bg-[#f8faf7] px-4 py-3">
                Use 05:00 to 20:00 if students should stop sending messages
                after 8:00 PM.
              </p>
              <p className="rounded-xl bg-[#f8faf7] px-4 py-3">
                The server enforces this window, so students cannot get around
                it. Times are Philippine time.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </DeanShell>
  );
}
