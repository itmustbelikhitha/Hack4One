import { supabase } from '@/lib/supabase';
import { mapEmployee, mapAttendance, mapLeaveRequest, mapPayroll } from '@/lib/mappers';
import type {
  Employee, EmployeeRow,
  Attendance, AttendanceRow,
  LeaveRequest, LeaveRequestRow,
  Payroll, PayrollRow,
} from '@/types';

// ============================================================
// EMPLOYEE API
// ============================================================

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as EmployeeRow[]).map(mapEmployee);
}

export async function getEmployeeById(employeeId: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('employee_id', employeeId)
    .maybeSingle() as { data: EmployeeRow | null; error: any };
  if (error) throw error;
  return data ? mapEmployee(data) : null;
}

export async function getEmployeeByUserId(userId: string): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle() as { data: EmployeeRow | null; error: any };
  if (error) throw error;
  return data ? mapEmployee(data) : null;
}

export async function updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee> {
  const row: Record<string, any> = {};
  if (updates.fullName !== undefined) row.full_name = updates.fullName;
  if (updates.email !== undefined) row.email = updates.email;
  if (updates.phone !== undefined) row.phone = updates.phone;
  if (updates.address !== undefined) row.address = updates.address;
  if (updates.department !== undefined) row.department = updates.department;
  if (updates.designation !== undefined) row.designation = updates.designation;
  if (updates.joiningDate !== undefined) row.joining_date = updates.joiningDate;
  if (updates.profilePicture !== undefined) row.profile_picture = updates.profilePicture;

  const { data, error } = await supabase
    .from('employees')
    .update(row)
    .eq('employee_id', employeeId)
    .select('*')
    .maybeSingle() as { data: EmployeeRow | null; error: any };
  if (error) throw error;
  if (!data) throw new Error('Employee not found.');
  return mapEmployee(data);
}

export async function createEmployee(employee: Partial<Employee>): Promise<Employee> {
  const row: Record<string, any> = {
    user_id: employee.userId,
    full_name: employee.fullName,
    email: employee.email,
  };
  if (employee.phone !== undefined) row.phone = employee.phone;
  if (employee.address !== undefined) row.address = employee.address;
  if (employee.department !== undefined) row.department = employee.department;
  if (employee.designation !== undefined) row.designation = employee.designation;
  if (employee.joiningDate !== undefined) row.joining_date = employee.joiningDate;
  if (employee.profilePicture !== undefined) row.profile_picture = employee.profilePicture;

  const { data, error } = await supabase
    .from('employees')
    .insert(row)
    .select('*')
    .maybeSingle() as { data: EmployeeRow | null; error: any };
  if (error) throw error;
  if (!data) throw new Error('Failed to create employee.');
  return mapEmployee(data);
}

// ============================================================
// ATTENDANCE API
// ============================================================

export async function checkIn(employeeId: string): Promise<Attendance> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      employee_id: employeeId,
      attendance_date: today,
      check_in: new Date().toISOString(),
      status: 'Present',
    })
    .select('*')
    .maybeSingle() as { data: AttendanceRow | null; error: any };
  if (error) throw error;
  if (!data) throw new Error('Failed to record check-in.');
  return mapAttendance(data);
}

export async function checkOut(attendanceId: string): Promise<Attendance> {
  const { data, error } = await supabase
    .from('attendance')
    .update({ check_out: new Date().toISOString() })
    .eq('attendance_id', attendanceId)
    .select('*')
    .maybeSingle() as { data: AttendanceRow | null; error: any };
  if (error) throw error;
  if (!data) throw new Error('Failed to record check-out.');
  return mapAttendance(data);
}

export async function getAttendanceByEmployee(employeeId: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .order('attendance_date', { ascending: false });
  if (error) throw error;
  return (data as AttendanceRow[]).map(mapAttendance);
}

export async function getAllAttendance(): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .order('attendance_date', { ascending: false });
  if (error) throw error;
  return (data as AttendanceRow[]).map(mapAttendance);
}

