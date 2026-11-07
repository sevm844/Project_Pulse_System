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
- `src/app/dean/administration/...` — Dean-only pages (users, groups, etc.)
- `src/app/student/...`, `src/app/adviser/...`, `src/app/panelist/...`,
  `src/app/grammarian/...`, `src/app/coordinator/...` — other role portals,
  all use the Laravel API (see migration status above)