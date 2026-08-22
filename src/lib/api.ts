import { supabase } from '@/lib/supabase';
import { mapEmployee, mapAttendance, mapLeaveRequest, mapPayroll } from '@/lib/mappers';
import type {
  Employee, EmployeeRow,
  Attendance, AttendanceRow,
  LeaveRequest, LeaveRequestRow,
  Payroll, PayrollRow,
} from '@/types';

// Helper for local dev data
function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

// Initial mock seed
function ensureSeedData() {
  if (!localStorage.getItem('dayflow_seeded')) {
    const emps: Employee[] = [
      {
        employeeId: 'emp-101',
        userId: 'usr-101',
        fullName: 'Jane Doe',
        email: 'employee@dayflow.com',
        phone: '+1 (555) 234-5678',
        address: '742 Evergreen Terrace, Springfield',
        department: 'Engineering',
        designation: 'Senior Frontend Engineer',
        joiningDate: '2024-01-15',
        profilePicture: null,
        createdAt: new Date().toISOString(),
      },
      {
        employeeId: 'emp-102',
        userId: 'usr-102',
        fullName: 'Admin User',
        email: 'admin@dayflow.com',
        phone: '+1 (555) 876-5432',
        address: '100 Enterprise Blvd, Metropolis',
        department: 'Management',
        designation: 'HR Director',
        joiningDate: '2023-05-01',
        profilePicture: null,
        createdAt: new Date().toISOString(),
      },
    ];
    setLocal('dayflow_employees', emps);

    const leaves: LeaveRequest[] = [
      {
        leaveId: 'lv-001',
        employeeId: 'emp-101',
        leaveType: 'Sick',
        startDate: '2026-08-10',
        endDate: '2026-08-12',
        remarks: 'Doctor appointment & recovery',
        status: 'Approved',
        adminComment: 'Get well soon!',
        createdAt: '2026-08-08T10:00:00Z',
      },
    ];
    setLocal('dayflow_leaves', leaves);

    const payrolls: Payroll[] = [
      {
        payrollId: 'pay-001',
        employeeId: 'emp-101',
        basicSalary: 6500,
        allowances: 1200,
        deductions: 450,
        netSalary: 7250,
        effectiveFrom: '2026-01-01',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        payrollId: 'pay-002',
        employeeId: 'emp-102',
        basicSalary: 8500,
        allowances: 1800,
        deductions: 600,
        netSalary: 9700,
        effectiveFrom: '2026-01-01',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    setLocal('dayflow_payroll', payrolls);

    localStorage.setItem('dayflow_seeded', 'true');
  }
}

ensureSeedData();

// ============================================================
// EMPLOYEE API
// ============================================================

export async function getEmployees(): Promise<Employee[]> {
  try {
    const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    if (!error && data) return (data as EmployeeRow[]).map(mapEmployee);
  } catch (e) {}
  return getLocal<Employee[]>('dayflow_employees', []);
}

export async function getEmployeeById(employeeId: string): Promise<Employee | null> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employeeId)
      .maybeSingle() as { data: EmployeeRow | null; error: any };
    if (!error && data) return mapEmployee(data);
  } catch (e) {}
  const emps = getLocal<Employee[]>('dayflow_employees', []);
  return emps.find((e) => e.employeeId === employeeId) || null;
}

