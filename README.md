# Dayflow HRMS

A collaborative full-stack Human Resource Management System built by a 3-person team.

## Project Structure

```
Dayflow/
├── backend/          # Express API server (shared by all modules)
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT verification + role checks
│   │   ├── routes/
│   │   │   ├── authRoutes.js     # POST /api/auth/login, /register
│   │   │   ├── employeeRoutes.js # GET/PUT /api/employees
│   │   │   ├── attendanceRoutes.js # POST check-in/out, GET attendance
│   │   │   ├── leaveRoutes.js    # POST/GET leaves, PUT approve/reject
│   │   │   └── payrollRoutes.js  # GET/PUT payroll
│   │   ├── supabaseClient.js    # Shared Supabase client (service role)
│   │   └── server.js            # Express app entry point
│   └── package.json
├── database/         # Shared database schema
│   └── schema.sql    # Canonical schema (all 5 tables + triggers + indexes)
├── src/              # Frontend React application (Vite + TypeScript)
│   ├── components/   # Shared UI: Layout, Sidebar, ProtectedRoute, UI primitives
│   ├── context/      # AuthContext (Supabase session + app user)
│   ├── lib/          # supabase.ts, api.ts, mappers.ts, theme.ts
│   ├── pages/        # auth/, employee/, admin/ page components
│   ├── router/       # Lightweight router with Link + useRouter
│   ├── types/        # Shared TypeScript types (camelCase frontend shapes)
│   └── App.tsx       # Root: providers + route resolution
├── supabase/
│   └── migrations/   # Applied Supabase migrations (with RLS policies)
├── .env.example      # Copy to .env and fill in values
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

## Database

There is **one shared database** in Supabase. The schema is defined in
`database/schema.sql` and the applied migration with full RLS policies lives in
`supabase/migrations/`.

### Tables

| Table            | Primary Key     | Connects To                     |
|------------------|-----------------|----------------------------------|
| `users`          | `user_id`       | → `employees.user_id`           |
| `employees`      | `employee_id`   | → `attendance.employee_id`       |
|                  |                 | → `leave_requests.employee_id`   |
|                  |                 | → `payroll.employee_id`          |
| `attendance`     | `attendance_id` | ← `employees.employee_id`       |
| `leave_requests` | `leave_id`      | ← `employees.employee_id`       |
| `payroll`        | `payroll_id`    | ← `employees.employee_id`       |

### Naming Convention

- **Database**: `snake_case` (`employee_id`, `full_name`, `check_in`)
- **Frontend**: `camelCase` (`employeeId`, `fullName`, `checkIn`)
- Mapping happens in `src/lib/mappers.ts`

## API Contract

All routes are prefixed with `/api`.

### Authentication

| Method | Route               | Description              |
|--------|---------------------|--------------------------|
| POST   | `/api/auth/register`| Create a new account     |
| POST   | `/api/auth/login`   | Sign in, returns JWT     |

### Employees

| Method | Route                      | Access  | Description           |
|--------|----------------------------|---------|-----------------------|
| GET    | `/api/employees`           | Admin   | List all employees    |
| GET    | `/api/employees/:employee_id` | Own/Admin | Get one employee |
| PUT    | `/api/employees/:employee_id` | Own/Admin | Update employee  |

### Attendance

| Method | Route                            | Access  | Description            |
|--------|----------------------------------|---------|------------------------|
| POST   | `/api/attendance/check-in`       | Own     | Check in for today     |
| POST   | `/api/attendance/check-out`      | Own     | Check out for today    |
| GET    | `/api/attendance/:employee_id`   | Own/Admin | Get employee records |
| GET    | `/api/attendance`                | Admin   | Get all attendance     |

### Leave

| Method | Route                              | Access  | Description             |
|--------|------------------------------------|---------|-------------------------|
| POST   | `/api/leaves`                      | Own     | Create leave request    |
| GET    | `/api/leaves/:employee_id`         | Own/Admin | Get employee's leaves |
| GET    | `/api/leaves`                      | Admin   | Get all leave requests  |
| PUT    | `/api/leaves/:leave_id/approve`    | Admin   | Approve a leave         |
| PUT    | `/api/leaves/:leave_id/reject`     | Admin   | Reject a leave          |

### Payroll

| Method | Route                       | Access  | Description           |
|--------|-----------------------------|---------|-----------------------|
| GET    | `/api/payroll/:employee_id` | Own/Admin | Get employee payroll |
| GET    | `/api/payroll`              | Admin   | Get all payroll       |
| PUT    | `/api/payroll/:employee_id` | Admin   | Update/insert payroll |

## Setup

### Prerequisites
- Node.js 18+
- A Supabase project (URL + keys)

### Environment
1. Copy `.env.example` to `.env`
2. Fill in your Supabase URL, anon key, and service role key
3. Set `DATABASE_URL` to your Supabase Postgres connection string

### Frontend
```bash
npm install
npm run dev      # Vite dev server (runs automatically in Bolt)
npm run build    # Production build
npm run typecheck # Type checking
```

### Backend
```bash
cd backend
npm install
npm run dev      # Starts Express on port 3001
```

## Team Responsibilities

| Developer | Tool             | Modules                                      |
|-----------|------------------|----------------------------------------------|
| Dev 1 (Technical Head) | Bolt | Architecture, shared UI, database, integration, testing |
| Dev 2    | Antigravity      | Auth, login, roles, dashboards, attendance   |
| Dev 3    | VS Code + Copilot | Profile, leave, payroll                      |

## Git Workflow

- Branch: `feature/technical-head`
- Pull before starting: `git pull origin main`
- Commit hourly: `git commit -m "Hour X: <description>"`
- Never force push
- Technical Head merges stable branches into `main`
