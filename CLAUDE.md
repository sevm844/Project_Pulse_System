# Project Pulse — Frontend (project-pulse-system)

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Backend: Laravel + Sanctum (token-based auth), running separately at project-pulse-backend
- Database: PostgreSQL (owned by the backend, not this repo)

## Roles
Dean, Student, Adviser, Panelist, Grammarian, Research Coordinator (shown in UI as "Coordinator")

## Migration status (Firebase/localStorage → Laravel/PostgreSQL)
- Module 1 (Authentication, Roles, User Management): DONE — login, register, Dean's user
  management page all use the Laravel API via `src/app/_lib/api.ts`
- Module 2 (Groups, Projects, Title proposals): DONE on the Laravel API
- Module 3 (Requirements: submissions, adviser review, grammar check, version history): DONE
- Module 5 (Defenses: scheduling, panels, evaluations, results): DONE
- Module 7 (Coordinator records: Group Folders, Collection Tracker, Archive Records): DONE
- Notifications (shared in-app feed for all roles, created by backend events via
  `App\Support\Notifier`): DONE
- Messaging (direct chats + one group chat per project, student sending window set by the
  Dean, unread notifications): DONE — `MessageController`, `_lib/messages.ts`, `RoleMessagesPage`
- Firebase is fully removed (no `firebase` package, no `_lib/firebase.ts`); the legacy `/records`
  portal is deleted
- Audit Logs (Dean, read-only, written by the backend via `App\Support\Audit`): DONE. Passwords
  are reset by the Dean (Users page); `/forgot-password` only explains that
- Removed as fake/unused: Dean Academic Terms, Adviser Assignments, Courses & Sections, Roles &
  Permissions, and student Resources pages (roles are fixed by design; advisers are assigned on
  the Groups page)
- Profile photos and personal calendar notes are saved per person on the server (`ProfileController`, `_lib/profile.ts`, `useProfilePhoto`, `StakeholderCalendar`): the photo is a 256 px square JPEG data
  URL checked on the server (never SVG), notes are limited to 500. A browser that still holds the old localStorage copies sends them once (the server import skips repeats) and then deletes them.
- Still on localStorage (convenience only, per browser): sidebar collapsed state, the export dialog's remembered title page
- Housekeeping: `npm test` runs the unit tests in `tests/`; `npm audit --omit=dev` is clean
  (Next 16.4.x). Unused packages (fortune-sheet, tiptap) were removed. `.env.local` only needs
  `NEXT_PUBLIC_API_URL` if the API is not at http://127.0.0.1:8000/api.

## Module 2 rules (Groups, Projects, Title proposals) — set by the school's actual process
- **Group size:** 1 to 3 students (the leader plus up to 2 members). Enforced in `GroupController::MAX_MEMBERS` and
  `_utils/studentSelection.ts`.
- **Stages (own column `projects.proposal_stage`, only these 4):** Title Proposal -> Dean's Endorsement -> Client
  Consultation -> Ready for Proposal Defense. There is no free stage dropdown; each move is one explicit action
  (`ProposalStageController`): Adviser "send to Dean" -> Dean "endorse" (the sign-off itself advances the stage) ->
  Adviser "choose title". Approving a title never moves the stage.
- **Titles:** only the group's Adviser approves / requests revision / rejects. The Dean has NO title-approval action
  (do not add one). Up to 3 titles Pending or Approved at a time. Approving does not set the project title; the single
  chosen title is set at "choose title" and must be one the Dean endorsed.
- **Dean's endorsement:** records the endorsed (approved) titles, notes, signer and time (`dean_endorsements`); never the
  chosen title.
- **Return to Adviser:** at Dean's Endorsement the Dean can send the group back (`POST /groups/{id}/return-to-adviser`) with a required
  note (5+ characters). The stage goes back to Title Proposal; the note (`projects.dean_return_note`) is shown to the adviser and the
  group until she sends the group to the Dean again, which clears it. The Dean still decides nothing about titles. While the group is
  at Title Proposal the adviser may change an earlier approval to "Needs Revision" or "Rejected" (never back to Approved), which frees
  room under the 3-title limit.