export async function getEmployeeByUserId(userId: string): Promise<Employee | null> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() as { data: EmployeeRow | null; error: any };
    if (!error && data) return mapEmployee(data);
  } catch (e) {}
  const emps = getLocal<Employee[]>('dayflow_employees', []);
  let emp = emps.find((e) => e.userId === userId);
  if (!emp) {
    // Check current local user
    const localUserRaw = localStorage.getItem('dayflow_local_user');
    if (localUserRaw) {
      try {
        const u = JSON.parse(localUserRaw);
        if (u.userId === userId) {
          emp = {
            employeeId: u.employeeId || 'emp-' + Math.random().toString(36).substring(2, 9),
            userId: u.userId,
            fullName: u.name || 'Current User',
            email: u.email || '',
            phone: '+1 (555) 000-0000',
            address: '123 Main St',
            department: u.role === 'admin' ? 'Management' : 'Engineering',
            designation: u.role === 'admin' ? 'Administrator' : 'Software Engineer',
            joiningDate: new Date().toISOString().split('T')[0],
            profilePicture: null,
            createdAt: new Date().toISOString(),
          };
          emps.push(emp);
          setLocal('dayflow_employees', emps);
        }
      } catch (e) {}
    }
  }
  return emp || null;
}

export async function updateEmployee(employeeId: string, updates: Partial<Employee>): Promise<Employee> {
  try {
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
    if (!error && data) return mapEmployee(data);
  } catch (e) {}

  const emps = getLocal<Employee[]>('dayflow_employees', []);
  const idx = emps.findIndex((e) => e.employeeId === employeeId);
  if (idx === -1) {
    const newEmp: Employee = {
      employeeId,
      userId: updates.userId || 'usr-local',
      fullName: updates.fullName || 'User',
      email: updates.email || '',
      phone: updates.phone || null,
      address: updates.address || null,
      department: updates.department || 'Engineering',
      designation: updates.designation || 'Specialist',
      joiningDate: updates.joiningDate || new Date().toISOString().split('T')[0],
      profilePicture: updates.profilePicture || null,
      createdAt: new Date().toISOString(),
    };
    emps.push(newEmp);
    setLocal('dayflow_employees', emps);
    return newEmp;
  }
  emps[idx] = { ...emps[idx], ...updates };
  setLocal('dayflow_employees', emps);
  return emps[idx];
}

export async function createEmployee(employee: Partial<Employee>): Promise<Employee> {
  try {
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
    if (!error && data) return mapEmployee(data);
  } catch (e) {}

  const emps = getLocal<Employee[]>('dayflow_employees', []);
  const newEmp: Employee = {
    employeeId: employee.employeeId || 'emp-' + Math.random().toString(36).substring(2, 9),
    userId: employee.userId || 'usr-' + Math.random().toString(36).substring(2, 9),
    fullName: employee.fullName || 'New Employee',
    email: employee.email || '',
    phone: employee.phone || null,
    address: employee.address || null,
    department: employee.department || 'General',
    designation: employee.designation || 'Staff',
    joiningDate: employee.joiningDate || new Date().toISOString().split('T')[0],
    profilePicture: employee.profilePicture || null,
    createdAt: new Date().toISOString(),
  };
  emps.push(newEmp);
  setLocal('dayflow_employees', emps);
  return newEmp;
}

// ============================================================
// ATTENDANCE API
// ============================================================

export async function checkIn(employeeId: string): Promise<Attendance> {
  const today = new Date().toISOString().split('T')[0];
  try {
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
    if (!error && data) return mapAttendance(data);
  } catch (e) {}

  const atts = getLocal<Attendance[]>('dayflow_attendance', []);
  const newAtt: Attendance = {
    attendanceId: 'att-' + Math.random().toString(36).substring(2, 9),
    employeeId,
    attendanceDate: today,
    checkIn: new Date().toISOString(),
    checkOut: null,
    status: 'Present',
    createdAt: new Date().toISOString(),
  };
  atts.unshift(newAtt);
  setLocal('dayflow_attendance', atts);
  return newAtt;
}

export async function checkOut(attendanceId: string): Promise<Attendance> {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .update({ check_out: new Date().toISOString() })
      .eq('attendance_id', attendanceId)
      .select('*')
      .maybeSingle() as { data: AttendanceRow | null; error: any };
    if (!error && data) return mapAttendance(data);
  } catch (e) {}

  const atts = getLocal<Attendance[]>('dayflow_attendance', []);
  const idx = atts.findIndex((a) => a.attendanceId === attendanceId);
  if (idx !== -1) {
    atts[idx].checkOut = new Date().toISOString();
    setLocal('dayflow_attendance', atts);
    return atts[idx];
  }
  throw new Error('Attendance record not found.');
}

