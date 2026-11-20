// Shared account types. These match the roles and statuses stored in PostgreSQL.
export type UserRole =
  | "Student"
  | "Adviser"
  | "Panelist"
  | "Dean"
  | "Secretary"
  | "Grammarian";

export type UserStatus = "Pending" | "Active" | "Rejected" | "Disabled";
export type CourseCode = "BSCS" | "BSIS" | "BSIT" | "BLIS" | "ACT";

export type UserProfile = {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};
