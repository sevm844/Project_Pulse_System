"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../_lib/groups";
import { avatarDataUrl, deleteProfilePhoto, fetchProfilePhoto, saveProfilePhoto } from "../_lib/profile";

// The signed-in person's profile photo. It lives on the server (so every device shows it); the header and the profile
// page both use this and stay in step through a small window event.
const updatedEvent = (slug: string) => `project-pulse-${slug}-profile-image-updated`;
// Where the photo used to be kept: this browser only, one per role.
const legacyKey = (slug: string) => `project-pulse-${slug}-profile-image`;

const readLegacy = (slug: string) => {
  try {
    return window.localStorage.getItem(legacyKey(slug));
  } catch {
    return null;
  }
};

const clearLegacy = (slug: string) => {
  try {
    window.localStorage.removeItem(legacyKey(slug));
  } catch {
    // nothing kept
  }
};

export function useProfilePhoto(slug: string) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        let current = await fetchProfilePhoto();
        const old = readLegacy(slug);

        if (!current && old) {
          // A photo this browser kept before: move it to the account once, shrunk to a small square.
          try {
            current = await saveProfilePhoto(await avatarDataUrl(old));
            clearLegacy(slug);
          } catch {
            // it stays in the browser and is tried again next time
          }
        } else if (current && old) {
          clearLegacy(slug);
        }

        if (!cancelled) setPhoto(current);
      } catch {
        // signed out or offline: the initials are shown instead
      }
    })();

    const sync = (event: Event) => setPhoto((event as CustomEvent<string | null>).detail || null);
    window.addEventListener(updatedEvent(slug), sync);

    return () => {
      cancelled = true;
      window.removeEventListener(updatedEvent(slug), sync);
    };
  }, [slug]);

  const change = useCallback(
    async (file: File) => {
      setBusy(true);
      setError("");

      try {
        if (!/^image\/(png|jpe?g|webp|gif|bmp)$/i.test(file.type)) throw new Error("Choose a PNG, JPEG or WebP picture.");
        const saved = await saveProfilePhoto(await avatarDataUrl(file));
        setPhoto(saved);
        window.dispatchEvent(new CustomEvent(updatedEvent(slug), { detail: saved }));
      } catch (err) {
        setError(errorMessage(err, "The picture could not be saved. Please try another one."));
      }

      setBusy(false);
    },
    [slug],
  );

  const remove = useCallback(async () => {
    setBusy(true);
    setError("");

    try {
      await deleteProfilePhoto();
      clearLegacy(slug);
      setPhoto(null);
      window.dispatchEvent(new CustomEvent(updatedEvent(slug), { detail: null }));
    } catch (err) {
      setError(errorMessage(err, "The photo could not be removed. Please try again."));
    }

    setBusy(false);
  }, [slug]);

  return { photo, busy, error, change, remove };
}
