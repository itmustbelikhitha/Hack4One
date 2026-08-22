Here is your clean, single, unified `README.md` combining everything for your **4-person team**, complete with your architecture, demo credentials, database schemas, API routes, and clear module assignments:

```markdown
# Dayflow HRMS

Every workday, perfectly aligned.

Dayflow is a production-oriented Human Resource Management System built collaboratively by a 4-person team, covering authentication, RBAC, employee profiles, attendance, leave, and payroll operations.

## Architecture

- `apps/api`: Node.js, Express, TypeScript, and database-connected REST API.
- `apps/web`: React, TypeScript, Vite dashboard client.
- `database/schema.sql`: Canonical PostgreSQL schema with constraints, relationships, and indexes.
- `docs`: ER, architecture, workflows, API, and permission documentation.

The backend exposes REST APIs under `/api/*`. The frontend uses protected routes, reusable dashboard surfaces, validated forms, responsive layouts, and real API calls.

## Demo Credentials

- Admin: `hr@dayflow.test` / `Dayflow@123`
- Employee: `maya@dayflow.test` / `Dayflow@123`

## Project Structure


```

Dayflow/
├── backend/             # Express API server (shared by all modules)
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT verification + role checks
│   │   ├── routes/
│   │   │   ├── authRoutes.js      # POST /api/auth/login, /register
│   │   │   ├── employeeRoutes.js # GET/PUT /api/employees
│   │   │   ├── attendanceRoutes.js # POST check-in/out, GET attendance
│   │   │   ├── leaveRoutes.js    # POST/GET leaves, PUT approve/reject
│   │   │   └── payrollRoutes.js  # GET/PUT payroll
│   │   ├── supabaseClient.js    # Shared Supabase client (service role)
│   │   └── server.js            # Express app entry point
│   └── package.json
├── database/            # Shared database schema
│   └── schema.sql       # Canonical schema (all 5 tables + triggers + indexes)
├── src/                 # Frontend React application (Vite + TypeScript)
│   ├── components/      # Shared UI: Layout, Sidebar, ProtectedRoute, UI primitives
│   ├── context/         # AuthContext (Supabase session + app user)
│   ├── lib/             # supabase.ts, api.ts, mappers.ts, theme.ts
│   ├── pages/           # auth/, employee/, admin/ page components
│   ├── router/          # Lightweight router with Link + useRouter
│   ├── types/           # Shared TypeScript types (camelCase frontend shapes)
│   └── App.tsx          # Root: providers + route resolution
├── supabase/
│   └── migrations/      # Applied Supabase migrations (with RLS policies)
├── .env.example         # Copy to .env and fill in values
├── .gitignore
└── README.md

```

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18 + TypeScript + Vite        |
| Styling     | Tailwind CSS                        |
| Icons       | lucide-react                        |
| Backend     | Express.js (Node.js)                |
| Database    | PostgreSQL (Supabase)               |
| Auth        | Supabase Auth (email/password)      |
| Security    | Row Level Security (RLS) on all tables |

## Database & Tables

There is **one shared database** in Supabase. The schema is defined in `database/schema.sql`.

| Table            | Primary Key     | Connects To                     |
|------------------|-----------------|----------------------------------|
| `users`          | `user_id`       | → `employees.user_id`            |
| `employees`      | `employee_id`   | → `attendance.employee_id`       |
|                  |                 | → `leave_requests.employee_id`   |
|                  |                 | → `payroll.employee_id`          |
| `attendance`     | `attendance_id` | ← `employees.employee_id`        |
| `leave_requests` | `leave_id`      | ← `employees.employee_id`        |
| `payroll`        | `payroll_id`    | ← `employees.employee_id`        |

- **Database Naming**: `snake_case` (`employee_id`, `full_name`, `check_in`)
- **Frontend Naming**: `camelCase` (`employeeId`, `fullName`, `checkIn`)

## API Contract

All routes are prefixed with `/api`.

- **Authentication**: `POST /api/auth/register`, `POST /api/auth/login`
- **Employees**: `GET /api/employees`, `GET /api/employees/:employee_id`, `PUT /api/employees/:employee_id`
- **Attendance**: `POST /api/attendance/check-in`, `POST /api/attendance/check-out`, `GET /api/attendance/:employee_id`, `GET /api/attendance`
- **Leave**: `POST /api/leaves`, `GET /api/leaves/:employee_id`, `GET /api/leaves`, `PUT /api/leaves/:leave_id/approve`, `PUT /api/leaves/:leave_id/reject`
- **Payroll**: `GET /api/payroll/:employee_id`, `GET /api/payroll`, `PUT /api/payroll/:employee_id`

## Setup & Running Locally

1. Copy `.env.example` to `.env` and fill in your Supabase configuration.
2. Install frontend and backend dependencies:
   ```bash
   npm install
   cd backend && npm install && cd ..

```

3. Run the development environments:
```bash
npm run dev

```



## 4-Person Team Module Breakdown

| Developer | Tool / Environment | Assigned Modules |
| --- | --- | --- |
| **Person 1** | Bolt.new / VS Code | **Login + Dashboard:** Authentication, employee/admin roles, employee & admin dashboards, layout navigation. |
| **Person 2** | Antigravity / VS Code | **Attendance:** Check-in, check-out, daily attendance tracking, attendance history, and admin attendance views. |
| **Person 3** | VS Code + Copilot | **Leave Management:** Apply for leave, leave history, admin approve/reject actions, and status updates. |
| **Person 4** | VS Code + Cursor | **Profile + Payroll:** Employee profile management, salary details, admin employee list, and payroll reports. |

## Git Workflow

* Always pull latest changes before starting work: `git pull origin main --rebase`
* Create feature branches: `git checkout -b feature/<module-name>`
* Commit hourly with clear messages: `git commit -m "Hour X: <description>"`
* Push regularly to keep the team synchronized.

```

---

### How to update your README on GitHub right now:
1. Open your project in **VS Code**.
2. Open the existing `README.md` file at the root level.
3. Select everything inside it, paste the code block above, and save the file.
4. Run these quick commands in your terminal:
   ```bash
   git add README.md
   git commit -m "Update clean unified 4-person README"
   git push origin main

```
