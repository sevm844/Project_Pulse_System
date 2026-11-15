"use client";

import Image from "next/image";
import { RATING_LEVELS, RUBRIC_MAX, RUBRIC_SECTIONS, rubricTitle, rubricTotal, type Ratings } from "../../_lib/rubric";
import { formatDate } from "../../_lib/requirements";

// The Proposal Defense Rubric drawn as the department's paper form: logo, title with the group's course, group name, date and members,
// the criteria table (click one cell per criterion), the total, the comments and the panelist's signature. The same sheet is the
// fill-in form (onRate/onComments given) and the read-only copy for the adviser and the Dean.
export default function RubricPaper({
  course,
  groupName,
  members,
  date,
  ratings,
  onRate,
  comments,
  onComments,
  signature,
  panelistName,
  signedDate,
}: {
  course: string;
  groupName: string;
  members: string[];
  date: string | null;
  ratings: Ratings;
  onRate?: (key: string, value: number) => void;
  comments: string;
  onComments?: (value: string) => void;
  signature: string | null;
  panelistName: string;
  signedDate: string | null;
}) {
  const editable = Boolean(onRate);
  const total = rubricTotal(ratings);
  const answered = Object.keys(ratings).length;

  // One criterion's four cells (or buttons on a phone). Clicking the chosen one again leaves it unrated.
  const choose = (key: string, value: number) => onRate?.(key, ratings[key] === value ? 0 : value);

  return (
    <article aria-label={rubricTitle(course)} className="mx-auto w-full max-w-[816px] rounded border border-[#dfe8df] bg-white px-5 py-6 text-[#111] shadow-sm sm:px-10 sm:py-9">
      <header className="flex justify-end">
        <Image src="/certificate/ub-rpo-logo.png" alt="University of Batangas, College of Information and Communications Technology" width={230} height={106} priority />
      </header>

      <h2 className="mt-6 text-center font-serif text-[15px] font-bold">{rubricTitle(course)}</h2>

      <dl className="mt-7 grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-[1fr_auto]">
        <div>
          <dt className="inline">Group Name: </dt>
          <dd className="inline font-semibold">{groupName}</dd>
        </div>
        <div>
          <dt className="inline">Date: </dt>
          <dd className="inline font-semibold">{date ? formatDate(date) : ""}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="inline">Members: </dt>
          <dd className="inline font-semibold">{members.join("; ")}</dd>
        </div>
      </dl>

      {/* the table of the paper form */}
      <div className="mt-8 hidden md:block">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              <th className="w-[38%] border border-[#333] px-2 py-2 text-center align-bottom font-bold">Criteria</th>
              {RATING_LEVELS.map((level) => (
                <th key={level.value} className="border border-[#333] px-1 py-2 text-center font-bold leading-4">
                  {level.label}
                  <br />({level.value})
                </th>
              ))}
              <th className="w-[10%] border border-[#333] px-1 py-2 text-center align-bottom font-bold">Score</th>
            </tr>
          </thead>
          <tbody>
            {RUBRIC_SECTIONS.map((section) => (
              <SectionRows key={section.title} section={section} ratings={ratings} editable={editable} choose={choose} />
            ))}
            <tr>
              <td className="border border-[#333] px-2 py-1.5 font-bold">TOTAL</td>
              <td colSpan={4} className="border border-[#333]" />
              <td className="border border-[#333] px-1 py-1.5 text-center font-bold" aria-label="Total score">
                {answered > 0 ? total : ""}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* on a phone: one card per criterion with four buttons */}
      <div className="mt-8 space-y-5 md:hidden">
        {RUBRIC_SECTIONS.map((section) => (
          <section key={section.title}>
            <h3 className="border-b border-[#333] pb-1 text-[13px] font-bold">{section.title}</h3>
            <ul className="mt-2 space-y-3">
              {section.criteria.map((criterion) => (
                <li key={criterion.key}>
                  <p className="text-[13px]">{criterion.label}</p>
                  <div role="radiogroup" aria-label={criterion.label} className="mt-1.5 grid grid-cols-4 gap-1.5">
                    {RATING_LEVELS.map((level) => {
                      const on = ratings[criterion.key] === level.value;

                      return (
                        <button
                          key={level.value}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          disabled={!editable}
                          onClick={() => choose(criterion.key, level.value)}
                          className={`rounded-md border px-1 py-2 text-center text-[11px] font-semibold leading-4 ${on ? "border-[#123f2b] bg-[#d7f7d8] text-[#123f2b]" : "border-[#c9d3cc] bg-white text-[#59645d]"} ${editable ? "" : "cursor-default"}`}
                        >
                          {level.label}
                          <span className="block text-[10px] font-normal">({level.value})</span>
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="flex justify-between border-t border-[#333] pt-2 text-[13px] font-bold">
          <span>TOTAL</span>
          <span>{answered > 0 ? `${total} / ${RUBRIC_MAX}` : ""}</span>
        </p>
      </div>

      <section className="mt-9">
        <p className="text-[13px]">Comments:</p>
        {editable ? (
          <textarea
            aria-label="Comments"
            value={comments}
            maxLength={2000}
            rows={7}
            onChange={(event) => onComments?.(event.target.value)}
            className="mt-1 w-full resize-y bg-transparent px-1 text-[13px] leading-[26px] outline-none focus:bg-[#fbfdfb]"
            style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 25px, #333 25px, #333 26px)", backgroundAttachment: "local" }}
          />
        ) : (
          <p
            className="mt-1 min-h-[182px] whitespace-pre-wrap px-1 text-[13px] leading-[26px]"
            style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 25px, #333 25px, #333 26px)" }}
          >
            {comments}
          </p>
        )}
      </section>

      {/* As on the paper form: the label, then a line to sign on; the signature picture sits on the line. */}
      <footer className="mt-14 flex flex-wrap items-end justify-between gap-x-10 gap-y-8 text-[13px]">
        <div className="flex items-end gap-2">
          <span>Panelist&apos;s Signature:</span>
          <span className="relative inline-block h-6 w-[220px] border-b border-[#333]">
            {signature && (
              // eslint-disable-next-line @next/next/no-img-element -- a small picture the panelist uploaded (PNG, JPEG or WebP, checked by the server)
              <img src={signature} alt={`Signature of ${panelistName}`} className="absolute bottom-0.5 left-2 max-h-12 max-w-[200px] object-contain" />
            )}
          </span>
        </div>
        <div className="flex items-end gap-2">
          <span>Date:</span>
          <span className="inline-block h-6 w-[170px] border-b border-[#333] px-1 text-center font-semibold">{signedDate ? formatDate(signedDate) : ""}</span>
        </div>
      </footer>
    </article>
  );
}

function SectionRows({
  section,
  ratings,
  editable,
  choose,
}: {
  section: (typeof RUBRIC_SECTIONS)[number];
  ratings: Ratings;
  editable: boolean;
  choose: (key: string, value: number) => void;
}) {
  return (
    <>
      <tr>
        <td colSpan={6} className="border border-[#333] px-2 py-1 font-bold">
          {section.title}
        </td>
      </tr>
      {section.criteria.map((criterion) => (
        <tr key={criterion.key}>
          <td className="border border-[#333] px-2 py-1.5">{criterion.label}</td>
          {RATING_LEVELS.map((level) => {
            const on = ratings[criterion.key] === level.value;

            return (
              <td key={level.value} className={`border border-[#333] p-0 text-center ${on ? "bg-[#d7f7d8]" : ""}`}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={`${criterion.label}: ${level.label} (${level.value})`}
                  disabled={!editable}
                  onClick={() => choose(criterion.key, level.value)}
                  className={`h-full min-h-9 w-full text-base font-bold ${editable ? "hover:bg-[#edf9e9]" : "cursor-default"} ${on ? "text-[#123f2b]" : "text-transparent hover:text-[#b9c7bd]"}`}
                >
                  ✓
                </button>
              </td>
            );
          })}
          <td className="border border-[#333] px-1 py-1.5 text-center font-semibold" aria-label={`${criterion.label} score`}>
            {ratings[criterion.key] || ""}
          </td>
        </tr>
      ))}
    </>
  );
}
