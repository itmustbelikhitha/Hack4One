# API Documentation

Base URL:

```text
/api/v1
```

Protected routes require:

```http
Authorization: Bearer <accessToken>
```

Refresh tokens are issued through HTTP-only cookies.

## Response Shape

Success responses return JSON objects or CSV/PDF attachments depending on the endpoint.

Error responses use:

```json
{
  "error": {
    "code": "REQUEST_FAILED",
    "message": "Human readable message"
  }
}
```

Paginated responses use:

```json
{
  "data": [],
  "page": 1,
  "pageSize": 10,
  "total": 0
}
```

## Route Matrix

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/health` | Service health check | Public |
| POST | `/auth/signup` | Create account and employee shell | Public |
| POST | `/auth/login` | Authenticate and create session | Public |
| POST | `/auth/logout` | Revoke current session | Authenticated |
| POST | `/auth/logout-all` | Revoke all sessions | Authenticated |
| POST | `/auth/forgot-password` | Queue reset token | Public |
| POST | `/auth/reset-password` | Reset password by token | Public |
| GET | `/me` | Current user, employee, permissions | Authenticated |
| GET | `/dashboard/me` | Employee dashboard | `profile:read:self` |
| GET | `/dashboard/admin` | HR dashboard | `analytics:read` |
| GET | `/employees` | Search/list employees | `employee:read:any` |
| POST | `/employees` | Create employee | `employee:create` |
| GET | `/employees/:id` | Read employee | Self or admin |
| PATCH | `/employees/:id` | Update employee | Self-limited or admin |
| DELETE | `/employees/:id` | Soft-delete employee | `employee:delete` |
| GET | `/attendance` | Attendance list | Self or admin |
| POST | `/attendance/check-in` | Check in for today | `attendance:checkin` |
| POST | `/attendance/check-out` | Check out for today | `attendance:checkout` |
| PATCH | `/attendance/:id` | HR attendance correction | `attendance:manage` |
| GET | `/leaves` | Leave list, types, balances | Self or admin |
| POST | `/leaves` | Submit leave request | `leave:create` |
| POST | `/leaves/:id/approve` | Approve leave | `leave:approve` |
| POST | `/leaves/:id/reject` | Reject leave | `leave:reject` |
| GET | `/payroll` | Payroll list | Self or admin |
| PATCH | `/payroll/structures/:employeeId` | Update salary | `payroll:update` |
| GET | `/payroll/:id/slip` | Salary slip PDF | Self or admin |
| GET | `/notifications` | Notification center | Owner |
| PATCH | `/notifications/:id/read` | Mark notification read | Owner |
| PATCH | `/notifications/read-all` | Mark all notifications read | Owner |
| GET | `/documents` | Document list | Self or admin |
| POST | `/documents` | Create document metadata | Self or admin |
| GET | `/documents/:id` | Preview document | Self or admin |
| DELETE | `/documents/:id` | Soft-delete document | Self or admin |
| GET | `/analytics` | Analytics datasets | `analytics:read` |
| GET | `/reports/:type` | CSV report export | `reports:read` |
| GET | `/audit-logs` | Audit log list | `audit:read` |
| GET | `/search` | Global search | Authenticated |
| GET | `/settings` | Organization settings | `settings:manage` |
| PATCH | `/settings/organization` | Update organization settings | `settings:manage` |
| POST | `/settings/departments` | Create department | `settings:manage` |
| POST | `/settings/leave-types` | Create leave type | `settings:manage` |
| GET | `/sessions` | Current user sessions | Authenticated |

## Authentication Examples

### Sign Up

```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "employeeId": "EMP-105",
  "email": "new.employee@dayflow.test",
  "password": "Dayflow@123",
  "role": "EMPLOYEE"
}
```

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "hr@dayflow.test",
  "password": "Dayflow@123",
  "remember": true
}
```

Example response:

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "u_admin",
    "employeeId": "HR-001",
    "email": "hr@dayflow.test",
    "role": "ADMIN"
  },
  "permissions": ["employee:create", "analytics:read"],
  "employee": {
    "id": "emp_admin",
    "fullName": "HR Admin"
  }
}
```

## Employee Examples

### List Employees

```http
GET /api/v1/employees?q=engineering&page=1&pageSize=10
Authorization: Bearer <accessToken>
```

### Create Employee

```http
POST /api/v1/employees
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "employeeCode": "EMP-204",
  "fullName": "Riya Mehta",
  "email": "riya@dayflow.test",
  "department": "Design",
  "jobTitle": "Product Designer",
  "role": "EMPLOYEE"
}
```

### Update Employee

```http
PATCH /api/v1/employees/emp_123
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "phone": "+91 98765 43210",
  "address": "Ahmedabad, Gujarat",
  "profilePictureUrl": "https://example.com/profile.jpg"
}
```

## Attendance Examples

### Check In

```http
POST /api/v1/attendance/check-in
Authorization: Bearer <accessToken>
```

### Check Out

```http
POST /api/v1/attendance/check-out
Authorization: Bearer <accessToken>
```

### HR Correction

```http
PATCH /api/v1/attendance/att_123
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "status": "PRESENT",
  "checkInAt": "2026-08-22T09:30:00.000Z",
  "checkOutAt": "2026-08-22T17:45:00.000Z",
  "notes": "HR correction after manager approval"
}
```

## Leave Examples

### Submit Leave

```http
POST /api/v1/leaves
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "leaveTypeId": "lt_paid",
  "startDate": "2026-09-10",
  "endDate": "2026-09-12",
  "remarks": "Travel"
}
```

### Approve Leave

```http
POST /api/v1/leaves/lv_123/approve
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "comment": "Approved by HR"
}
```

## Payroll Examples

### Payroll List

```http
GET /api/v1/payroll
Authorization: Bearer <accessToken>
```

### Update Salary

```http
PATCH /api/v1/payroll/structures/emp_123
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "baseSalary": 90000,
  "allowances": 12000,
  "deductions": 4500,
  "reason": "Annual revision"
}
```

## Document Examples

### Create Document Metadata

```http
POST /api/v1/documents
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "employeeId": "emp_123",
  "name": "Offer Letter",
  "category": "Employment",
  "mimeType": "application/pdf",
  "sizeBytes": 1000
}
```

Allowed MIME types:

```text
application/pdf
image/png
image/jpeg
```

Maximum size:

```text
10 MB
```

## Reports

Supported report types:

```text
employees
payroll
leaves
attendance
```

Example:

```http
GET /api/v1/reports/payroll
Authorization: Bearer <accessToken>
```

Response:

```text
Content-Type: text/csv
Content-Disposition: attachment; filename="payroll-report.csv"
```
