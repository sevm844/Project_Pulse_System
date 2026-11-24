import { passwordChecks, passwordLevel } from "../_lib/password";

const BAR_COLOR = ["bg-[#dfe3e0]", "bg-red-500", "bg-amber-500", "bg-lime-600", "bg-emerald-600"];

// Shows how strong the password being typed is and which rules it still misses (same rules as the server).
// `hint` (the Settings page): nothing shows until the person starts typing, and then only what is STILL MISSING, in one short line; a good password just says so.
export default function PasswordStrength({ password, hint = false }: { password: string; hint?: boolean }) {
  const level = passwordLevel(password);
  const checks = passwordChecks(password);

  if (hint) {
    if (!password) return null;
    const missing = checks.filter((check) => !check.ok);

    if (missing.length === 0) {
      return (
        <p className="mt-1.5 text-[11px] font-semibold text-emerald-700" aria-live="polite">
          ✓ This password is strong enough.
        </p>
      );
    }

    return (
      <p className="mt-1.5 text-[11px] leading-4 text-amber-700" aria-live="polite">
        <span className="font-semibold">Still needed:</span> {missing.map((check) => check.label.charAt(0).toLowerCase() + check.label.slice(1)).join(", ")}.
      </p>
    );
  }

  return (
    <div className="rounded-xl bg-[#f1f3f1] p-4" aria-live="polite">
      <p className={`text-sm font-semibold ${level.tone}`}>{password ? level.label : "Choose a password"}</p>
      <div className="mt-2 grid grid-cols-4 gap-2" aria-hidden>
        {[1, 2, 3, 4].map((bar) => (
          <span key={bar} className={`h-1 rounded-full ${bar <= level.bars ? BAR_COLOR[level.bars] : "bg-[#dfe3e0]"}`} />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {checks.map((check) => (
          <li key={check.label} className={`flex items-center gap-2 text-xs ${check.ok ? "text-emerald-700" : "text-[#59645d]"}`}>
            <span aria-hidden className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${check.ok ? "bg-emerald-600 text-white" : "bg-[#dfe3e0] text-[#7b877f]"}`}>
              {check.ok ? "✓" : "×"}
            </span>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
