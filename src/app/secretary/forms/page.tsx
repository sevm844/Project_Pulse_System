"use client";

import SecretaryShell from "../_components/SecretaryShell";
import FormsShelf from "../../_components/requirements/FormsShelf";

// The Dean's forms, kept on one shelf for everyone (read only).
export default function SecretaryFormsPage() {
  return (
    <SecretaryShell title="Forms">
      <FormsShelf role="Secretary" />
    </SecretaryShell>
  );
}