- **Leaving / removal:** a student can leave; the Adviser or Dean can remove one, but a reason category is required and goes
  to the audit log. Leaving moves the person to `group_member_exits` (history kept). If the leader leaves, the member who
  joined earliest becomes leader. If nobody is left the group becomes 'Pending Closure' until the Adviser/Dean confirms; it is
  never deleted. After the Dean's endorsement membership is locked; only the Dean's separate exception removal (reason +
  details, Critical audit entry) can change it.
- **Closing a group:** a student is in at most one group that is not `Closed` (`Project::currentFor` is the one "current project" rule).
  A group that lost every member is confirmed closed by its Adviser or the Dean. The Dean alone can also close a group that still has
  members (`POST /groups/{id}/close` with `reason_category`, plus `reason` for "Other"): for a failed group that will retake, a stopped
  project, or a disbanded group. That cancels its scheduled defenses, tells the students, adviser and panel, keeps all history, stores
  `student_groups.closed_reason` and writes a Critical audit entry. Finished/archived groups are deliberately NOT closed automatically:
  every student screen skips Closed groups, so closing them would hide a graduate's own project from them.
  The Dean can undo a close (`POST /groups/{id}/reopen`, reason required, Critical audit entry): the group goes back to Active with its
  members, project and history; defenses cancelled by the close stay cancelled. Refused if the group has no members or a member has
  since joined another open group.
- **Changing advisers:** one group via `PUT /groups/{id}/adviser`, or all of an adviser's open groups (or chosen `group_ids`) via
  `POST /advisers/{id}/reassign-groups` (Dean only; the source may be a disabled adviser, the target must be Active; Closed groups never
  move). Both use `Project::assignAdviser`. An adviser's own assignment applies to the groups they advise now; work a group already handed
  in for it stays with the group (`Requirement::appliesTo` + `Project::hasHandedIn`) and the new adviser can review it, but cannot edit
  or delete the previous adviser's assignment. Assignments the group had not started do not follow it.
- **School term view:** the Dean's Projects and Group Management lists open on the current term (`_lib/terms.ts`: August = 1st semester,
  January = 2nd, June = summer), with a term select ("All terms" to see everything). The "needs your attention" list is never filtered by term.
- **Concurrency:** title proposals and decisions, stage moves, submissions, reviews, receipts, and defense scheduling, evaluation, result and
  cancel all lock their rows (group, then project, then the item) and re-check the rule inside the lock. A review may send `version_no`
  and is refused if a newer version was uploaded meanwhile (`StaffRequirements` sends it).
- **Defense order is strict, no skipping:** Proposal -> Alpha -> Beta -> Omega -> Final (`Defense::TYPES`). A type can be scheduled only after the group
  passed (Passed or Passed with Revisions) the one before it (`Defense::previousType` / `hasPassed`, checked inside the project lock in
  `DefenseController::store`). A failed defense is defended again; a cancelled one counts as not held.
- **Module boundaries:** after "Ready for Proposal Defense", Module 5 (Defenses), Module 3 (Requirements) and Module 7
  (Records) track their own progress in their own fields. A Proposal Defense can only be scheduled for a Ready group.
  Requirement `stage` labels live in `Requirement::STAGES` / `REQUIREMENT_STAGES`, separate from the proposal stages.

## Assignments (Requirements page) — Title Proposal and sections
- **Title Proposal is the first assignment**, not a separate page. Each adviser automatically gets one built-in
  `requirements` row (`kind = 'Title Proposal'`, created by `Requirement::titleProposalFor`). The student proposes titles and the
  adviser decides on them inside the Requirements page (`StudentTitleProposals`, `AdviserTitleReview`). The Module 2 rules
  above still apply unchanged. It cannot be deleted; the adviser may only edit its instructions, due date and sections. The
  Dean's Requirements list leaves it out (the Dean uses the endorsement queue).
