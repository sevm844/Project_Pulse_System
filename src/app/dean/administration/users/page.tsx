"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import DeanShell from "../../_components/DeanShell";
import Card from "../../_components/Card";
import type { UserStatus } from "../../../_lib/types";
import {
  ApiError,
  apiFetch,
  type ApiRole,
  type ApiUser,
} from "../../../_lib/api";

const statuses: UserStatus[] = ["Pending", "Active", "Rejected", "Disabled"];

const emptyForm = {
  fname: "",
  lname: "",
  email: "",
  role_id: "",
  extra_role_ids: [] as number[],
};

// Only these roles can be held together (the server checks it too): an Adviser who is also a Grammarian, and so on.
const COMBINABLE = ["Adviser", "Panelist", "Grammarian"];

// "Also acts as": tick the other roles this person holds besides the main one.
function ExtraRoles({
  roles,
  mainRoleId,
  value,
  onChange,
}: {
  roles: ApiRole[];
  mainRoleId: number;
  value: number[];
  onChange: (next: number[]) => void;
}) {
  const main = roles.find((role) => role.role_id === mainRoleId);

  if (!main || !COMBINABLE.includes(main.role_name)) return null;

  const others = roles.filter((role) => COMBINABLE.includes(role.role_name) && role.role_id !== mainRoleId);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#59645d]">
      <span>Also acts as:</span>
      {others.map((role) => (
        <label key={role.role_id} className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={value.includes(role.role_id)}
            onChange={(event) =>
              onChange(event.target.checked ? [...value, role.role_id] : value.filter((id) => id !== role.role_id))
            }
            className="accent-[#123f2b]"
          />
          {role.role_name}
        </label>
      ))}
    </div>
  );
}

const inputClass =
  "rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200";

export default function DeanUsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(emptyForm);

  const showError = useCallback((err: unknown) => {
    setNotice("");
    setError(err instanceof ApiError ? err.message : "Something went wrong.");
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [nextUsers, nextRoles] = await Promise.all([
        apiFetch<ApiUser[]>("/users"),
        apiFetch<ApiRole[]>("/roles"),
      ]);

      setUsers(nextUsers);
      setRoles(nextRoles);
    } catch (err) {
      showError(err);
    }

    setLoading(false);
  }, [showError]);

  async function updateUser(
    user: ApiUser,
    changes: { role_id?: number; extra_role_ids?: number[]; account_status?: UserStatus },
  ) {
    setError("");
    setNotice("");

    try {
      const updated = await apiFetch<ApiUser>(`/users/${user.user_id}`, {
        method: "PUT",
        body: JSON.stringify(changes),
      });

      setUsers((current) =>
        current.map((item) =>
          item.user_id === updated.user_id ? updated : item,
        ),
      );
    } catch (err) {
      showError(err);
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);

    try {
      const created = await apiFetch<ApiUser & { email_sent?: boolean }>("/users", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          role_id: Number(form.role_id),
          extra_role_ids: COMBINABLE.includes(roles.find((r) => r.role_id === Number(form.role_id))?.role_name ?? "") ? form.extra_role_ids : [],
        }),
      });

      setUsers((current) => [...current, created]);
      setForm(emptyForm);
      setNotice(
        created.email_sent
          ? `Account created. ${created.email} was emailed a link to choose their own password.`
          : `Account created, but the email to ${created.email} could not be sent. Use "Email link" on their row once the mail settings work.`,
      );
    } catch (err) {
      showError(err);
    }

    setSaving(false);
  }

  // The Dean never types or sees a password: the person is emailed a link and chooses their own.
  async function sendPasswordLink(user: ApiUser) {
    if (!window.confirm(`Email ${user.email} a link to choose a new password?`)) return;

    setError("");
    setNotice("");

    try {
      const result = await apiFetch<{ message: string }>(`/users/${user.user_id}/password-link`, { method: "POST" });

      setNotice(result.message);
    } catch (err) {
      showError(err);
    }
  }

  useEffect(() => {
    queueMicrotask(() => { void loadData(); });
  }, [loadData]);

  return (
    <DeanShell title="User Management">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {notice && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      <Card className="mb-5 p-5">
        <h2 className="text-lg font-semibold text-[#203028]">Add User</h2>
        <p className="mt-1 text-sm text-[#7b877f]">
          Create an account directly. It is active right away, and the person gets an email to choose their own password. You never set or see a password.
        </p>

        <form
          onSubmit={createUser}
          className="mt-4 grid gap-3 md:grid-cols-3"
        >
          <input
            required
            placeholder="First name"
            className={inputClass}
            value={form.fname}
            onChange={(e) => setForm({ ...form, fname: e.target.value })}
          />
          <input
            required
            placeholder="Last name"
            className={inputClass}
            value={form.lname}
            onChange={(e) => setForm({ ...form, lname: e.target.value })}
          />
          <input
            required
            type="email"
            placeholder="Email address"
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <select
            required
            className={inputClass}
            value={form.role_id}
            onChange={(e) => setForm({ ...form, role_id: e.target.value, extra_role_ids: [] })}
          >
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.role_name}
              </option>
            ))}
          </select>
          <div className="md:col-span-3">
            <ExtraRoles
              roles={roles}
              mainRoleId={Number(form.role_id)}
              value={form.extra_role_ids}
              onChange={(next) => setForm({ ...form, extra_role_ids: next })}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#123f2b] px-4 py-2 text-sm text-white hover:bg-[#0f3324] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Create account"}
          </button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-[#edf2ec] p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            User Accounts
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Assign roles and approve or disable accounts. People choose and change their own passwords; you can only email them a link.
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
                <th className="px-5 py-3 font-medium">Password link</th>
                <th className="px-5 py-3 font-medium">ID</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#edf2ec]">
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td className="px-5 py-4 font-semibold text-[#203028]">
                    {user.fname} {user.lname}
                  </td>
                  <td className="px-5 py-4 text-[#59645d]">{user.email}</td>
                  <td className="px-5 py-4">
                    <select
                      value={user.role_id}
                      onChange={(event) => {
                        const nextId = Number(event.target.value);
                        const nextName = roles.find((role) => role.role_id === nextId)?.role_name ?? "";

                        // Moving someone to a role that cannot be shared drops their extra roles.
                        updateUser(user, COMBINABLE.includes(nextName) ? { role_id: nextId } : { role_id: nextId, extra_role_ids: [] });
                      }}
                      className="rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none"
                    >
                      {roles.map((role) => (
                        <option key={role.role_id} value={role.role_id}>
                          {role.role_name}
                        </option>
                      ))}
                    </select>
                    <ExtraRoles
                      roles={roles}
                      mainRoleId={user.role_id}
                      value={user.extra_role_ids ?? []}
                      onChange={(next) => updateUser(user, { extra_role_ids: next })}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={user.account_status}
                      onChange={(event) =>
                        updateUser(user, {
                          account_status: event.target.value as UserStatus,
                        })
                      }
                      className="rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none"
                    >
                      {statuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => sendPasswordLink(user)}
                      className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs text-[#203028] hover:bg-[#f4f8f4]"
                    >
                      Email link
                    </button>
                  </td>
                  <td className="px-5 py-4 text-xs text-[#7b877f]">
                    {user.user_id}
                  </td>
                </tr>
              ))}

              {!loading && users.length === 0 && !error && (
                <tr>
                  <td
                    colSpan={6}
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
    </DeanShell>
  );
}