# Dayflow HRMS

Dayflow is a full-stack Human Resource Management System for employee records, attendance, leave approvals, payroll, notifications, documents, reports, analytics, audit logs, and role-based administration.

The project is built as a workspace-style application with a React dashboard, an Express TypeScript API, Prisma-ready PostgreSQL schema design, and supporting documentation for architecture, API routes, permissions, workflows, and database relationships.

## Highlights

- Modern React 18 + TypeScript dashboard with Vite.
- Advanced dashboard UI with command search, quick actions, charts, dark mode, responsive layouts, and polished interaction states.
- Express REST API with authentication, JWT access tokens, HTTP-only refresh cookie support, RBAC middleware, validation, rate limiting, CORS, Helmet, and audit logging.
- HR modules for employees, profiles, attendance, leave, payroll, documents, notifications, analytics, reports, settings, sessions, and global search.
- Prisma schema for a production-grade PostgreSQL model.
- Supabase/PostgreSQL reference schema for the simpler shared database track.
- Mermaid diagrams for ER, architecture, and workflows.

## Tech Stack

| Layer | Technology |
|---|---|
| Web | React 18, TypeScript, Vite |
| UI | CSS, lucide-react, Recharts |
| API | Node.js, Express, TypeScript |
| Validation | Zod |
| Security | JWT, bcryptjs, Helmet, CORS, express-rate-limit |
| Database design | PostgreSQL, Prisma schema |
| Legacy/shared DB reference | Supabase SQL schema |
| Tests | Vitest, Testing Library |

## Main Apps

| Path | Purpose |
|---|---|
| `apps/web` | Current React dashboard client. |
| `apps/api` | Current TypeScript Express API and Prisma schema. |
| `backend` | Older Express/Supabase backend track kept for reference/integration history. |
| `database` | Human-readable SQL schema for the simpler Supabase database model. |
| `supabase` | Applied Supabase migrations and policies. |
| `docs` | Architecture, ER diagrams, API docs, permission matrix, and workflows. |

## Demo Credentials

```text
Admin:    hr@dayflow.test / Dayflow@123
Employee: maya@dayflow.test / Dayflow@123
```

## Quick Start

Install dependencies from the repository root:

```bash
npm install
```

Start the web app:

```bash
cd apps/web
npm run dev
```

Start the TypeScript API:

```bash
cd apps/api
npm run dev
```

Default URLs:

```text
Web: http://localhost:5173
API: http://localhost:4200/api/v1
Docs: http://localhost:4200/api/docs
```

## Environment

Copy the example file and fill in values:

```bash
cp .env.example .env
```

Useful variables:

```env
PORT=4200
WEB_ORIGIN=http://localhost:5173
JWT_SECRET=replace-with-a-long-secret
COOKIE_SECURE=false
DATABASE_URL=postgresql://user:password@localhost:5432/dayflow
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
VITE_API_URL=http://localhost:4200/api/v1
```

## Commands

From `apps/web`:

```bash
npm run dev
npm run build
npm run test
npm run lint
```

From `apps/api`:

```bash
npm run dev
npm run build
npm run test
npm run lint
npm run prisma:migrate
npm run prisma:seed
```

From the repository root:

```bash
npm run build
npm run test
npm run lint
npm run migrate
npm run seed
```

## Project Structure

```text
Hack4One/
|-- apps/
|   |-- api/
|   |   |-- prisma/
|   |   |   |-- schema.prisma
|   |   |   `-- seed.ts
|   |   |-- src/
|   |   |   |-- business.ts
|   |   |   |-- data.ts
|   |   |   |-- security.ts
|   |   |   |-- server.ts
|   |   |   |-- tests/
|   |   |   `-- types/
|   |   |-- package.json
|   |   `-- tsconfig.json
|   `-- web/
|       |-- src/
|       |   |-- main.tsx
|       |   |-- styles.css
|       |   |-- app.test.tsx
|       |   `-- vite-env.d.ts
|       |-- index.html
|       |-- package.json
|       |-- postcss.config.js
|       |-- tsconfig.json
|       `-- vite.config.ts
|-- backend/
|   |-- src/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- server.js
|   |   `-- supabaseClient.js
|   `-- package.json
|-- database/
|   `-- schema.sql
|-- docs/
|   |-- API.md
|   |-- ARCHITECTURE.md
|   |-- ER_DIAGRAM.md
|   |-- PERMISSION_MATRIX.md
|   `-- WORKFLOWS.md
|-- supabase/
|   `-- migrations/
|-- package.json
|-- vite.config.ts
|-- tailwind.config.js
`-- tsconfig.json
```

## Architecture

```mermaid
flowchart TB
  User[HR Admin or Employee] --> Web[React Vite Web App]
  Web -->|Bearer access token| API[Express API /api/v1]
  API --> Security[Auth, RBAC, validation, rate limit]
  Security --> Services[Business Services]
  Services --> Memory[(Demo in-memory data)]
  Services -. production model .-> Prisma[Prisma Client]
  Prisma --> Postgres[(PostgreSQL)]
  Services --> Audit[Audit Logs]
  Services --> Notifications[Notifications]
  Services --> Reports[CSV and PDF Exports]
```

The current API uses seeded demo data in `apps/api/src/data.ts` while the production-ready relational model is captured in `apps/api/prisma/schema.prisma`. This lets the hackathon demo run quickly while keeping a clear migration path to PostgreSQL.

## Data Model

Full ER diagram: [docs/ER_DIAGRAM.md](./docs/ER_DIAGRAM.md)

