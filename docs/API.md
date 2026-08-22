# API Documentation

Base URL: `/api/v1`

All protected routes require `Authorization: Bearer <accessToken>`. Refresh tokens are rotated through HTTP-only cookies.

| Method | Path | Purpose | Permissions |
|---|---|---|---|
| POST | `/auth/signup` | Create account and employee shell | public |
| POST | `/auth/login` | Authenticate and create session | public |
| POST | `/auth/refresh` | Rotate refresh token | session |
| POST | `/auth/logout` | Logout current device | authenticated |
| POST | `/auth/logout-all` | Logout all devices | authenticated |
| POST | `/auth/forgot-password` | Send reset token | public |
| POST | `/auth/reset-password` | Reset password | public |
| GET | `/dashboard/me` | Employee dashboard | `profile:read:self` |
| GET | `/dashboard/admin` | HR dashboard | `analytics:read` |
| GET | `/employees` | Search employees | `employee:read:any` |
| POST | `/employees` | Create employee | `employee:create` |
| GET | `/employees/:id` | Employee details | self or `employee:read:any` |
| PATCH | `/employees/:id` | Update employee | self-limited or `employee:update:any` |
| POST | `/attendance/check-in` | Check in | `attendance:checkin` |
| POST | `/attendance/check-out` | Check out | `attendance:checkout` |
| GET | `/attendance` | Attendance list | self or `attendance:read:any` |
| PATCH | `/attendance/:id` | HR correction | `attendance:manage` |
| POST | `/leaves` | Submit leave | `leave:create` |
| GET | `/leaves` | Leave list | self or `leave:read:any` |
| POST | `/leaves/:id/approve` | Approve leave | `leave:approve` |
| POST | `/leaves/:id/reject` | Reject leave | `leave:reject` |
| GET | `/payroll` | Payroll list | self or `payroll:read:any` |
| PATCH | `/payroll/structures/:employeeId` | Update salary | `payroll:update` |
| GET | `/payroll/:id/slip` | Salary slip PDF | self or `payroll:read:any` |
| GET | `/notifications` | Notification center | `notification:read:self` |
| PATCH | `/notifications/:id/read` | Mark read | owner |
| POST | `/documents` | Upload document | self or HR |
| GET | `/analytics` | Analytics dashboard | `analytics:read` |
| GET | `/reports/:type` | CSV/PDF reports | `reports:read` |
| GET | `/audit-logs` | Audit log | `audit:read` |
| GET | `/search` | Global search | authenticated |
| GET | `/health` | Health check | public |
