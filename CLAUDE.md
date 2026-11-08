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