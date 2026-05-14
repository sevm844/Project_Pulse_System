"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import AdminShell from "../_components/AdminShell";
import Card from "../_components/Card";
import {
  db,
  type UserProfile,
  type UserRole,
  type UserStatus,
} from "../../_lib/firebase";
import { addCurrentUserAuditLog } from "../../_utils/auditLogStorage";

const roles: UserRole[] = [
  "Student",
  "Adviser",
  "Panelist",
  "Dean",
  "Coordinator",
  "Grammarian",
  "Records Staff",
  "Admin",
];

const statuses: UserStatus[] = ["Pending", "Active", "Rejected", "Disabled"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);

    const snapshot = await getDocs(collection(db, "users"));
    const nextUsers = snapshot.docs.map((item) => item.data() as UserProfile);

    setUsers(nextUsers);
    setLoading(false);
  }

  async function updateUser(
    uid: string,
    field: "role" | "status",
    value: UserRole | UserStatus,
  ) {
    await updateDoc(doc(db, "users", uid), {
      [field]: value,
    });

    addCurrentUserAuditLog({
      action: "Update",
      module: "User Management",
      details: `Updated user ${uid} ${field} to ${value}.`,
    });

    setUsers((current) =>
      current.map((user) =>
        user.uid === uid ? { ...user, [field]: value } : user,
      ),
    );
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <AdminShell title="User Management">
      <Card className="overflow-hidden">
        <div className="border-b border-[#edf2ec] p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            User Accounts
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Create user profiles through registration, then assign role and
            account status here.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">UID</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#edf2ec]">
              {users.map((user) => (
                <tr key={user.uid}>
                  <td className="px-5 py-4 font-semibold text-[#203028]">
                    {user.fullName}
                  </td>
                  <td className="px-5 py-4 text-[#59645d]">{user.email}</td>
                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      onChange={(event) =>
                        updateUser(
                          user.uid,
                          "role",
                          event.target.value as UserRole,
                        )
                      }
                      className="rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none"
                    >
                      {roles.map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={user.status}
                      onChange={(event) =>
                        updateUser(
                          user.uid,
                          "status",
                          event.target.value as UserStatus,
                        )
                      }
                      className="rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none"
                    >
                      {statuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-xs text-[#7b877f]">
                    {user.uid}
                  </td>
                </tr>
              ))}

              {!loading && users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-[#7b877f]"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminShell>
  );
}
