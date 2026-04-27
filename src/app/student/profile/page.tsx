"use client";

import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import StudentShell from "../_components/StudentShell";
import Card from "../_components/Card";
import { members, project } from "../_data/mockStudentData";

export default function ProfilePage() {
  const [profileImage, setProfileImage] = useState("/default-avatar.png");

  function handleProfileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImage(URL.createObjectURL(file));
  }

  return (
    <StudentShell title="Profile / Group Members">
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">Profile</h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Student account details
          </p>

          <div className="mt-5 flex items-center gap-4">
            <label className="group relative cursor-pointer">
              <Image
                src={profileImage}
                alt="Profile"
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-2xl object-cover"
              />
              <span className="absolute inset-0 hidden items-center justify-center rounded-2xl bg-black/50 text-xs text-white group-hover:flex">
                Edit
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileUpload}
                className="hidden"
              />
            </label>

            <div>
              <p className="text-lg font-semibold text-[#203028]">
                Student Name
              </p>
              <p className="text-sm text-[#7b877f]">1234567@ub.edu.ph</p>
              <p className="mt-1 text-xs font-medium text-[#4f8f58]">
                Group Leader
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-[#f8faf7] p-4">
            <p className="text-xs text-[#7b877f]">Group Code</p>
            <p className="mt-2 text-sm font-semibold text-[#203028]">
              {project.groupCode}
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            Group Members
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Students assigned to this capstone group.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {members.map((member) => (
              <div key={member.email} className="rounded-xl bg-[#f8faf7] p-4">
                <p className="text-sm font-semibold text-[#203028]">
                  {member.name}
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">{member.email}</p>
                <span className="mt-3 inline-flex rounded-full border border-[#dfe8df] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#59645d]">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </StudentShell>
  );
}
