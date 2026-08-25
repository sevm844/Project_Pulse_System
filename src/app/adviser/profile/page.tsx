"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import RoleSettingsContent, {
  type RoleSettingsUser,
} from "../../_components/RoleSettingsContent";
import { getStoredUserEmail } from "../../_utils/authStorage";
import AdviserShell, {
  ADVISER_PROFILE_IMAGE_KEY,
  ADVISER_PROFILE_IMAGE_UPDATED_EVENT,
} from "../_components/AdviserShell";

const PROFILE_KEY = "project-pulse-adviser-settings-profile";

const defaultProfile: RoleSettingsUser = {
  firstName: "Anna",
  lastName: "Cruz",
  email: "anna.cruz@ub.edu.ph",
  role: "Research Adviser",
  location: "College of Computer Studies",
  avatarSrc: "/default-avatar.jpg",
};

export default function AdviserProfilePage() {
  const [profile, setProfile] = useState(defaultProfile);

  useEffect(() => {
    const savedProfile = localStorage.getItem(PROFILE_KEY);
    const savedImage = localStorage.getItem(ADVISER_PROFILE_IMAGE_KEY);
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
      localStorage.setItem(ADVISER_PROFILE_IMAGE_KEY, imageData);
      window.dispatchEvent(
        new CustomEvent(ADVISER_PROFILE_IMAGE_UPDATED_EVENT, {
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
    localStorage.removeItem(ADVISER_PROFILE_IMAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(ADVISER_PROFILE_IMAGE_UPDATED_EVENT, {
        detail: "",
      }),
    );
  }

  function handleSave() {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  return (
    <AdviserShell title="Profile" hideContentTitle>
      <RoleSettingsContent
        user={profile}
        onFieldChange={handleFieldChange}
        onAvatarUpload={handleProfileUpload}
        onAvatarRemove={handleProfileRemove}
        onSave={handleSave}
      />
    </AdviserShell>
  );
}
