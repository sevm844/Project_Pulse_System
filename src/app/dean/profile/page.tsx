"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import RoleSettingsContent, {
  type RoleSettingsUser,
} from "../../_components/RoleSettingsContent";
import { getStoredUserEmail } from "../../_utils/authStorage";
import DeanShell, {
  DEAN_PROFILE_IMAGE_KEY,
  DEAN_PROFILE_IMAGE_UPDATED_EVENT,
} from "../_components/DeanShell";

const PROFILE_KEY = "project-pulse-dean-settings-profile";

const defaultProfile: RoleSettingsUser = {
  firstName: "Dean",
  lastName: "Office",
  email: "dean.office@ub.edu.ph",
  role: "College Dean",
  location: "Dean's Office",
  avatarSrc: "/default-avatar.jpg",
};

export default function DeanProfilePage() {
  const [profile, setProfile] = useState(defaultProfile);

  useEffect(() => {
    const savedProfile = localStorage.getItem(PROFILE_KEY);
    const savedImage = localStorage.getItem(DEAN_PROFILE_IMAGE_KEY);
    const savedEmail = getStoredUserEmail();

    queueMicrotask(() => {
      setProfile({
        ...defaultProfile,
        ...(savedProfile ? (JSON.parse(savedProfile) as RoleSettingsUser) : {}),
        email: savedEmail || defaultProfile.email,
        avatarSrc: savedImage || defaultProfile.avatarSrc,
      });
    });
  }, []);

  function handleFieldChange(
    field: keyof Omit<RoleSettingsUser, "avatarSrc">,
    value: string,
  ) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function handleProfileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = String(reader.result);

      setProfile((current) => ({ ...current, avatarSrc: imageData }));
      localStorage.setItem(DEAN_PROFILE_IMAGE_KEY, imageData);
      window.dispatchEvent(
        new CustomEvent(DEAN_PROFILE_IMAGE_UPDATED_EVENT, {
          detail: imageData,
        }),
      );
    };

    reader.readAsDataURL(file);
  }

  function handleProfileRemove() {
    setProfile((current) => ({
      ...current,
      avatarSrc: defaultProfile.avatarSrc,
    }));
    localStorage.removeItem(DEAN_PROFILE_IMAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(DEAN_PROFILE_IMAGE_UPDATED_EVENT, {
        detail: "",
      }),
    );
  }

  function handleSave() {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  return (
    <DeanShell title="Profile">
      <RoleSettingsContent
        user={profile}
        onFieldChange={handleFieldChange}
        onAvatarUpload={handleProfileUpload}
        onAvatarRemove={handleProfileRemove}
        onSave={handleSave}
      />
    </DeanShell>
  );
}
