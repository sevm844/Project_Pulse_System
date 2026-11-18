import type { Metadata } from "next";
import LegalPage, { Point } from "../_components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy | Project Pulse" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="November 2026"
      intro="What Project Pulse keeps about you and why. We follow the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines."
      other={{ href: "/terms", label: "Terms and Conditions" }}
    >
      <Point n={1} heading="What we keep">
        <p>Your name, UB email, role, course and section; your photo, calendar notes and signature if you add them; your group, titles, manuscripts, files, comments and messages; defense results; sign-in and audit records. Your password is stored scrambled and cannot be read back.</p>
      </Point>
      <Point n={2} heading="Why we keep it">
        <p>To run the capstone process: forming groups, reviewing work, scheduling defenses, issuing certificates and keeping the final records, and to send you notices about your work.</p>
      </Point>
      <Point n={3} heading="Who can see it">
        <p>Only people who need it, limited by role: your group, adviser, panelists, the grammarian, the Research Coordinator and the Dean. Private drafts are seen only by your group. Nothing is sold or shared for advertising.</p>
      </Point>
      <Point n={4} heading="Emails">
        <p>We email account links (confirm account, set or reset a password) and a copy of important notices such as submissions, decisions and defense schedules. Chat messages are not emailed.</p>
      </Point>
      <Point n={5} heading="How long, and how safe">
        <p>Capstone records stay in the university&apos;s archive; unused accounts are disabled. Access needs your sign-in, each role sees only its own pages, and sign-ins are limited after wrong passwords.</p>
      </Point>
      <Point n={6} heading="Your rights">
        <p>You may ask to see, correct or object to the use of your information. Ask the Research Coordinator or the Dean. You can correct your name and photo on your profile.</p>
      </Point>
    </LegalPage>
  );
}
