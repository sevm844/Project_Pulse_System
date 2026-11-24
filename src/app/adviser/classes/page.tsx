"use client";

import AdviserShell from "../_components/AdviserShell";
import ClassesManager from "../../_components/classes/ClassesManager";

// The adviser's AppDev classes and their join codes.
export default function AdviserClassesPage() {
  return (
    <AdviserShell title="Classes">
      <ClassesManager role="Adviser" />
    </AdviserShell>
  );
}
