// The one password rule of the system (the server checks the same: App\Support\PasswordRules). The person chooses it; nobody else ever sees it.
export type PasswordCheck = { label: string; ok: boolean };

export function passwordChecks(password: string): PasswordCheck[] {
  return [
    { label: "At least 8 characters long", ok: password.length >= 8 },
    { label: "An uppercase and a lowercase letter", ok: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "At least one number", ok: /\d/.test(password) },
    { label: "At least one special character (!@#$%^&*)", ok: /[^A-Za-z0-9]/.test(password) },
  ];
}

export const passwordIsStrong = (password: string) => passwordChecks(password).every((check) => check.ok);

export type PasswordLevel = { label: "Too short" | "Weak" | "Fair" | "Good" | "Strong"; bars: number; tone: string };

export function passwordLevel(password: string): PasswordLevel {
  if (password.length === 0) return { label: "Too short", bars: 0, tone: "text-[#7b877f]" };
  const passed = passwordChecks(password).filter((check) => check.ok).length;
  if (passed <= 1) return { label: "Weak", bars: 1, tone: "text-red-600" };
  if (passed === 2) return { label: "Fair", bars: 2, tone: "text-amber-600" };
  if (passed === 3) return { label: "Good", bars: 3, tone: "text-lime-700" };

  return { label: "Strong", bars: 4, tone: "text-emerald-700" };
}
