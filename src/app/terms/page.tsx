import type { Metadata } from "next";
import LegalPage, { Point } from "../_components/LegalPage";

export const metadata: Metadata = { title: "Terms and Conditions | Project Pulse" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      updated="November 2026"
      intro="Project Pulse is the capstone management system of the College of Information and Communications Technology, University of Batangas. By creating an account or choosing a password, you agree to these terms."
      other={{ href: "/privacy", label: "Privacy Policy" }}
    >
      <Point n={1} heading="Who may use it">
        <p>Students, advisers, panelists, grammarians, the Dean&apos;s Secretary and the Dean. A student account needs a UB student email, works right away, and the student then waits until an adviser adds them to a group. Faculty accounts are created by the Dean.</p>
      </Point>
      <Point n={2} heading="Your account">
        <p>Your password is yours alone. Nobody, not even the Dean, can see it. Do not share it, and tell the Dean right away if you think someone else used your account.</p>
      </Point>
      <Point n={3} heading="Your work">
        <p>What you submit stays your group&apos;s own work. You allow the department to store it, show it to your adviser, panelists, grammarian, Dean&apos;s Secretary and Dean, and keep it in the capstone records. Follow the university&apos;s rules on academic honesty.</p>
      </Point>
      <Point n={4} heading="What not to do">
        <p>Do not use another person&apos;s account, enter pages meant for other roles, upload harmful or unrelated files, send abusive or false messages, or try to break or copy the system.</p>
      </Point>
      <Point n={5} heading="Records and decisions">
        <p>Approvals, schedules, scores and certificates follow the department&apos;s own process. The signed papers kept by the department are the official record. Actions in the system are written to an audit log.</p>
      </Point>
      <Point n={6} heading="Changes and questions">
        <p>The Dean may disable an account that breaks these terms or when a person leaves the department. These terms may change. Ask the Dean&apos;s Secretary or the Dean if you have questions.</p>
      </Point>
    </LegalPage>
  );
}
