// School terms (school year + semester): the Dean's group lists open on the current term instead of mixing every year together.

export type Term = { school_year: string | null; semester: string | null };

const SEMESTER_ORDER = ["1st Semester", "2nd Semester", "Summer"];

export const ALL_TERMS = "All terms";

export function termLabel(term: Term) {
  return [term.school_year, term.semester].filter(Boolean).join(" · ") || "No term";
}

// The term a given day falls in, going by the usual Philippine calendar: 1st semester from August, 2nd from January, summer from June.
export function currentTerm(today = new Date()): Term {
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  if (month >= 8) return { school_year: `${year}-${year + 1}`, semester: "1st Semester" };
  if (month >= 6) return { school_year: `${year - 1}-${year}`, semester: "Summer" };

  return { school_year: `${year - 1}-${year}`, semester: "2nd Semester" };
}

// Every term that has at least one group, newest first.
export function termsOf(items: Term[]): string[] {
  const seen = new Map<string, Term>();

  for (const item of items) {
    if (!seen.has(termLabel(item))) seen.set(termLabel(item), item);
  }

  return [...seen.entries()]
    .sort(([, a], [, b]) => {
      const byYear = (b.school_year ?? "").localeCompare(a.school_year ?? "");
      if (byYear !== 0) return byYear;

      return SEMESTER_ORDER.indexOf(b.semester ?? "") - SEMESTER_ORDER.indexOf(a.semester ?? "");
    })
    .map(([label]) => label);
}

// What the list shows before the Dean chooses: the current term if any group belongs to it, otherwise everything.
export function defaultTerm(items: Term[]) {
  const wanted = termLabel(currentTerm());

  return termsOf(items).includes(wanted) ? wanted : ALL_TERMS;
}
