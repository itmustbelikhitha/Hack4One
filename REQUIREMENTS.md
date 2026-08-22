# Dayflow Requirements Traceability

The pasted Dayflow specification is treated as the primary source because no PDF file was present in the workspace.

| ID | Section | Requirement | Implementation Location | API Endpoint | Database Entity | Frontend Page | Test Case | Status |
|---|---|---|---|---|---|---|---|---|
| FR-AUTH-001 | 4 Sign Up | Register with employee ID, email, password, role, validation and duplicate prevention | `apps/api/src/modules/auth.ts` | `POST /api/v1/auth/signup` | `User`, `Employee`, `AuditLog` | `apps/web/src/pages/Auth.tsx` | `apps/api/src/tests/auth.test.ts` | Complete |
| FR-AUTH-002 | 4 Sign In | Login with remember me, secure errors, redirect by role | `apps/api/src/modules/auth.ts` | `POST /api/v1/auth/login` | `User`, `Session`, `LoginActivity` | `apps/web/src/pages/Auth.tsx` | `apps/api/src/tests/auth.test.ts` | Complete |
| FR-AUTH-003 | 4 Advanced Auth | Email verification, reset password, sessions, logout all, refresh rotation, MFA-ready | `apps/api/src/modules/auth.ts` | `/api/v1/auth/*` | `VerificationToken`, `PasswordResetToken`, `Session` | `apps/web/src/pages/Auth.tsx`, `Settings.tsx` | `auth.test.ts` | Complete |
| FR-RBAC-001 | 5 RBAC | Central backend and frontend authorization | `apps/api/src/security/authorization.ts`, `apps/web/src/auth/AuthProvider.tsx` | All protected APIs | `Role`, `Permission` | Protected routes | `authorization.test.ts` | Complete |
| FR-DASH-EMP-001 | 6 Employee Dashboard | Metrics, cards, recent activity, alerts, charts | `apps/api/src/modules/dashboard.ts` | `GET /api/v1/dashboard/me` | `Attendance`, `LeaveRequest`, `Payroll`, `Notification` | `Dashboard.tsx` | `dashboard.test.ts` | Complete |
| FR-DASH-ADM-001 | 7 Admin Dashboard | HR command center with employee table, metrics, export | `apps/api/src/modules/dashboard.ts` | `GET /api/v1/dashboard/admin` | Multiple | `Dashboard.tsx`, `Employees.tsx` | `dashboard.test.ts` | Complete |
| FR-EMP-001 | 8 Profiles | Personal, job, salary, documents, completion, limited employee edits | `apps/api/src/modules/employees.ts` | `/api/v1/employees/*` | `Employee`, `EmployeeProfile`, `Document` | `Profile.tsx`, `Employees.tsx` | `employees.test.ts` | Complete |
| FR-ATT-001 | 9 Attendance | Check-in/out, daily weekly monthly views, calculations, HR corrections, anomaly/audit | `apps/api/src/modules/attendance.ts` | `/api/v1/attendance/*` | `Attendance`, `AttendanceAudit` | `Attendance.tsx` | `attendance.test.ts` | Complete |
| FR-LEAVE-001 | 10 Leave | Paid/sick/unpaid leave, overlap checks, approval transitions, balances, notifications | `apps/api/src/modules/leaves.ts` | `/api/v1/leaves/*` | `LeaveType`, `LeaveRequest`, `LeaveBalance` | `Leave.tsx` | `leave.test.ts` | Complete |
| FR-PAY-001 | 11 Payroll | Read-only employee payroll, admin salary structures, salary slips PDF | `apps/api/src/modules/payroll.ts` | `/api/v1/payroll/*` | `SalaryStructure`, `Payroll`, `PayrollItem`, `SalarySlip` | `Payroll.tsx` | `payroll.test.ts` | Complete |
| FR-NOTIF-001 | 12 Notifications | In-app center, unread count, preferences, mark read | `apps/api/src/modules/notifications.ts` | `/api/v1/notifications/*` | `Notification`, `NotificationPreference` | `Notifications.tsx` | `notifications.test.ts` | Complete |
| FR-AN-001 | 13 Analytics | Attendance, leave, payroll, employee analytics and reports | `apps/api/src/modules/analytics.ts` | `/api/v1/analytics`, `/api/v1/reports/*` | Multiple | `Analytics.tsx`, `Reports.tsx` | `analytics.test.ts` | Complete |
| FR-DB-001 | 14 Database | Normalized PostgreSQL with constraints, indexes, seed, migrations | `apps/api/prisma/schema.prisma` | N/A | All listed entities | N/A | Prisma validation | Complete |
| FR-AUDIT-001 | 15 Audit | Audit important events with filters and pagination | `apps/api/src/modules/audit.ts` | `/api/v1/audit-logs` | `AuditLog` | `AuditLogs.tsx` | `audit.test.ts` | Complete |
| FR-SEC-001 | 16 Security | Hashing, JWT, cookies, CORS, CSRF-ready, rate limiting, headers, validation | `apps/api/src/security/*` | All APIs | `Session`, `AuditLog` | All pages | `security.test.ts` | Complete |
| FR-API-001 | 17 API | REST v1, errors, pagination, filtering, sorting, OpenAPI | `apps/api/src/routes.ts`, `docs/API.md` | `/api/v1/*`, `/api/docs` | All | API client | `api.test.ts` | Complete |
| FR-FE-001 | 18 Frontend | Professional modular React architecture | `apps/web/src` | API client | N/A | All pages | `app.test.tsx` | Complete |
| FR-RESP-001 | 19 Responsive | Desktop, tablet, mobile layouts | `apps/web/src/styles.css` | N/A | N/A | All pages | `e2e/dayflow.spec.ts` | Complete |
| FR-SEARCH-001 | 20 Search | Global and module-specific debounced server search | `apps/api/src/modules/search.ts` | `/api/v1/search` | Employee, attendance, leave, payroll, audit | Command palette, tables | `search.test.ts` | Complete |
| FR-UX-001 | 21 Advanced UX | Command palette, dialogs, toasts, skeletons, unsaved-change handling | `apps/web/src/components` | All APIs | N/A | All pages | `app.test.tsx` | Complete |
| FR-DOC-001 | 23 Documents | Secure upload, download, delete, metadata and validation | `apps/api/src/modules/documents.ts` | `/api/v1/documents/*` | `Document` | `Documents.tsx` | `documents.test.ts` | Complete |
| FR-OPS-001 | 30 Admin Operations | Org, departments, leave types, permissions, notifications, payroll, audit, security | `apps/api/src/modules/settings.ts` | `/api/v1/settings/*` | `OrganizationSetting`, `Department`, `LeaveType`, `Permission` | `Settings.tsx` | `settings.test.ts` | Complete |
| FR-BIZ-001 | 31-33 Business Rules | Service-layer business logic, event workflows, transactions, constraints | `apps/api/src/services` | All module APIs | Multiple | All workflows | Unit and integration tests | Complete |
| FR-DOCS-001 | 34 Documentation | README, ER, architecture, API, matrix, workflows | `README.md`, `docs/*` | N/A | N/A | N/A | Docs review | Complete |
| FR-PAGES-001 | 35 UI Pages | Public, employee, and admin pages | `apps/web/src/pages` | All APIs | N/A | Listed pages | E2E smoke | Complete |
| FR-QA-001 | 25, 37, 40 | Tests, build, lint, acceptance tracking | `apps/*/src/tests`, `apps/web/e2e` | N/A | N/A | N/A | `npm run test` | Complete |
