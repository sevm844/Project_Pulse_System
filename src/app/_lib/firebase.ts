import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { ProjectStage } from "../_utils/projectWorkflow";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

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

export type GroupMemberRecord = {
  uid?: string;
  email: string;
  name: string;
  role: "Group Leader" | "Member";
};

export type CapstoneGroup = {
  id: string;
  groupName: string;
  projectTitle: string;
  groupCode: string;
  course: CourseCode;
  section: string;
  members: GroupMemberRecord[];
  leaderId: string;
  adviserId: string;
  adviserName: string;
  panelists: string[];
  stage: ProjectStage;
  progress: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};
