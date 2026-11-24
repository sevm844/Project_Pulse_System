import { passwordChecks, passwordLevel } from "../_lib/password";

const BAR_COLOR = ["bg-[#dfe3e0]", "bg-red-500", "bg-amber-500", "bg-lime-600", "bg-emerald-600"];

// Shows how strong the password being typed is and which rules it still misses (same rules as the server).
export default function PasswordStrength({ password, compact = false }: { password: string; compact?: boolean }) {
  const level = passwordLevel(password);
  const checks = passwordChecks(password);

  return (
    <div className={compact ? "rounded-xl bg-[#f1f3f1] p-3" : "rounded-xl bg-[#f1f3f1] p-4"} aria-live="polite">
      <p className={`text-sm font-semibold ${level.tone}`}>{password ? level.label : "Choose a password"}</p>
      <div className="mt-2 grid grid-cols-4 gap-2" aria-hidden>
        {[1, 2, 3, 4].map((bar) => (
          <span key={bar} className={`h-1 rounded-full ${bar <= level.bars ? BAR_COLOR[level.bars] : "bg-[#dfe3e0]"}`} />
        ))}
      </div>
      <ul className={compact ? "mt-2 space-y-1" : "mt-3 space-y-1.5"}>
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
