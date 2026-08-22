import { db, employeeForUser, id, isoAt, today, type LeaveStatus } from "./data.js";

export function audit(userId: string | undefined, action: string, entity: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  db.auditLogs.unshift({ id: id("audit"), userId, action, entity, entityId, ipAddress: "request", metadata, createdAt: new Date().toISOString() });
}

export function notify(userId: string, type: string, title: string, body: string) {
  db.notifications.unshift({ id: id("n"), userId, type, title, body, readAt: null, createdAt: new Date().toISOString() });
}

export function submitLeave(userId: string, input: { leaveTypeId: string; startDate: string; endDate: string; remarks?: string }) {
  const employee = employeeForUser(userId);
  if (!employee) throw new Error("Employee profile not found.");
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end < start) throw new Error("Leave dates are invalid.");
  const overlap = db.leaveRequests.some((leave) => leave.employeeId === employee.id && leave.status !== "REJECTED" && input.startDate <= leave.endDate && input.endDate >= leave.startDate);
  if (overlap) throw new Error("Leave request overlaps an existing request.");
  const days = businessDays(start, end);
  const leaveType = db.leaveTypes.find((type) => type.id === input.leaveTypeId);
  if (!leaveType) throw new Error("Leave type not found.");
  const balance = db.leaveBalances.find((item) => item.employeeId === employee.id && item.leaveTypeId === input.leaveTypeId);
  if (leaveType.paid && balance && balance.allocated - balance.used - balance.pending < days) throw new Error("Insufficient leave balance.");
  if (balance) balance.pending += days;
  const leave = { id: id("leave"), employeeId: employee.id, leaveTypeId: leaveType.id, type: leaveType.name, startDate: input.startDate, endDate: input.endDate, days, remarks: input.remarks || "", status: "PENDING" as LeaveStatus, approverNote: "", timeline: [`Submitted by ${employee.fullName}`] };
  db.leaveRequests.unshift(leave);
  db.users.filter((user) => user.role === "ADMIN").forEach((admin) => notify(admin.id, "LEAVE_SUBMITTED", "Leave approval needed", `${employee.fullName} requested ${days} day(s) of ${leaveType.name}.`));
  audit(userId, "LEAVE_SUBMITTED", "LeaveRequest", leave.id, { days, leaveType: leaveType.name });
  return leave;
}

