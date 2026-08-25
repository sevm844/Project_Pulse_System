"use client";

import { useState } from "react";
import AdminShell from "../_components/AdminShell";
import Card from "../_components/Card";
import type { UserRole } from "../../_lib/firebase";
import { addCurrentUserAuditLog } from "../../_utils/auditLogStorage";

type RequestStatus = "Pending" | "Approved" | "Rejected";

type StaffRequest = {
  id: number;
  fullName: string;
  email: string;
  requestedRole: UserRole;
  department: string;
  status: RequestStatus;
};

const initialRequests: StaffRequest[] = [
  {
    id: 1,
    fullName: "Marco Reyes",
    email: "marco.reyes@ub.edu.ph",
    requestedRole: "Adviser",
    department: "CICS",
    status: "Pending",
  },
  {
    id: 2,
    fullName: "Lina Santos",
    email: "lina.santos@ub.edu.ph",
    requestedRole: "Panelist",
    department: "CICS",
    status: "Pending",
  },
];

export default function RegisterRequestsPage() {
  const [requests, setRequests] = useState(initialRequests);

  function updateRequest(id: number, status: RequestStatus) {
    const request = requests.find((item) => item.id === id);

    addCurrentUserAuditLog({
      action: status === "Approved" ? "Approve" : "Reject",
      module: "Registration Requests",
      details: `${status} registration request for ${
        request?.email || "unknown user"
      } as ${request?.requestedRole || "staff"}.`,
    });

    setRequests((current) =>
      current.map((requestItem) =>
        requestItem.id === id ? { ...requestItem, status } : requestItem,
      ),
    );
  }

  return (
    <AdminShell title="Registration Requests">
      <Card className="overflow-hidden">
        <div className="border-b border-[#edf2ec] p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            Staff Registration Requests
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Admin verifies identity and assigns the exact staff role.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Requested Role</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#edf2ec]">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-5 py-4 font-semibold text-[#203028]">
                    {request.fullName}
                  </td>
                  <td className="px-5 py-4 text-[#59645d]">{request.email}</td>
                  <td className="px-5 py-4 text-[#59645d]">
                    {request.requestedRole}
                  </td>
                  <td className="px-5 py-4 text-[#59645d]">
                    {request.department}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-[#dfe8df] bg-[#f8faf7] px-3 py-1 text-xs font-semibold text-[#59645d]">
                      {request.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateRequest(request.id, "Approved")}
                        className="rounded-lg bg-[#123f2b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => updateRequest(request.id, "Rejected")}
                        className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminShell>
  );
}
