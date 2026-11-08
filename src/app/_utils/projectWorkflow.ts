// Module 2 (Groups / Title Proposals) stages, in order. A group moves through them only by explicit actions:
//   Title Proposal -> Dean's Endorsement      the Adviser sends the group to the Dean
//   Dean's Endorsement -> Client Consultation the Dean's sign-off
//   Client Consultation -> Ready for Proposal Defense   the Adviser picks the single title
// Later phases belong to other modules (Defenses, Requirements, Records) and are tracked there.
export const PROPOSAL_STAGES = [
  "Title Proposal",
  "Dean's Endorsement",
  "Client Consultation",
  "Ready for Proposal Defense",
] as const;

export type ProposalStage = (typeof PROPOSAL_STAGES)[number];

// The phase a requirement is for (Module 3). Independent of the proposal stages above.
export const REQUIREMENT_STAGES = [
  "Proposal Defense",
  "Frontend",
  "CAP101",
  "CAP102",
  "Alpha Defense",
  "Beta Defense",
  "Omega Defense",
  "Final Defense",
  "Final Approval",
] as const;