```mermaid
erDiagram
  Role ||--o{ User : assigns
  Role }o--o{ Permission : grants
  User ||--|| Employee : owns
  Department ||--o{ Employee : contains
  Employee ||--o{ Attendance : records
  Employee ||--o{ LeaveRequest : submits
  LeaveType ||--o{ LeaveRequest : categorizes
  Employee ||--o{ Payroll : receives
  Payroll ||--o{ PayrollItem : contains
  Employee ||--o{ Document : owns
  User ||--o{ Notification : receives
  User ||--o{ AuditLog : creates
  User ||--o{ Session : has
```

Core entities:

| Entity | Responsibility |
|---|---|
| `User` | Login identity, email, password hash, role, sessions, audit events. |
| `Role` and `Permission` | RBAC capabilities for admins and employees. |
| `Employee` | HR profile anchor connected to department, manager, payroll, leaves, attendance, and documents. |
| `Attendance` | Daily check-in/check-out, status, hours, anomalies, corrections. |
| `LeaveRequest` and `LeaveBalance` | Leave submission, approval state, yearly balances. |
| `SalaryStructure` and `Payroll` | Salary revisions, payroll periods, generated slips. |
| `Document` | Secure employee document metadata. |
| `AuditLog` | Security and operations history. |

## API Surface

Base URL:

```text
/api/v1
```

Authentication:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "hr@dayflow.test",
  "password": "Dayflow@123",
  "remember": true
}
```

Create employee:

```http
POST /api/v1/employees
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "employeeCode": "EMP-104",
  "fullName": "Ananya Sharma",
  "email": "ananya@dayflow.test",
  "department": "Engineering",
  "jobTitle": "Frontend Engineer",
  "role": "EMPLOYEE"
}
```

Check in:

```http
POST /api/v1/attendance/check-in
Authorization: Bearer <accessToken>
```

Submit leave:

```http
POST /api/v1/leaves
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "leaveTypeId": "lt_paid",
  "startDate": "2026-09-01",
  "endDate": "2026-09-03",
  "remarks": "Family travel"
}
```

Export report:

```http
GET /api/v1/reports/employees
Authorization: Bearer <accessToken>
```

See the full route list in [docs/API.md](./docs/API.md).

## Frontend Modules

The web app is currently implemented in `apps/web/src/main.tsx` with supporting styles in `apps/web/src/styles.css`.

Main screens:

- Auth screen with login, sign up, and reset modes.
- Dashboard with metrics, charts, quick actions, and insight cards.
- Employee directory with search, create, view, edit, and soft delete.
- Profile editor with completion tracking.
- Attendance with check-in/check-out and HR correction actions.
- Leave submission and approval.
- Payroll history and salary structure update.
- Notifications, documents, analytics, reports, audit logs, settings, and command palette.

## Backend Modules

`apps/api/src/server.ts` wires the routes and middleware.

```ts
app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000), limit: Number(process.env.RATE_LIMIT_MAX || 100) }));
app.use("/api/v1", api);
```

`apps/api/src/security.ts` owns authentication and permission checks.

```ts
api.get("/employees", requirePermission("employee:read:any"), (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const employees = db.employees.filter((employee) =>
    [employee.fullName, employee.employeeCode, employee.email, employee.department]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
  res.json(paginate(employees, req.query.page, req.query.pageSize));
});
```

`apps/api/src/business.ts` owns workflow operations such as attendance, leave decisions, salary updates, analytics, and audit events.

## Security Model

- Passwords are hashed with `bcryptjs`.
- API responses use JWT access tokens.
- Refresh token values are stored as hashes and sent through HTTP-only cookies.
- RBAC is enforced through route-level `requirePermission(...)`.
- Sensitive employee operations write audit entries.
- Helmet, CORS, JSON body limits, and rate limiting are enabled.
- Document upload metadata validates size and MIME type.
- Employee users can read and update only their allowed self-service fields.

## Permission Overview

Full matrix: [docs/PERMISSION_MATRIX.md](./docs/PERMISSION_MATRIX.md)

| Capability | Admin | Employee |
|---|---:|---:|
| Manage employees | Yes | No |
| Check in/out | Yes | Yes |
| Correct attendance | Yes | No |
| Submit leave | Yes | Yes |
| Approve leave | Yes | No |
| Read own payroll | Yes | Yes |
| Update salary | Yes | No |
| View analytics/reports | Yes | No |
| Read audit logs | Yes | No |

## Database Tracks

There are two database references in the repository:

1. `apps/api/prisma/schema.prisma`
   - Production-oriented normalized schema.
   - Includes roles, permissions, sessions, audit logs, departments, employee profiles, attendance audits, leave balances, payroll items, salary slips, documents, tokens, and organization settings.

2. `database/schema.sql`
   - Simpler Supabase/PostgreSQL schema for the original shared database track.
   - Includes users, employees, attendance, leave requests, payroll, RLS notes, indexes, and triggers.

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [ER Diagram](./docs/ER_DIAGRAM.md)
- [API Documentation](./docs/API.md)
- [Permission Matrix](./docs/PERMISSION_MATRIX.md)
- [Workflow Diagrams](./docs/WORKFLOWS.md)
- [Requirements Traceability](./REQUIREMENTS.md)

## Build Verification

For the web app:

```bash
cd apps/web
npm run build
```

Expected output:

```text
tsc -b && vite build
✓ built
```

## Notes for Contributors

- Keep API routes under `/api/v1`.
- Keep user-facing business rules in services or route handlers, not UI-only logic.
- Add audit entries for HR-sensitive changes.
- Update [docs/ER_DIAGRAM.md](./docs/ER_DIAGRAM.md) whenever the Prisma schema changes.
- Update [docs/API.md](./docs/API.md) whenever a route is added, removed, or changed.
- Do not commit generated `dist` changes unless release packaging requires them.