export async function getTodayAttendance(employeeId: string): Promise<Attendance | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('attendance_date', today)
    .maybeSingle() as { data: AttendanceRow | null; error: any };
  if (error) throw error;
  return data ? mapAttendance(data) : null;
}

// ============================================================
// LEAVE API
// ============================================================

export async function createLeaveRequest(
  employeeId: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  remarks: string,
): Promise<LeaveRequest> {
  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      employee_id: employeeId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      remarks,
      status: 'Pending',
    })
    .select('*')
    .maybeSingle() as { data: LeaveRequestRow | null; error: any };
  if (error) throw error;
  if (!data) throw new Error('Failed to create leave request.');
  return mapLeaveRequest(data);
}

export async function getLeavesByEmployee(employeeId: string): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as LeaveRequestRow[]).map(mapLeaveRequest);
}

export async function getAllLeaves(): Promise<LeaveRequest[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as LeaveRequestRow[]).map(mapLeaveRequest);
}

export async function approveLeave(leaveId: string, adminComment: string): Promise<LeaveRequest> {
  const { data, error } = await supabase
    .from('leave_requests')
    .update({ status: 'Approved', admin_comment: adminComment })
    .eq('leave_id', leaveId)
    .select('*')
    .maybeSingle() as { data: LeaveRequestRow | null; error: any };
  if (error) throw error;
  if (!data) throw new Error('Leave request not found.');
  return mapLeaveRequest(data);
}

export async function rejectLeave(leaveId: string, adminComment: string): Promise<LeaveRequest> {
  const { data, error } = await supabase
    .from('leave_requests')
    .update({ status: 'Rejected', admin_comment: adminComment })
    .eq('leave_id', leaveId)
    .select('*')
    .maybeSingle() as { data: LeaveRequestRow | null; error: any };
  if (error) throw error;
  if (!data) throw new Error('Leave request not found.');
  return mapLeaveRequest(data);
}

// ============================================================
// PAYROLL API
// ============================================================

export async function getPayrollByEmployee(employeeId: string): Promise<Payroll[]> {
  const { data, error } = await supabase
    .from('payroll')
    .select('*')
    .eq('employee_id', employeeId)
    .order('effective_from', { ascending: false });
  if (error) throw error;
  return (data as PayrollRow[]).map(mapPayroll);
}

export async function getAllPayroll(): Promise<Payroll[]> {
  const { data, error } = await supabase
    .from('payroll')
    .select('*')
    .order('effective_from', { ascending: false });
  if (error) throw error;
  return (data as PayrollRow[]).map(mapPayroll);
}

export async function updatePayroll(
  employeeId: string,
  updates: { basicSalary?: number; allowances?: number; deductions?: number; effectiveFrom?: string },
): Promise<Payroll> {
  const row: Record<string, any> = {};
  if (updates.basicSalary !== undefined) row.basic_salary = updates.basicSalary;
  if (updates.allowances !== undefined) row.allowances = updates.allowances;
  if (updates.deductions !== undefined) row.deductions = updates.deductions;
  if (updates.effectiveFrom !== undefined) row.effective_from = updates.effectiveFrom;

  const { data: existing } = await supabase
    .from('payroll')
    .select('*')
    .eq('employee_id', employeeId)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle() as { data: PayrollRow | null; error: any };

  let result: PayrollRow | null = null;
  let error: any = null;

  if (existing) {
    const res = await supabase
      .from('payroll')
      .update(row)
      .eq('payroll_id', existing.payroll_id)
      .select('*')
      .maybeSingle() as { data: PayrollRow | null; error: any };
    result = res.data;
    error = res.error;
  } else {
    const res = await supabase
      .from('payroll')
      .insert({ ...row, employee_id: employeeId })
      .select('*')
      .maybeSingle() as { data: PayrollRow | null; error: any };
    result = res.data;
    error = res.error;
  }

  if (error) throw error;
  if (!result) throw new Error('Failed to update payroll.');
  return mapPayroll(result);
}
