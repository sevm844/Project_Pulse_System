"use client";

import AdviserShell from "../../_components/AdviserShell";
import ScheduleSheet from "../../../_components/defenses/ScheduleSheet";

export default function AdviserDefenseSchedulePage() {
  return (
    <AdviserShell title="Defense schedule" hideContentTitle>
      <ScheduleSheet role="Adviser" />
    </AdviserShell>
  );
}
