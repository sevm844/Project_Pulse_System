import type { UserRole } from "./types";

// Where each role lands after signing in, or after switching to it.
export function roleHomePath(role: UserRole): string {
  // The student dashboard checks the group on the server and sends the student to /student/setup when there is no accepted group yet.
  if (role === "Student") return "/student";
  if (role === "Adviser") return "/adviser";
  if (role === "Dean") return "/dean";
  if (role === "Coordinator") return "/coordinator";
  if (role === "Panelist") return "/panelist";
  if (role === "Grammarian") return "/grammarian";

  return "/login";
}
