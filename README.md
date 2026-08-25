# Project Pulse

Project Pulse is a capstone project monitoring and document workflow system for
students, advisers, panelists, coordinators, grammarians, records staff, deans,
and administrators.

## Technology Stack

- **Next.js 16 + React 19**: The main web application framework used to build
  the role-based dashboards, pages, routing, and interactive user interfaces.
- **TypeScript**: Provides typed application logic for user roles, project
  records, workflow states, and reusable data structures.
- **Tailwind CSS 4**: Used for the responsive interface, dashboard layouts,
  forms, tables, status badges, and stakeholder-specific screens.
- **Firebase Authentication / Cloud Firestore**: Used during development to
  support a working login, registration, user profile, role, and account status
  feature while the full backend is still being prepared.
- **Firebase Storage**: Considered for development file storage and testing of
  manuscript, project file, final document, and archive upload workflows.
- **Laravel**: Adopted as the planned backend/API framework for the deployed
  system, handling server-side business logic, validation, authentication
  integration, role-based access, database operations, file management,
  notifications, reports, and project workflow processing.
- **Database-backed Storage**: Used for persistent records such as users,
  groups, notifications, audit logs, comments, feedback, QA records, document
  drafts, and project workflow data for deployment.
- **Git/GitHub**: Used for version control, collaboration, revision tracking,
  and project history.

## Current Implementation Notes

- Authentication currently signs users in through Firebase Authentication for
  development and testing.
- After login, the app reads the matching `users/{uid}` document in Firestore to
  determine the user's role and account status during the current prototype
  phase.
- Stakeholder dashboards are implemented under `src/app` using the Next.js App
  Router.
- Workflow data should be stored in the project database before deployment so
  records remain available across users, devices, and sessions.

## Development

Install dependencies, then run the local development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
