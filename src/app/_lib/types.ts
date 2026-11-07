// Shared account types. These match the roles and statuses stored in PostgreSQL.
export type UserRole =
  | "Student"
  | "Adviser"
  | "Panelist"
  | "Dean"
  | "Coordinator"
  | "Grammarian"
  | "Records Staff"
  | "Admin";

export type UserStatus = "Pending" | "Active" | "Rejected" | "Disabled";
export type CourseCode = "BSIT" | "BSCS" | "BSIS";

export type UserProfile = {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};
