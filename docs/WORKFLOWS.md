# Workflow Diagrams

This file documents the main HR workflows implemented by the Dayflow API and dashboard.

## Authentication

```mermaid
sequenceDiagram
  participant User
  participant Web
  participant API
  participant Security
  participant Data
  participant Audit

  User->>Web: Enter email and password
  Web->>API: POST /auth/login
  API->>Data: Find user by email
  API->>Security: Compare password hash
  Security-->>API: Valid credentials
  API->>Security: Sign access token
  API->>Data: Store refresh token hash
  API->>Audit: LOGIN
  API-->>Web: accessToken, user, employee, permissions
  Web-->>User: Open dashboard
```

## Employee Onboarding

```mermaid
sequenceDiagram
  participant HR
  participant Web
  participant API
  participant RBAC
  participant Data
  participant Audit

  HR->>Web: Submit employee form
  Web->>API: POST /employees
  API->>RBAC: require employee:create
  RBAC-->>API: Allowed
  API->>Data: Check duplicate email or employee code
  API->>Data: Create user with starter password
  API->>Data: Create employee profile
  API->>Audit: EMPLOYEE_CREATION
  API-->>Web: New employee
  Web-->>HR: Directory updates
```

## Profile Update

```mermaid
sequenceDiagram
  participant Employee
  participant Web
  participant API
  participant Guard
  participant Data
  participant Audit

  Employee->>Web: Edit phone, address, photo
  Web->>API: PATCH /employees/:id
  API->>Guard: Check self or admin
  Guard-->>API: Allowed fields only
  API->>Data: Update profile fields
  API->>Audit: EMPLOYEE_UPDATE
  API-->>Web: Updated employee
  Web-->>Employee: Completion progress updates
```

## Attendance Check-In and Check-Out

```mermaid
sequenceDiagram
  participant Employee
  participant Web
  participant API
  participant AttendanceService
  participant Data
  participant Audit

  Employee->>Web: Click Check in
  Web->>API: POST /attendance/check-in
  API->>AttendanceService: checkIn(userId)
  AttendanceService->>Data: Create or update today's record
  AttendanceService->>Audit: ATTENDANCE_CHECK_IN
  API-->>Web: Attendance record

  Employee->>Web: Click Check out
  Web->>API: POST /attendance/check-out
  API->>AttendanceService: checkOut(userId)
  AttendanceService->>Data: Set checkout, hours, anomaly flag
  AttendanceService->>Audit: ATTENDANCE_CHECK_OUT
  API-->>Web: Updated record
```

## HR Attendance Correction

```mermaid
sequenceDiagram
  participant HR
  participant Web
  participant API
  participant RBAC
  participant Data
  participant Audit

  HR->>Web: Correct status or time
  Web->>API: PATCH /attendance/:id
  API->>RBAC: require attendance:manage
  RBAC-->>API: Allowed
  API->>Data: Read before state
  API->>Data: Apply correction and recalculate hours
  API->>Audit: ATTENDANCE_MODIFICATION with before/after
  API-->>Web: Corrected record
```

## Leave Submission

```mermaid
sequenceDiagram
  participant Employee
  participant Web
  participant API
  participant LeaveService
  participant Data
  participant Audit

  Employee->>Web: Submit leave request
  Web->>API: POST /leaves
  API->>LeaveService: Validate dates and leave type
  LeaveService->>Data: Create PENDING request
  LeaveService->>Data: Update pending balance
  LeaveService->>Audit: LEAVE_REQUEST_CREATE
  API-->>Web: Created leave request
```

## Leave Approval

```mermaid
sequenceDiagram
  participant HR
  participant Web
  participant API
  participant RBAC
  participant LeaveService
  participant Data
  participant Audit
  participant Notification

  HR->>Web: Approve or reject leave
  Web->>API: POST /leaves/:id/approve or /reject
  API->>RBAC: require leave:approve or leave:reject
  RBAC-->>API: Allowed
  API->>LeaveService: Decide leave
  LeaveService->>Data: Update status, approver note, decidedAt
  LeaveService->>Data: Update balances
  LeaveService->>Notification: Notify employee
  LeaveService->>Audit: LEAVE_APPROVED or LEAVE_REJECTED
  API-->>Web: Updated leave request
```

## Salary Structure Update

```mermaid
sequenceDiagram
  participant HR
  participant Web
  participant API
  participant RBAC
  participant PayrollService
  participant Data
  participant Audit

  HR->>Web: Update salary structure
  Web->>API: PATCH /payroll/structures/:employeeId
  API->>RBAC: require payroll:update
  RBAC-->>API: Allowed
  API->>PayrollService: updateSalary(employeeId, body)
  PayrollService->>Data: Save salary values and net amount
  PayrollService->>Data: Create revision history
  PayrollService->>Audit: SALARY_STRUCTURE_UPDATE
  API-->>Web: Updated salary structure
```

## Document Upload Metadata

```mermaid
sequenceDiagram
  participant User
  participant Web
  participant API
  participant Guard
  participant Data
  participant Audit

  User->>Web: Add document metadata
  Web->>API: POST /documents
  API->>Guard: Check self or admin access
  API->>API: Validate MIME type and max size
  API->>Data: Store document metadata and storage key
  API->>Audit: DOCUMENT_UPLOAD
  API-->>Web: Created document
```

## Reports

```mermaid
sequenceDiagram
  participant HR
  participant Web
  participant API
  participant RBAC
  participant Data

  HR->>Web: Click report tile
  Web->>API: GET /reports/:type
  API->>RBAC: require reports:read
  RBAC-->>API: Allowed
  API->>Data: Read selected dataset
  API-->>Web: CSV attachment
  Web-->>HR: Browser downloads report
```
