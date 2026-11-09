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
- Still on localStorage (per-browser only): profile photos and calendar notes
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
- `formatDate` lives in `src/app/_lib/requirements.ts`; do not copy it into pages.
- `src/app/dean/administration/...` — Dean-only pages (users, groups, etc.)
- `src/app/student/...`, `src/app/adviser/...`, `src/app/panelist/...`,
  `src/app/grammarian/...`, `src/app/coordinator/...` — other role portals,
  all use the Laravel API (see migration status above)