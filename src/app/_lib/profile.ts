import { apiFetch } from "./api";

// What a person keeps for themselves, on the server so it follows them to every device: their profile photo and their
// personal calendar notes. (Both used to live only in the browser.)

export type CalendarNote = { id: number; date: string; title: string; category: string };
export type NewCalendarNote = Omit<CalendarNote, "id">;

export const fetchProfilePhoto = () => apiFetch<{ photo: string | null }>("/me/photo").then((r) => r.photo);

export const saveProfilePhoto = (photo: string) =>
  apiFetch<{ photo: string }>("/me/photo", { method: "PUT", body: JSON.stringify({ photo }) }).then((r) => r.photo);

export const deleteProfilePhoto = () => apiFetch<{ photo: null }>("/me/photo", { method: "DELETE" });

export const fetchCalendarNotes = () => apiFetch<CalendarNote[]>("/me/calendar-notes");

export const addCalendarNote = (note: NewCalendarNote) =>
  apiFetch<CalendarNote>("/me/calendar-notes", { method: "POST", body: JSON.stringify(note) });

// Notes this browser kept before they lived on the server, sent over once.
export const importCalendarNotes = (notes: NewCalendarNote[]) =>
  apiFetch<CalendarNote[]>("/me/calendar-notes/import", { method: "POST", body: JSON.stringify({ notes }) });

export const removeCalendarNote = (id: number) => apiFetch<{ deleted: boolean }>(`/me/calendar-notes/${id}`, { method: "DELETE" });

const AVATAR_SIDE = 256;

// Any picture (a chosen file, or an older photo kept as a data URL) as a small square JPEG, cropped from the middle.
// A few kilobytes instead of a phone photo's several megabytes.
export async function avatarDataUrl(source: Blob | string): Promise<string> {
  const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
  const bitmap = await createImageBitmap(blob);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIDE;
  canvas.height = AVATAR_SIDE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot prepare the picture.");

  // a transparent picture would turn black as a JPEG
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, AVATAR_SIDE, AVATAR_SIDE);
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIDE, AVATAR_SIDE);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.85);
}