export async function getAttendanceByEmployee(employeeId: string): Promise<Attendance[]> {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .order('attendance_date', { ascending: false });
    if (!error && data) return (data as AttendanceRow[]).map(mapAttendance);
  } catch (e) {}

  const atts = getLocal<Attendance[]>('dayflow_attendance', []);
  return atts.filter((a) => a.employeeId === employeeId);
}

export async function getAllAttendance(): Promise<Attendance[]> {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('attendance_date', { ascending: false });
    if (!error && data) return (data as AttendanceRow[]).map(mapAttendance);
  } catch (e) {}

  return getLocal<Attendance[]>('dayflow_attendance', []);
}

export async function getTodayAttendance(employeeId: string): Promise<Attendance | null> {
  const today = new Date().toISOString().split('T')[0];
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('attendance_date', today)
      .maybeSingle() as { data: AttendanceRow | null; error: any };
    if (!error && data) return mapAttendance(data);
  } catch (e) {}

  const atts = getLocal<Attendance[]>('dayflow_attendance', []);
  return atts.find((a) => a.employeeId === employeeId && a.attendanceDate === today) || null;
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
  try {
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
    if (!error && data) return mapLeaveRequest(data);
  } catch (e) {}

  const leaves = getLocal<LeaveRequest[]>('dayflow_leaves', []);
  const newLeave: LeaveRequest = {
    leaveId: 'lv-' + Math.random().toString(36).substring(2, 9),
    employeeId,
    leaveType: leaveType as any,
    startDate,
    endDate,
    remarks,
    status: 'Pending',
    adminComment: null,
    createdAt: new Date().toISOString(),
  };
  leaves.unshift(newLeave);
  setLocal('dayflow_leaves', leaves);
  return newLeave;
}

export async function getLeavesByEmployee(employeeId: string): Promise<LeaveRequest[]> {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
    if (!error && data) return (data as LeaveRequestRow[]).map(mapLeaveRequest);
  } catch (e) {}

  const leaves = getLocal<LeaveRequest[]>('dayflow_leaves', []);
  return leaves.filter((l) => l.employeeId === employeeId);
}

export async function getAllLeaves(): Promise<LeaveRequest[]> {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return (data as LeaveRequestRow[]).map(mapLeaveRequest);
  } catch (e) {}

  return getLocal<LeaveRequest[]>('dayflow_leaves', []);
}

export async function approveLeave(leaveId: string, adminComment: string): Promise<LeaveRequest> {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({ status: 'Approved', admin_comment: adminComment })
      .eq('leave_id', leaveId)
      .select('*')
      .maybeSingle() as { data: LeaveRequestRow | null; error: any };
    if (!error && data) return mapLeaveRequest(data);
  } catch (e) {}

  const leaves = getLocal<LeaveRequest[]>('dayflow_leaves', []);
  const idx = leaves.findIndex((l) => l.leaveId === leaveId);
  if (idx !== -1) {
    leaves[idx].status = 'Approved';
    leaves[idx].adminComment = adminComment;
    setLocal('dayflow_leaves', leaves);
    return leaves[idx];
  }
  throw new Error('Leave request not found.');
}

export async function rejectLeave(leaveId: string, adminComment: string): Promise<LeaveRequest> {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({ status: 'Rejected', admin_comment: adminComment })
      .eq('leave_id', leaveId)
      .select('*')
      .maybeSingle() as { data: LeaveRequestRow | null; error: any };
    if (!error && data) return mapLeaveRequest(data);
  } catch (e) {}

  const leaves = getLocal<LeaveRequest[]>('dayflow_leaves', []);
  const idx = leaves.findIndex((l) => l.leaveId === leaveId);
  if (idx !== -1) {
    leaves[idx].status = 'Rejected';
    leaves[idx].adminComment = adminComment;
    setLocal('dayflow_leaves', leaves);
    return leaves[idx];
  }
  throw new Error('Leave request not found.');
}

