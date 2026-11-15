"use client";

import DeanShell from "../../_components/DeanShell";
import ScheduleSheet from "../../../_components/defenses/ScheduleSheet";

export default function DeanDefenseSchedulePage() {
  return (
    <DeanShell title="Defense schedule" hideContentTitle>
      <ScheduleSheet role="Dean" />
    </DeanShell>
  );
}
