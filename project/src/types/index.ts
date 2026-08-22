// Dayflow HRMS — Shared Type Definitions
// Database uses snake_case; frontend uses camelCase.
// These types represent the frontend (camelCase) shape after mapping.

export type UserRole = 'employee' | 'admin';

export interface AppUser {
  userId: string;
  employeeId: string | null;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Employee {
  employeeId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  department: string | null;
  designation: string | null;
  joiningDate: string | null;
  profilePicture: string | null;
  createdAt: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Half-day' | 'Leave';

export interface Attendance {
  attendanceId: string;
  employeeId: string;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  createdAt: string;
}

export type LeaveType = 'Paid' | 'Sick' | 'Unpaid';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  leaveId: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  remarks: string | null;
  status: LeaveStatus;
  adminComment: string | null;
  createdAt: string;
}

export interface Payroll {
  payrollId: string;
  employeeId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  effectiveFrom: string;
  createdAt: string;
}

// Raw database row shapes (snake_case) for mapping
export interface AppUserRow {
  user_id: string;
  employee_id: string | null;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface EmployeeRow {
  employee_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  department: string | null;
  designation: string | null;
  joining_date: string | null;
  profile_picture: string | null;
  created_at: string;
}

export interface AttendanceRow {
  attendance_id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  created_at: string;
}

export interface LeaveRequestRow {
  leave_id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  remarks: string | null;
  status: LeaveStatus;
  admin_comment: string | null;
  created_at: string;
}

export interface PayrollRow {
  payroll_id: string;
  employee_id: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  effective_from: string;
  created_at: string;
}
