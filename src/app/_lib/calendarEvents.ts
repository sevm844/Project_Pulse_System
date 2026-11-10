import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import { defenseState, formatTime, type ApiDefense } from "./defenses";
import type { ApiRequirement } from "./requirements";

export type CalendarRole =
  | "Student"
  | "Adviser"
  | "Dean"
  | "Panelist"
  | "Coordinator"
  | "Grammarian";

export type CalendarEvent = {
  id: string;
  // YYYY-MM-DD
  date: string;
  kind: "Defense" | "Due";
  title: string;
  detail: string;
  // A finished item (approved or completed): shown, but not counted as coming up.
  done: boolean;
  href: string;
};

// The backend only lets some roles read each list (see routes/api.php).
const READS_DEFENSES: CalendarRole[] = ["Student", "Adviser", "Dean", "Panelist"];
const READS_REQUIREMENTS: CalendarRole[] = ["Student", "Adviser", "Dean", "Coordinator", "Grammarian"];

const portal: Record<CalendarRole, string> = {
  Student: "/student",
  Adviser: "/adviser",
  Dean: "/dean",
  Panelist: "/panelist",
  Coordinator: "/coordinator",
  Grammarian: "/grammarian",
};

function defenseHref(role: CalendarRole) {
  return role === "Panelist" ? "/panelist" : `${portal[role]}/defense`;
}

function requirementHref(role: CalendarRole) {
  return role === "Grammarian" ? "/grammarian/review-queue" : `${portal[role]}/requirements`;
}

function defenseEvents(role: CalendarRole, defenses: ApiDefense[]): CalendarEvent[] {
  return defenses
    .filter((defense) => defense.defense_date && defense.status !== "Cancelled")
    .map((defense) => {
      const state = defenseState(defense);
      const parts = [formatTime(defense.defense_time), defense.venue, state.label].filter(Boolean);

      return {
        id: `defense-${defense.defense_id}`,
        date: defense.defense_date as string,
        kind: "Defense" as const,
        title: `${defense.defense_type}: ${defense.group_name}`,
        detail: parts.join(" · "),
        done: defense.status === "Completed",
        href: defenseHref(role),
      };
    });
}

function requirementEvents(role: CalendarRole, requirements: ApiRequirement[]): CalendarEvent[] {
  return requirements
    .filter((requirement) => requirement.due_date)
    .map((requirement) => {
      let detail = requirement.stage;
      let done = false;

      if (role === "Student") {
        const status = requirement.submission?.status;
        done = status === "Approved";
        detail = `${requirement.stage} · ${status ?? "Not submitted"}`;
      } else if (requirement.stats) {
        const { submitted, groups } = requirement.stats;
        detail = `${requirement.stage} · ${submitted} of ${groups} submitted`;
        done = groups > 0 && requirement.stats.approved >= groups;
      }

      return {
        id: `due-${requirement.requirement_id}`,
        date: requirement.due_date as string,
        kind: "Due" as const,
        title: requirement.title,
        detail,
        done,
        href: requirementHref(role),
      };
    });
}

// Real dates for one role: its defenses and the assignment due dates it is allowed to see.
export function useCalendarEvents(role: CalendarRole) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const found: CalendarEvent[] = [];
      let anyFailed = false;

      if (READS_DEFENSES.includes(role)) {
        try {
          found.push(...defenseEvents(role, await apiFetch<ApiDefense[]>("/defenses")));
        } catch {
          anyFailed = true;
        }
      }

      if (READS_REQUIREMENTS.includes(role)) {
        try {
          found.push(...requirementEvents(role, await apiFetch<ApiRequirement[]>("/requirements")));
        } catch {
          anyFailed = true;
        }
      }

      if (!active) return;

      found.sort((a, b) => a.date.localeCompare(b.date));
      setEvents(found);
      setFailed(anyFailed);
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [role]);

  return { events, loading, failed };
}
