# ER Diagram

This diagram follows the production-oriented Prisma model in `apps/api/prisma/schema.prisma`.

## Full Entity Relationship Diagram

```mermaid
erDiagram
  Role {
    string id PK
    RoleName name UK
  }

  Permission {
    string id PK
    string key UK
  }

  User {
    string id PK
    string employeeId UK
    string email UK
    string passwordHash
    datetime emailVerifiedAt
    datetime lockedUntil
    int failedLoginCount
    string mfaSecret
    string roleId FK
    datetime createdAt
    datetime updatedAt
    datetime deletedAt
  }

  Department {
    string id PK
    string name UK
    datetime createdAt
    datetime updatedAt
  }

  Employee {
    string id PK
    string userId UK
    string employeeCode UK
    string fullName
    string jobTitle
    string roleLabel
    datetime joiningDate
    EmploymentStatus employmentStatus
    string departmentId FK
    string reportingManagerId FK
    datetime createdAt
    datetime updatedAt
    datetime deletedAt
  }

  EmployeeProfile {
    string id PK
    string employeeId UK
    string phone
    string address
    string profilePictureUrl
    int completionPercent
    datetime createdAt
    datetime updatedAt
  }

  Attendance {
    string id PK
    string employeeId FK
    datetime date
    datetime checkInAt
    datetime checkOutAt
    AttendanceStatus status
    decimal totalWorkingHours
    boolean late
    boolean earlyDeparture
    boolean anomaly
    string notes
    datetime createdAt
    datetime updatedAt
  }

  AttendanceAudit {
    string id PK
    string attendanceId FK
    string changedById
    json before
    json after
    datetime createdAt
  }

  LeaveType {
    string id PK
    string name UK
    boolean paid
    int annualAllowance
  }

  LeaveRequest {
    string id PK
    string employeeId FK
    string leaveTypeId FK
    datetime startDate
    datetime endDate
    int days
    string remarks
    LeaveStatus status
    string approverId
    string approverNote
    datetime decidedAt
    datetime createdAt
    datetime updatedAt
  }

  LeaveBalance {
    string id PK
    string employeeId FK
    string leaveTypeId FK
    int year
    int allocated
    int used
    int pending
  }

  SalaryStructure {
    string id PK
    string employeeId FK
    decimal baseSalary
    decimal allowances
    decimal deductions
    decimal netSalary
    datetime effectiveFrom
    boolean active
  }

  SalaryComponent {
    string id PK
    string salaryStructureId FK
    string name
    string type
    decimal amount
  }

  SalaryRevision {
    string id PK
    string salaryStructureId FK
    decimal previousNet
    decimal revisedNet
    string reason
    datetime createdAt
  }

  Payroll {
    string id PK
    string employeeId FK
    string period
    decimal gross
    decimal deductions
    decimal net
    PayrollStatus status
    datetime createdAt
  }

  PayrollItem {
    string id PK
    string payrollId FK
    string label
    string type
    decimal amount
  }

  SalarySlip {
    string id PK
    string payrollId UK
    string pdfUrl
    datetime createdAt
  }

  Document {
    string id PK
    string employeeId FK
    string name
    string category
    string mimeType
    int sizeBytes
    string storageKey
    datetime createdAt
    datetime deletedAt
  }

  Notification {
    string id PK
    string userId FK
    string type
    string title
    string body
    datetime readAt
    datetime createdAt
  }

  NotificationPreference {
    string id PK
    string userId UK
    boolean inApp
    boolean email
    boolean push
  }

  AuditLog {
    string id PK
    string userId FK
    string action
    string entity
    string entityId
    string ipAddress
    json metadata
    datetime createdAt
  }

  Session {
    string id PK
    string userId FK
    string refreshHash
    string userAgent
    string ipAddress
    datetime expiresAt
    datetime revokedAt
    datetime createdAt
  }

  LoginActivity {
    string id PK
    string userId FK
    string email
    boolean success
    string ipAddress
    string reason
    datetime createdAt
  }

  VerificationToken {
    string id PK
    string userId
    string tokenHash UK
    datetime expiresAt
    datetime usedAt
  }

  PasswordResetToken {
    string id PK
    string userId
    string tokenHash UK
    datetime expiresAt
    datetime usedAt
  }

  OrganizationSetting {
    string id PK
    string key UK
    json value
    datetime updatedAt
  }

  Role ||--o{ User : assigned_to
  Role }o--o{ Permission : grants
  User ||--|| Employee : owns
  User ||--o{ Session : opens
  User ||--o{ Notification : receives
  User ||--o{ AuditLog : creates
  User ||--o{ LoginActivity : attempts
  Department ||--o{ Employee : contains
  Employee ||--o{ Employee : manages
  Employee ||--|| EmployeeProfile : has
  Employee ||--o{ Attendance : records
  Attendance ||--o{ AttendanceAudit : audited_by
  Employee ||--o{ LeaveRequest : submits
  LeaveType ||--o{ LeaveRequest : categorizes
  Employee ||--o{ LeaveBalance : owns
  LeaveType ||--o{ LeaveBalance : allocates
  Employee ||--o{ SalaryStructure : has
  SalaryStructure ||--o{ SalaryComponent : contains
  SalaryStructure ||--o{ SalaryRevision : revises
  Employee ||--o{ Payroll : receives
  Payroll ||--o{ PayrollItem : contains
  Payroll ||--|| SalarySlip : generates
  Employee ||--o{ Document : owns
```

## Relationship Notes

| Relationship | Type | Purpose |
|---|---|---|
| `Role -> User` | One-to-many | A user receives one system role. |
| `Role <-> Permission` | Many-to-many | Roles grant route-level capabilities. |
| `User -> Employee` | One-to-one | Login identity connects to HR profile. |
| `Department -> Employee` | One-to-many | Employees are grouped by department. |
| `Employee -> Employee` | Self relation | Reporting manager hierarchy. |
| `Employee -> Attendance` | One-to-many | One attendance record per employee/date. |
| `Attendance -> AttendanceAudit` | One-to-many | HR corrections preserve before/after state. |
| `Employee -> LeaveRequest` | One-to-many | Employees submit leave requests. |
| `LeaveType -> LeaveRequest` | One-to-many | Requests are categorized by leave policy. |
| `Employee -> LeaveBalance` | One-to-many | Balances are tracked per leave type and year. |
| `Employee -> SalaryStructure` | One-to-many | Salary history and revisions. |
| `Employee -> Payroll` | One-to-many | Payroll records per period. |
| `Payroll -> SalarySlip` | One-to-one | Generated slip for a payroll period. |
| `Employee -> Document` | One-to-many | Employee document metadata and storage keys. |
| `User -> AuditLog` | One-to-many | Security-sensitive actions are traceable. |

## Important Constraints

```prisma
model Attendance {
  employeeId String
  date       DateTime

  @@unique([employeeId, date])
  @@index([date, status])
}
```

```prisma
model LeaveBalance {
  employeeId  String
  leaveTypeId String
  year        Int

  @@unique([employeeId, leaveTypeId, year])
}
```

```prisma
model Payroll {
  employeeId String
  period     String

  @@unique([employeeId, period])
}
```
