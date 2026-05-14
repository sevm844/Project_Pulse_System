"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import { getStoredUserEmail } from "../../_utils/authStorage";
import AdminShell, {
  ADMIN_PROFILE_IMAGE_KEY,
  ADMIN_PROFILE_IMAGE_UPDATED_EVENT,
} from "../_components/AdminShell";
import Card from "../_components/Card";

export default function AdminProfilePage() {
  const [profileImage, setProfileImage] = useState("/default-avatar.jpg");
  const [adminEmail, setAdminEmail] = useState("admin@ub.edu.ph");

  useEffect(() => {
    const savedImage = localStorage.getItem(ADMIN_PROFILE_IMAGE_KEY);
    const savedEmail = getStoredUserEmail();

    if (savedImage) {
      queueMicrotask(() => setProfileImage(savedImage));
    }

    if (savedEmail) {
      queueMicrotask(() => setAdminEmail(savedEmail));
    }
  }, []);

  function handleProfileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = String(reader.result);

      setProfileImage(imageData);
      localStorage.setItem(ADMIN_PROFILE_IMAGE_KEY, imageData);
      window.dispatchEvent(
        new CustomEvent(ADMIN_PROFILE_IMAGE_UPDATED_EVENT, {
          detail: imageData,
        }),
      );
    };

    reader.readAsDataURL(file);
  }

  return (
    <AdminShell title="Profile">
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">Profile</h2>

          <p className="mt-1 text-sm text-[#7b877f]">
            Admin account details
          </p>

          <div className="mt-5 flex items-center gap-4">
            <label className="group relative cursor-pointer">
              <Image
                src={profileImage}
                alt="Admin profile"
                width={72}
                height={72}
                unoptimized={profileImage.startsWith("data:")}
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
                System Admin
              </p>

              <p className="text-sm text-[#7b877f]">{adminEmail}</p>

              <p className="mt-1 text-xs font-medium text-[#4f8f58]">
                Administrator
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-[#f8faf7] p-4">
            <p className="text-xs text-[#7b877f]">Access Level</p>

            <p className="mt-2 text-sm font-semibold text-[#203028]">
              Full system administration
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            Admin Responsibilities
          </h2>

          <p className="mt-1 text-sm text-[#7b877f]">
            Core modules available to this account.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              "Manage user accounts",
              "Review registration requests",
              "Maintain groups",
              "Monitor reports and system records",
            ].map((item) => (
              <div key={item} className="rounded-xl bg-[#f8faf7] p-4">
                <p className="text-sm font-semibold text-[#203028]">{item}</p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  Available in the admin portal.
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
