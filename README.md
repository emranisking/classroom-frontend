# Assignment Management System — Frontend

A Vue 3 (Composition API) single-page app for the Assignment Management API, styled after
Google Classroom: a green-accented top bar, a collapsible left rail, and colorful class
banner cards.

## Stack

- Vue 3 + `<script setup>`
- Vue Router 4 (hash history, role-based route guards)
- Pinia (auth session + toast notifications)
- Axios (JWT attached via interceptor, auto-redirect to login on 401)
- Plain CSS with a small design-token file (`src/assets/main.css`) — no UI framework

## Getting started

```bash
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if your API isn't on /api
npm run dev
```

The dev server proxies `/api/*` to `http://localhost:8080` (see `vite.config.js`), matching
the Docker port from the API spec. If you run the API on `http://localhost:5080` instead,
update the proxy target or set `VITE_API_BASE_URL` to the full URL.

```bash
npm run build      # production build -> dist/
npm run preview    # preview the production build locally
```

## What's implemented

**Auth**
- Register (student) / Login / JWT persisted to `localStorage`, attached to every request
- Route guards redirect unauthenticated users to `/login` and enforce role restrictions

**Student**
- Dashboard: enrolled classes as Classroom-style cards; "Join a class" modal to browse
  open classes and request enrollment
- Enrollments page: pending/approved/rejected requests with manual refresh, active
  enrollments with drop
- Class page: Stream (details) + Classwork (assignment list)
- Assignment page: upload a PDF submission (client-side type/size checks, progress bar)
- Submission page: download PDF, view version history, request a resubmission, upload a
  new version once approved
- Results page: published grades with a simple average/summary

**Teacher**
- Dashboard: classes they teach
- Class page: create assignments (as Draft)
- Assignment page: edit, publish, publish results, delete, list submissions
- Submission page: grade with marks + feedback
- Teacher applications: apply to teach a course
- Resubmissions: approve/reject student requests

**Admin**
- Everything above, plus:
- Courses admin: create/edit/delete courses
- Classes admin: create classes, assign teachers, open/close/cancel
- Users admin: create users of any role, activate/deactivate
- Teacher applications: approve/reject

**Shared**
- Toasts for success/error feedback on every mutation
- Empty states, loading spinners, and a reusable modal component
- Response envelope (`{ success, message, data, errors }`) handled centrally; error
  `message` surfaced in the UI

## Project structure

```
src/
├── assets/main.css        design tokens + shared component classes
├── components/             TopBar, Sidebar, ClassCard, Modal, EmptyState, LoadingSpinner, ToastHost
├── router/index.js         routes + auth/role guards
├── services/
│   ├── http.js              axios instance + interceptors
│   └── api.js                one function per backend endpoint, grouped by resource
├── stores/
│   ├── auth.js               session state (token, user, role getters)
│   └── toast.js               toast notifications
└── views/                   one file per route (see router/index.js)
```

## Notes / assumptions

- The backend's `ApiResponse` envelope is unwrapped as `res.data.data` throughout.
- File downloads go through axios (with the auth header) as a blob, then trigger a
  browser download — a plain `<a href>` wouldn't carry the JWT.
- A student's own submission for an assignment isn't a listed endpoint (the submissions
  list is Admin/Teacher-only), so the assignment page shows the "view submission" link
  using the response from the upload call itself, for the current session.
- Pagination controls aren't built out (list pages request a page size of 50–100); wire up
  `pageNumber`/`totalPages` from `PaginationResponse` if your data grows past that.