- **Instructions:** every assignment has "Instructions for students" (`requirements.description`), shown to students as "From <adviser>".
- **Sections:** an assignment can be limited to chosen sections (`requirements.sections`, labels like "BSIT 4A", NULL = all of the
  adviser's groups). The dropdown lists the sections the adviser actually advises. `Requirement::appliesTo` enforces it.
- There is no `/adviser/title-proposals` page any more (the old address redirects to Requirements).
- **File rules per assignment** (`allowed_types`, `max_file_mb` 1-10, `allow_resubmission`): enforced by `Requirement::fileRules()` on
  upload. With resubmission off, a new version is only accepted after the adviser asked for changes.
- **Template/guide:** an adviser can attach one file to an assignment (`attachment_*`); students of the targeted sections, the adviser and
  the Dean can download it (`/requirements/{id}/attachment`).
- **Documents page** (`/student|adviser|dean/documents`, `DocumentLibrary`): the current file or link of every submission the role may see
  (`GET /documents`, `DocumentController`), with version history and an in-browser preview for PDF and images. The preview forces
  the content type client-side (`previewSubmission`); never render an uploaded file as HTML. A submitted file stays listed even if the
  assignment's sections change later.

## Manuscript (built-in rich-text document) — `/student/manuscript`
- One manuscript per project, written in the browser (`ManuscriptEditor`, TipTap). It is stored as the editor's JSON (`manuscripts.draft`),
  **never HTML**, and rendered only by the editor itself (`ManuscriptView`, read-only). Do not use `dangerouslySetInnerHTML` for it.
- **Draft** is private to the group (only students can read or save it). It autosaves; every save names the `base_revision` it started from
  and the server answers 409 if another member saved a newer one (the editor then offers "Load the latest draft").
- **Versions** (`manuscript_versions`) are frozen copies made by "Submit version": who saved it, when, an optional note, word count, and every
  member who edited since the previous version. They are never changed. The adviser, the Dean and the group read versions
  (`GET /projects/{id}/manuscript/versions[/{no}]`, `ManuscriptHistory`, shown on the Dean's project profile and the adviser's group card).
- **What the server keeps is a whitelist** (`App\Support\ManuscriptContent`): node types, marks and each attribute's value pattern. Pasted papers
  carry things that cannot be kept safely (pictures on other sites, `#_Toc` contents links, Word style values): the server removes only those,
  counts them (`dropped` in the save response, plus the cleaned `content` so the editor shows what is really saved) and saves the rest. Only a
  non-document, an unknown block type, or an oversized/too deep document is refused (422). If the editor gains a new extension or attribute, add it
  to the whitelist or it is silently dropped (`manuscript_smoke.php` has a document captured from a real session). Pictures are stored inside the
  document as data URLs (shrunk client-side to under 1 MB each); pasted pictures that are not data URLs are dropped and the student is told.
- A scrolling bubble beside the scrollbar shows the page on screen ("7 of 70") (`PagedScroll`).
- Defaults are Arial 11 pt, 1.5 lines of spacing (Word's meaning, see below), 1 inch margins; students can change fonts, sizes and spacing like Google Docs, and their captions,
  titles and references are their own business (the system does not check them).
- **Pages** (`pagination.ts`, a ProseMirror plugin): Letter size, 1 inch margins. The sheet is one element; the plugin draws grey
  gaps and top margins as display-only widgets and moves content that would cross a boundary to the next page (paragraphs split line by
  line; tables, lists and pictures move whole). Nothing is stored for pages, so the same count shows in the editor and in frozen versions.
  The sheet is at least 816 px wide (it scrolls sideways on a phone) so a page is always the same shape.
- **Never trim or null-convert manuscript requests**: `bootstrap/app.php` exempts `api/my-manuscript/*` from `TrimStrings` and
  `ConvertEmptyStringsToNull`, because spaces between bold and plain text are real content (this once produced "broken text block").
- **Compare versions** (`ManuscriptCompare`, engine in `_lib/manuscriptDiff.ts`, tests in `tests/manuscriptDiff.test.cjs`): any two submitted versions,
  older on the left. Nothing is stored: both frozen documents are fetched and compared in the browser, first paragraph by paragraph
  (aligned like a text diff), then word by word inside a paragraph that was rewritten (a replaced pair counts as one edit when enough words
  survive; pictures are never "edited"). Formatting is ignored on purpose; only words count. Green underline = added, red strikethrough =
  removed. "Show only changes" folds unchanged runs, Previous/Next walk the changes. The dialogs render through a portal to `document.body`.
  Who edited is per version (`editors`), not per sentence. Very large, totally different papers fall back to "all removed / all added".
- **Review comments** (`ManuscriptReview`, `ManuscriptCommentController`, tables `manuscript_comments` / `manuscript_comment_replies`): the adviser of the group
  and the Dean select words in a frozen version (or comment on the whole version); the students read and reply; only the adviser/Dean mark a comment
  Resolved or reopen it (reopening notifies the group). A comment lives on a **version**, never on the draft, so it keeps pointing at the same words.
  Its place is `block_index` (the n-th block of `toBlocks()` in `_lib/manuscriptDiff.ts`) plus character offsets inside that block's text, with the quoted
  words kept as a fallback: **do not change `toBlocks()` without a migration plan for stored comments.** The version list shows open/resolved counts and a
  Review (staff) or Comments (students) button. The Compare screen lists the older version's comments with what happened to their words
  (`commentState`: changed / removed / not changed). Formatting is not shown in the review screen (words only), like Compare.
  On a phone the review dialog scrolls as a whole (paper capped, comments below with full height); selecting words works with a finger because the screen listens to
  `selectionchange` (not the mouse), and the "+ Comment" button acts on pointer-down so a tap cannot clear the selection first.
- **Export to PDF and Word** (`ManuscriptExportDialog`, `_lib/manuscriptExport/`: `model.ts` reads the saved JSON into simple blocks, `pdf.ts` = pdfmake,
  `docx.ts` = docx library): the student's "Export PDF / Word" button (current draft) and "Download" in every version viewer (students, adviser, Dean). Made entirely
  in the browser, loaded only when used (dynamic imports), nothing is sent to the server. Options: title page (pre-filled from the group: members with the leader first,
  adviser, term, chosen title; every field editable and remembered per project in localStorage), table of contents (from headings 1-3), page numbers (bottom centre, the
  title page has none). Letter size, 1 inch margins. The PDF draws with Arimo / Tinos / Cousine (SIL OFL look-alikes of Arial / Times New Roman / Courier New with the same
  letter widths, files in `public/fonts/export/`, fetched on export); Calibri, Cambria, Georgia and Verdana fall back to those in the PDF only. The Word file keeps the font names, uses
  Heading 1-3 styles, real lists and a real table-of-contents field (Word asks to update fields on opening: answer Yes). Not opened in real Word during development, only inspected.
- **Line spacing means what it means in Word**: "1.5" is 1.5 lines, and a line of Arial is about 1.15 times its size, so the editor draws `line-height: calc(1.5 * 1.15)`
  (CSS default 1.725). This keeps the editor, the PDF and Word at the same page count. The pagination plugin measures each line from its centre (never top and bottom separately).
- **Grammarian access** (`/grammarian/manuscripts`, `GET /grammarian/manuscripts`): the Grammarian reads the frozen versions, compares them and writes grammar comments on exact words
  (same review screen, shown with a Grammarian badge) only for groups already in the grammar check: `Project::scopeManuscriptVisibleTo` = a submission for a `needs_grammar_check`
  requirement that the adviser approved, or that already has a grammar result (so access does not vanish when a failed check sends the submission back). They never see drafts. They resolve only
  **their own** comments; the adviser and the Dean can resolve any; the server decides per comment (`can_resolve`), the screen just obeys it. A Grammarian comment also notifies the adviser.
  Other roles use `Project::visibleTo` unchanged; never add the Grammarian to that scope (it would leak groups to other modules).
- **Grammarian's certificate and the flow around it** (`GrammarReferralController`, `CertificateController`; Grammarian pages `/grammarian/certificates`, `.../form`, `.../[projectId]`; Dean page `/dean/certificates`): the university form F-RPO-09
  "Certification of Editing/Originality". **The flow (the school's own): the Dean sends a group's final manuscript (a submitted version he picks, plus a note) to the Grammarian -> she downloads it as a plain Word/PDF document and checks it
  OUTSIDE the system (plagiarism etc.; the system has no such tool) -> she comes back and either issues the certificate, which goes straight to the Dean, or returns the group as not passed with remarks (Dean and adviser notified).**
  The Dean's send form (`/dean/certificates`) offers only groups that passed their Final Defense (`final_defense_passed` from `ProjectProgress`, returned by `GET /grammar-referrals/candidates`);
  "Show other groups too" widens it for an exception (marked with the group's current phase, with a warning), and "View manuscript" reads the chosen version read-only. The server does not enforce the Final Defense: it is the Dean's call.
  One waiting sending per group (`grammar_referrals`, partial unique index); a group can be sent again after a pass or a return. Only the NEWEST sending counts for eligibility (`Project::scopeCertificateEligible`).
  **The form is the Grammarian's own**: fixed wording with five fill-in fields (`{{title}} {{authors}} {{degree}} {{done_date}} {{signed_date}}`), versions in `certificate_templates` (v1 seeded by the migration); only the Grammarian saves a new
  version (the wording must keep the first four fields). The Dean has no form editor. She fills the bold fields on the page (prefilled: title, "Surname, First" authors leader first, degree from the course, today's dates), prints her own uploaded
  signature (`user_signatures`), and issues it. A certificate (`certificates`, number `GC-YYYY-NNNN`) keeps a snapshot of the form version, her name and signature, so it never changes when the form is revised; issuing again replaces the earlier one
  (kept, marked replaced). **Who reads certificates: the Dean (who receives it), the Grammarian, the group's own students, its adviser and the Research Coordinator; panelists cannot** (`Project::scopeCertificateVisibleTo`). The group, adviser and Coordinator see only the certificate in force (never a replaced one), shown by `CertificateList` (`hideWhenEmpty`) on the student's My Project overview, the adviser's group card and the Coordinator's Group Folders / Archive Records; they are also notified when it is issued. The Grammarian can read the manuscript versions of every
  group sent to her (`scopeManuscriptVisibleTo`). Logo: `public/certificate/ub-rpo-logo.png`. The editable fields compare text with spaces normalised: a typed trailing space becomes a non-breaking space, and resetting it would throw the cursor to
  the start. `uat:reset` does not touch form versions (they are the Grammarian's, not demo data).
- **The certificate is required to archive, not to defend** (`FinalOutputController::archive` refuses with 422 unless `Project::hasCertificate`; `GET /final-outputs` returns `has_certificate`, and Group Folders disables "Archive this project" without it). A group can take any defense without it.
- Not built yet: ideas for later are roman page numbers on the front pages, a version of the export that tracks the school's exact title-page template, and Grammarian comments tied to a specific grammar-check submission.

## Overall progress tracker
- One computed view of where a group stands in the whole capstone: Title Proposal -> Proposal, Alpha, Beta, Omega, Final defense ->
  Final Output (archived). `GET /progress` (`ProgressController`, `App\Support\ProjectProgress`) works it out from the modules that own
  the facts (Module 2 stage, the latest defense of each type and its result, received final outputs, the archive). Nothing is stored,
  so it cannot disagree with them. The current phase is the first one not done; a failed defense stays current until a new one passes.
- Shown with `ProgressTracker` / `ProgressMini` / `ProgressList` (`_components/progress/`): student dashboard (full tracker, Next Step and
  Upcoming Defense follow it), adviser dashboard and group cards, Dean project list and project profile. Requirements are counted
  beside the phases ("3 of 5 approved"), not as a phase.

## Project management views
- **Groups at risk** (`GET /risks`, adviser and Dean) and the **group timeline** (`GET /groups/{id}/timeline`, the group, its adviser, the Dean) are
  worked out in `App\Support\ProjectHealth` from facts the other modules keep; nothing extra is stored. A group is flagged for: overdue
  assignments, a submission waiting more than 7 days for review or a revision not resent for 7 days, a failed defense not rescheduled, a
  defense date passed with no result, a group waiting to be closed, or no activity for 21 days. Finished (archived) and closed groups are
  never listed. Thresholds are constants at the top of the class.
- Shown by `RiskList` (adviser dashboard, Dean dashboard) and `GroupTimeline` (student My Project tab, adviser group card, Dean project profile).

## User acceptance testing (UAT)
- **Demo data:** `php artisan uat:seed` (backend) creates 16 accounts (`uat-*@uat.test`, one shared random password printed once) and four
  sample groups at different phases, by calling the real API. `php artisan uat:reset` removes exactly those and what belongs to them.
  Never delete other data in these commands; `tests/smoke/uat_data_smoke.php` proves the database returns to its exact earlier state.
  `uat:seed` refuses to run when `APP_ENV=production` without `--force`. Facilitator guide: backend `docs/UAT.md`; tester checklists per
  role: `docs/UAT_CHECKLISTS.md` here.
- **Feedback button** (top right of every role's pages, `FeedbackDialog` in `RoleShell`): feedback (Bug / Suggestion / Question / Praise,
  records the page) and the 10-question System Usability Scale survey (`survey_responses`, one per person, score 0-100).
  Everyone sends; only the Dean reads them, on `/dean/feedback`, where two "Export CSV" buttons save the feedback list and the survey
  sheets (`GET /survey/responses`, role only, no names) before `uat:reset` removes them.

## API conventions
- All API calls go through `apiFetch<T>(path, options)` in `src/app/_lib/api.ts`
- It automatically attaches the Bearer token from storage
- On a 401 response, it auto-redirects to /login
- On a 429 response, it shows a friendly rate-limit message
- Auth token helpers live in `src/app/_utils/authStorage.ts`
  (`saveStoredToken`, `getStoredToken`, `AUTH_TOKEN_KEY`)
- To log out, always call `logoutFromApi()` from `src/app/_lib/api.ts` —
  never call Firebase's `signOut(auth)` directly (that's the old pattern
  being phased out module by module)

## Rules — do not break these
- Do NOT recreate an `/admin` folder or route. The Dean portal
  (`src/app/dean/...`) replaced it; Dean = Admin in this system, by design.
- Do NOT render raw/untrusted HTML with `dangerouslySetInnerHTML` or similar.
- Never commit secrets, API keys, or `.env` files.
- When migrating a module from Firebase to the Laravel API, update the
  whole module in one pass (page + its storage/util files), not just the
  UI, so the app doesn't end up half-Firebase/half-API for that feature.

## Folder structure notes
- Every role portal wraps its pages in `<Role>Shell`, a thin wrapper (nav items only) around the shared
  `src/app/_components/RoleShell.tsx`. Change the sidebar/header layout there once, not per role.
- Sidebar pictures live in `public/nav/` (96 px square, transparent, one per meaning: dashboard, projects, defense, requirements, documents, manuscript,
  review-queue, certificates, administration, reports, feedback, student-approvals, collection-tracker, archive-records, messages, notifications, profile).
  Each `<Role>Shell` points its items at them; reuse a picture only for the same meaning in another role. If a picture is replaced under the same name, clear
  `.next/dev/cache/images` or the dev server keeps serving the old one.
- `formatDate` lives in `src/app/_lib/requirements.ts`; do not copy it into pages.
- `src/app/dean/administration/...` — Dean-only pages (users, groups, etc.)
- `src/app/student/...`, `src/app/adviser/...`, `src/app/panelist/...`,
  `src/app/grammarian/...`, `src/app/coordinator/...` — other role portals,
  all use the Laravel API (see migration status above)