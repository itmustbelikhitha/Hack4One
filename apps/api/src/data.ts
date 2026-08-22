import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

export type Role = "ADMIN" | "EMPLOYEE";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";

export const permissions: Record<Role, string[]> = {
  ADMIN: [
    "employee:read:any", "employee:create", "employee:update:any", "employee:delete",
    "attendance:read:any", "attendance:manage", "attendance:checkin", "attendance:checkout",
    "leave:read:any", "leave:create", "leave:approve", "leave:reject",
    "payroll:read:any", "payroll:update", "reports:read", "analytics:read",
    "audit:read", "notification:read:self", "documents:manage", "settings:manage"
  ],
  EMPLOYEE: [
    "profile:read:self", "profile:update:self-limited", "attendance:read:self",
    "attendance:checkin", "attendance:checkout", "leave:create", "leave:read:self",
    "payroll:read:self", "notification:read:self", "documents:read:self"
  ]
};

export const db: {
  users: Array<{ id: string; employeeId: string; email: string; passwordHash: string; role: Role; emailVerifiedAt: string | null; failedLoginCount: number }>;
  departments: Array<{ id: string; name: string }>;
  employees: Array<Record<string, any>>;
  attendance: Array<{ id: string; employeeId: string; date: string; checkInAt: string | null; checkOutAt: string | null; status: AttendanceStatus; totalWorkingHours: number; late: boolean; earlyDeparture: boolean; anomaly: boolean; notes: string }>;
  leaveTypes: Array<{ id: string; name: string; paid: boolean; annualAllowance: number }>;
  leaveBalances: Array<{ employeeId: string; leaveTypeId: string; allocated: number; used: number; pending: number }>;
  leaveRequests: Array<{ id: string; employeeId: string; leaveTypeId: string; type: string; startDate: string; endDate: string; days: number; remarks: string; status: LeaveStatus; approverNote: string; timeline: string[] }>;
  payroll: Array<{ id: string; employeeId: string; period: string; gross: number; deductions: number; net: number; status: string; items: Array<{ label: string; type: string; amount: number }> }>;
  documents: Array<Record<string, any>>;
  notifications: Array<{ id: string; userId: string; type: string; title: string; body: string; readAt: string | null; createdAt: string }>;
  sessions: Array<{ id: string; userId: string; refreshHash: string; expiresAt: string; revokedAt?: string }>;
  auditLogs: Array<{ id: string; userId?: string; action: string; entity: string; entityId?: string; ipAddress?: string; metadata: Record<string, unknown>; createdAt: string }>;
  resetTokens: Array<{ userId: string; tokenHash: string; expiresAt: string; usedAt?: string }>;
  verificationTokens: Array<{ userId: string; tokenHash: string; expiresAt: string; usedAt?: string }>;
} = {
  users: [
    {
      id: "u_admin",
      employeeId: "DF-0001",
      email: "hr@dayflow.test",
      passwordHash: bcrypt.hashSync("Dayflow@123", 10),
      role: "ADMIN" as Role,
      emailVerifiedAt: new Date().toISOString(),
      failedLoginCount: 0
    },
    {
      id: "u_maya",
      employeeId: "DF-0104",
      email: "maya@dayflow.test",
      passwordHash: bcrypt.hashSync("Dayflow@123", 10),
      role: "EMPLOYEE" as Role,
      emailVerifiedAt: new Date().toISOString(),
      failedLoginCount: 0
    }
  ],
  departments: [
    { id: "dep_people", name: "People Operations" },
    { id: "dep_eng", name: "Engineering" },
    { id: "dep_fin", name: "Finance" }
  ],
  employees: [
    {
      id: "emp_admin",
      userId: "u_admin",
      employeeCode: "DF-0001",
      fullName: "Avery Morgan",
      email: "hr@dayflow.test",
      phone: "+1 555 0100",
      address: "100 Market Street",
      jobTitle: "HR Officer",
      department: "People Operations",
      roleLabel: "Admin / HR Officer",
      joiningDate: "2023-01-10",
      employmentStatus: "ACTIVE",
      reportingManager: "Chief Operating Officer",
      baseSalary: 90000,
      allowances: 12000,
      deductions: 8000,
      netSalary: 94000,
      profilePictureUrl: "",
      completionPercent: 96
    },
    {
      id: "emp_maya",
      userId: "u_maya",
      employeeCode: "DF-0104",
      fullName: "Maya Chen",
      email: "maya@dayflow.test",
      phone: "+1 555 0138",
      address: "44 Pine Avenue",
      jobTitle: "Product Engineer",
      department: "Engineering",
      roleLabel: "Employee",
      joiningDate: "2024-04-15",
      employmentStatus: "ACTIVE",
      reportingManager: "Avery Morgan",
      baseSalary: 112000,
      allowances: 18000,
      deductions: 14000,
      netSalary: 116000,
      profilePictureUrl: "",
      completionPercent: 88
    },
    {
      id: "emp_omar",
      userId: "u_omar",
      employeeCode: "DF-0112",
      fullName: "Omar Reyes",
      email: "omar@dayflow.test",
      phone: "+1 555 0142",
      address: "12 Lake Road",
      jobTitle: "Payroll Analyst",
      department: "Finance",
      roleLabel: "Employee",
      joiningDate: "2022-09-01",
      employmentStatus: "ACTIVE",
      reportingManager: "Avery Morgan",
      baseSalary: 82000,
      allowances: 9000,
      deductions: 7000,
      netSalary: 84000,
      profilePictureUrl: "",
      completionPercent: 91
    }
  ],
  attendance: [
    { id: "att_1", employeeId: "emp_maya", date: today(), checkInAt: isoAt(9, 8), checkOutAt: null, status: "PRESENT" as AttendanceStatus, totalWorkingHours: 0, late: false, earlyDeparture: false, anomaly: false, notes: "" },
    { id: "att_2", employeeId: "emp_omar", date: today(), checkInAt: isoAt(9, 42), checkOutAt: null, status: "PRESENT" as AttendanceStatus, totalWorkingHours: 0, late: true, earlyDeparture: false, anomaly: false, notes: "Late arrival detected" }
  ],
  leaveTypes: [
    { id: "lt_paid", name: "Paid Leave", paid: true, annualAllowance: 18 },
    { id: "lt_sick", name: "Sick Leave", paid: true, annualAllowance: 10 },
    { id: "lt_unpaid", name: "Unpaid Leave", paid: false, annualAllowance: 0 }
  ],
  leaveBalances: [
    { employeeId: "emp_maya", leaveTypeId: "lt_paid", allocated: 18, used: 4, pending: 2 },
    { employeeId: "emp_maya", leaveTypeId: "lt_sick", allocated: 10, used: 1, pending: 0 }
  ],
  leaveRequests: [
    { id: "leave_1", employeeId: "emp_maya", leaveTypeId: "lt_paid", type: "Paid Leave", startDate: "2026-08-28", endDate: "2026-08-29", days: 2, remarks: "Family travel", status: "PENDING" as LeaveStatus, approverNote: "", timeline: ["Submitted by Maya Chen"] }
  ],
  payroll: [
    { id: "pay_1", employeeId: "emp_maya", period: "2026-08", gross: 130000, deductions: 14000, net: 116000, status: "GENERATED", items: [{ label: "Base salary", type: "earning", amount: 112000 }, { label: "Allowance", type: "earning", amount: 18000 }, { label: "Deductions", type: "deduction", amount: 14000 }] }
  ],
  documents: [
    { id: "doc_1", employeeId: "emp_maya", name: "Employment Agreement.pdf", category: "Employment", mimeType: "application/pdf", sizeBytes: 244000, storageKey: "demo/employment-agreement.pdf" }
  ],
  notifications: [
    { id: "n_1", userId: "u_maya", type: "LEAVE_SUBMITTED", title: "Leave request submitted", body: "Your paid leave request is waiting for HR approval.", readAt: null, createdAt: new Date().toISOString() },
    { id: "n_2", userId: "u_admin", type: "LEAVE_SUBMITTED", title: "Leave approval needed", body: "Maya Chen requested 2 days of paid leave.", readAt: null, createdAt: new Date().toISOString() }
  ],
  sessions: [] as Array<{ id: string; userId: string; refreshHash: string; expiresAt: string; revokedAt?: string }>,
  auditLogs: [
    { id: "audit_1", userId: "u_admin", action: "LOGIN", entity: "User", entityId: "u_admin", ipAddress: "seed", metadata: { success: true }, createdAt: new Date().toISOString() }
  ],
  resetTokens: [] as Array<{ userId: string; tokenHash: string; expiresAt: string; usedAt?: string }>,
  verificationTokens: [] as Array<{ userId: string; tokenHash: string; expiresAt: string; usedAt?: string }>
};

export function id(prefix: string) {
  return `${prefix}_${nanoid(10)}`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function isoAt(hour: number, minute: number) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function employeeForUser(userId: string) {
  return db.employees.find((employee) => employee.userId === userId);
}
