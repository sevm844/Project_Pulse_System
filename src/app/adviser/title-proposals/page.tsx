import { redirect } from "next/navigation";

// Title proposals are now the first assignment inside Requirements.
export default function AdviserTitleProposalsPage() {
  redirect("/adviser/requirements");
}
