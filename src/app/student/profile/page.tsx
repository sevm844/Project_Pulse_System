"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import StudentShell, {
  STUDENT_PROFILE_IMAGE_KEY,
  STUDENT_PROFILE_IMAGE_UPDATED_EVENT,
} from "../_components/StudentShell";
import StudentSettingsContent, {
  type StudentSettingsUser,
} from "../_components/StudentSettingsContent";

const defaultStudentProfile: StudentSettingsUser = {
  firstName: "Student",
  lastName: "Name",
  email: "1234567@ub.edu.ph",
  course: "Bachelor of Science in Information Technology",
  section: "IT-4A",
  location: "Batangas City, Philippines",
  avatarSrc: "/default-avatar.jpg",
};

export default function ProfilePage() {
  const [studentProfile, setStudentProfile] = useState(defaultStudentProfile);

  useEffect(() => {
    const savedImage = localStorage.getItem(STUDENT_PROFILE_IMAGE_KEY);

    if (savedImage) {
      queueMicrotask(() =>
        setStudentProfile((currentProfile) => ({
          ...currentProfile,
          avatarSrc: savedImage,
        })),
      );
    }
  }, []);

  function handleFieldChange(
    field: keyof Omit<StudentSettingsUser, "avatarSrc">,
    value: string,
  ) {
    setStudentProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
  }

  function handleProfileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = String(reader.result);

      setStudentProfile((currentProfile) => ({
        ...currentProfile,
        avatarSrc: imageData,
      }));
      localStorage.setItem(STUDENT_PROFILE_IMAGE_KEY, imageData);
      window.dispatchEvent(
        new CustomEvent(STUDENT_PROFILE_IMAGE_UPDATED_EVENT, {
          detail: imageData,
        }),
      );
    };

    reader.readAsDataURL(file);
  }

  function handleProfileRemove() {
    setStudentProfile((currentProfile) => ({
      ...currentProfile,
      avatarSrc: defaultStudentProfile.avatarSrc,
    }));
    localStorage.removeItem(STUDENT_PROFILE_IMAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(STUDENT_PROFILE_IMAGE_UPDATED_EVENT, {
        detail: "",
      }),
    );
  }

  return (
    <StudentShell title="Profile / Group Members">
      <StudentSettingsContent
        user={studentProfile}
        onFieldChange={handleFieldChange}
        onAvatarUpload={handleProfileUpload}
        onAvatarRemove={handleProfileRemove}
      />
    </StudentShell>
  );
}