export function decideLeave(userId: string, leaveId: string, status: "APPROVED" | "REJECTED", approverNote = "") {
  const leave = db.leaveRequests.find((item) => item.id === leaveId);
  if (!leave) throw new Error("Leave request not found.");
  if (leave.status !== "PENDING") throw new Error("Only pending requests can be approved or rejected.");
  leave.status = status;
  leave.approverNote = approverNote;
  leave.timeline.push(`${status === "APPROVED" ? "Approved" : "Rejected"} by HR`);
  const employee = db.employees.find((item) => item.id === leave.employeeId);
  if (!employee) throw new Error("Employee not found.");
  const balance = db.leaveBalances.find((item) => item.employeeId === leave.employeeId && item.leaveTypeId === leave.leaveTypeId);
  if (balance) {
    balance.pending = Math.max(0, balance.pending - leave.days);
    if (status === "APPROVED") balance.used += leave.days;
  }
  if (status === "APPROVED") {
    db.attendance.push({ id: id("att"), employeeId: leave.employeeId, date: leave.startDate, checkInAt: null, checkOutAt: null, status: "LEAVE", totalWorkingHours: 0, late: false, earlyDeparture: false, anomaly: false, notes: `Leave: ${leave.type}` });
  }
  const user = db.users.find((item) => item.id === employee.userId);
  if (user) notify(user.id, status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED", `Leave ${status.toLowerCase()}`, approverNote || `Your ${leave.type} request was ${status.toLowerCase()}.`);
  audit(userId, status === "APPROVED" ? "LEAVE_APPROVAL" : "LEAVE_REJECTION", "LeaveRequest", leave.id, { approverNote });
  return leave;
}

export function checkIn(userId: string) {
  const employee = employeeForUser(userId);
  if (!employee) throw new Error("Employee profile not found.");
  const existing = db.attendance.find((item) => item.employeeId === employee.id && item.date === today());
  if (existing?.checkInAt) return existing;
  const checkInAt = new Date();
  const record = existing || { id: id("att"), employeeId: employee.id, date: today(), checkInAt: null, checkOutAt: null, status: "PRESENT" as const, totalWorkingHours: 0, late: false, earlyDeparture: false, anomaly: false, notes: "" };
  record.checkInAt = checkInAt.toISOString();
  record.status = "PRESENT";
  record.late = checkInAt.getHours() > 9 || (checkInAt.getHours() === 9 && checkInAt.getMinutes() > 30);
  if (!existing) db.attendance.unshift(record);
  audit(userId, "ATTENDANCE_CHECK_IN", "Attendance", record.id);
  return record;
}

export function checkOut(userId: string) {
  const employee = employeeForUser(userId);
  if (!employee) throw new Error("Employee profile not found.");
  const record = db.attendance.find((item) => item.employeeId === employee.id && item.date === today());
  if (!record || !record.checkInAt) throw new Error("Check in before checking out.");
  record.checkOutAt = new Date().toISOString();
  record.totalWorkingHours = Number(((new Date(record.checkOutAt).valueOf() - new Date(record.checkInAt).valueOf()) / 3600000).toFixed(2));
  record.earlyDeparture = new Date(record.checkOutAt).getHours() < 17;
  record.anomaly = record.totalWorkingHours < 4;
  audit(userId, "ATTENDANCE_CHECK_OUT", "Attendance", record.id, { totalWorkingHours: record.totalWorkingHours });
  return record;
}

export function updateSalary(userId: string, employeeId: string, input: { baseSalary: number; allowances: number; deductions: number; reason?: string }) {
  if (input.baseSalary < 0 || input.allowances < 0 || input.deductions < 0) throw new Error("Salary values cannot be negative.");
  const netSalary = input.baseSalary + input.allowances - input.deductions;
  if (netSalary < 0) throw new Error("Net salary cannot be negative.");
  const employee = db.employees.find((item) => item.id === employeeId);
  if (!employee) throw new Error("Employee not found.");
  const previousNet = employee.netSalary;
  Object.assign(employee, { ...input, netSalary });
  db.payroll.unshift({ id: id("pay"), employeeId, period: new Date().toISOString().slice(0, 7), gross: input.baseSalary + input.allowances, deductions: input.deductions, net: netSalary, status: "GENERATED", items: [{ label: "Base salary", type: "earning", amount: input.baseSalary }, { label: "Allowances", type: "earning", amount: input.allowances }, { label: "Deductions", type: "deduction", amount: input.deductions }] });
  const user = db.users.find((item) => item.id === employee.userId);
  if (user) notify(user.id, "PAYROLL_UPDATED", "Salary structure updated", "Your current salary structure has been updated by HR.");
  audit(userId, "PAYROLL_UPDATE", "Employee", employeeId, { previousNet, revisedNet: netSalary, reason: input.reason });
  return employee;
}

export function dashboardFor(userId: string) {
  const employee = employeeForUser(userId);
  if (!employee) throw new Error("Employee profile not found.");
  const ownAttendance = db.attendance.filter((item) => item.employeeId === employee.id);
  return {
    profile: employee,
    metrics: {
      todayStatus: ownAttendance.find((item) => item.date === today())?.status || "ABSENT",
      attendancePercentage: attendancePercentage(employee.id),
      leaveBalance: db.leaveBalances.filter((item) => item.employeeId === employee.id).reduce((sum, item) => sum + item.allocated - item.used - item.pending, 0),
      pendingLeaveRequests: db.leaveRequests.filter((item) => item.employeeId === employee.id && item.status === "PENDING").length,
      currentSalary: employee.netSalary,
      lastPayroll: db.payroll.find((item) => item.employeeId === employee.id)
    },
    recentActivity: db.auditLogs.filter((log) => log.userId === userId).slice(0, 10),
    alerts: db.notifications.filter((item) => item.userId === userId && !item.readAt).slice(0, 5),
    charts: {
      attendance: lastSevenDays().map((date) => ({ date, present: db.attendance.some((item) => item.employeeId === employee.id && item.date === date && item.status === "PRESENT") ? 1 : 0 })),
      leave: db.leaveBalances.filter((item) => item.employeeId === employee.id)
    }
  };
}

export function adminDashboard() {
  const todayRecords = db.attendance.filter((item) => item.date === today());
  return {
    metrics: {
      totalEmployees: db.employees.length,
      presentToday: todayRecords.filter((item) => item.status === "PRESENT").length,
      absentToday: Math.max(0, db.employees.length - todayRecords.length),
      employeesOnLeave: todayRecords.filter((item) => item.status === "LEAVE").length,
      pendingLeaveApprovals: db.leaveRequests.filter((item) => item.status === "PENDING").length,
      attendancePercentage: Math.round((todayRecords.length / Math.max(1, db.employees.length)) * 100),
      payrollTotal: db.payroll.reduce((sum, item) => sum + item.net, 0)
    },
    employees: db.employees,
    recentActivity: db.auditLogs.slice(0, 12),
    charts: analytics()
  };
}

export function analytics() {
  return {
    attendanceTrend: lastSevenDays().map((date) => ({ date, present: db.attendance.filter((item) => item.date === date && item.status === "PRESENT").length })),
    leaveDistribution: db.leaveTypes.map((type) => ({ name: type.name, value: db.leaveRequests.filter((leave) => leave.leaveTypeId === type.id).length })),
    departmentDistribution: db.departments.map((department) => ({ name: department.name, value: db.employees.filter((employee) => employee.department === department.name).length })),
    payrollTrend: db.payroll.map((pay) => ({ period: pay.period, net: pay.net })),
    headcount: db.employees.length
  };
}

export function attendancePercentage(employeeId: string) {
  const records = db.attendance.filter((item) => item.employeeId === employeeId);
  if (!records.length) return 0;
  return Math.round((records.filter((item) => item.status === "PRESENT").length / records.length) * 100);
}

function businessDays(start: Date, end: Date) {
  let days = 0;
  const current = new Date(start);
  while (current <= end) {
    if (![0, 6].includes(current.getDay())) days += 1;
    current.setDate(current.getDate() + 1);
  }
  return Math.max(1, days);
}

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
}
