import type {
  AppUser, AppUserRow,
  Employee, EmployeeRow,
  Attendance, AttendanceRow,
  LeaveRequest, LeaveRequestRow,
  Payroll, PayrollRow,
} from '@/types';

export function mapUser(row: AppUserRow): AppUser {
  return {
    userId: row.user_id,
    employeeId: row.employee_id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function mapEmployee(row: EmployeeRow): Employee {
  return {
    employeeId: row.employee_id,
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    department: row.department,
    designation: row.designation,
    joiningDate: row.joining_date,
    profilePicture: row.profile_picture,
    createdAt: row.created_at,
  };
}

export function mapAttendance(row: AttendanceRow): Attendance {
  return {
    attendanceId: row.attendance_id,
    employeeId: row.employee_id,
    attendanceDate: row.attendance_date,
    checkIn: row.check_in,
    checkOut: row.check_out,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function mapLeaveRequest(row: LeaveRequestRow): LeaveRequest {
  return {
    leaveId: row.leave_id,
    employeeId: row.employee_id,
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    remarks: row.remarks,
    status: row.status,
    adminComment: row.admin_comment,
    createdAt: row.created_at,
  };
}

export function mapPayroll(row: PayrollRow): Payroll {
  return {
    payrollId: row.payroll_id,
    employeeId: row.employee_id,
    basicSalary: Number(row.basic_salary),
    allowances: Number(row.allowances),
    deductions: Number(row.deductions),
    netSalary: Number(row.net_salary),
    effectiveFrom: row.effective_from,
    createdAt: row.created_at,
  };
}
