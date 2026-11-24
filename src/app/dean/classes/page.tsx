"use client";

import DeanShell from "../_components/DeanShell";
import ClassesManager from "../../_components/classes/ClassesManager";

// The Dean's CAP101-2 class and its join code.
export default function DeanClassesPage() {
  return (
    <DeanShell title="Classes">
      <ClassesManager role="Dean" />
    </DeanShell>
  );
}
