import { ALL_TERMS } from "../_lib/terms";

// Choose which school term a list shows ("2026-2027 · 1st Semester"), or every term.
export default function TermSelect({
  terms,
  value,
  onChange,
  className,
}: {
  terms: string[];
  value: string;
  onChange: (term: string) => void;
  className: string;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label="School term" className={className}>
      {[ALL_TERMS, ...terms].map((term) => (
        <option key={term}>{term}</option>
      ))}
    </select>
  );
}