// ============================================================
// PAYROLL API
// ============================================================

export async function getPayrollByEmployee(employeeId: string): Promise<Payroll[]> {
  try {
    const { data, error } = await supabase
      .from('payroll')
      .select('*')
      .eq('employee_id', employeeId)
      .order('effective_from', { ascending: false });
    if (!error && data) return (data as PayrollRow[]).map(mapPayroll);
  } catch (e) {}

  const payrolls = getLocal<Payroll[]>('dayflow_payroll', []);
  return payrolls.filter((p) => p.employeeId === employeeId);
}

export async function getAllPayroll(): Promise<Payroll[]> {
  try {
    const { data, error } = await supabase
      .from('payroll')
      .select('*')
      .order('effective_from', { ascending: false });
    if (!error && data) return (data as PayrollRow[]).map(mapPayroll);
  } catch (e) {}

  return getLocal<Payroll[]>('dayflow_payroll', []);
}

export async function updatePayroll(
  employeeId: string,
  updates: { basicSalary?: number; allowances?: number; deductions?: number; effectiveFrom?: string },
): Promise<Payroll> {
  const payrolls = getLocal<Payroll[]>('dayflow_payroll', []);
  const existingLocal = payrolls.find((p) => p.employeeId === employeeId);

  const basic = updates.basicSalary !== undefined ? Number(updates.basicSalary) : (existingLocal ? existingLocal.basicSalary : 0);
  const allow = updates.allowances !== undefined ? Number(updates.allowances) : (existingLocal ? existingLocal.allowances : 0);
  const deduct = updates.deductions !== undefined ? Number(updates.deductions) : (existingLocal ? existingLocal.deductions : 0);
  const net = basic + allow - deduct;

  try {
    const { data: existing } = await supabase
      .from('payroll')
      .select('*')
      .eq('employee_id', employeeId)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: PayrollRow | null; error: any };

    const row: Record<string, any> = {
      basic_salary: basic,
      allowances: allow,
      deductions: deduct,
      net_salary: net,
    };
    if (updates.effectiveFrom !== undefined) {
      row.effective_from = updates.effectiveFrom;
    } else if (!existing) {
      row.effective_from = new Date().toISOString().split('T')[0];
    }

    if (existing) {
      const res = await supabase
        .from('payroll')
        .update(row)
        .eq('payroll_id', existing.payroll_id)
        .select('*')
        .maybeSingle() as { data: PayrollRow | null; error: any };
      if (!res.error && res.data) return mapPayroll(res.data);
    } else {
      const res = await supabase
        .from('payroll')
        .insert({ ...row, employee_id: employeeId })
        .select('*')
        .maybeSingle() as { data: PayrollRow | null; error: any };
      if (!res.error && res.data) return mapPayroll(res.data);
    }
  } catch (e) {}

  const updatedPay: Payroll = {
    payrollId: existingLocal ? existingLocal.payrollId : 'pay-' + Math.random().toString(36).substring(2, 9),
    employeeId,
    basicSalary: basic,
    allowances: allow,
    deductions: deduct,
    netSalary: net,
    effectiveFrom: updates.effectiveFrom || (existingLocal ? existingLocal.effectiveFrom : new Date().toISOString().split('T')[0]),
    createdAt: new Date().toISOString(),
  };

  const idx = payrolls.findIndex((p) => p.employeeId === employeeId);
  if (idx !== -1) {
    payrolls[idx] = updatedPay;
  } else {
    payrolls.unshift(updatedPay);
  }
  setLocal('dayflow_payroll', payrolls);
  return updatedPay;
}
