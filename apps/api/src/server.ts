import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { adminDashboard, analytics, audit, checkIn, checkOut, dashboardFor, decideLeave, submitLeave, updateSalary } from "./business.js";
import { canReadEmployee, authenticate, requirePermission, signAccessToken, type AuthedRequest } from "./security.js";
import { db, employeeForUser, id, permissions, type Role } from "./data.js";

export const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));
app.use(rateLimit({ windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000), limit: Number(process.env.RATE_LIMIT_MAX || 100) }));

const api = express.Router();

const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/);

api.get("/health", (_req, res) => res.json({ status: "ok", service: "dayflow-api", timestamp: new Date().toISOString() }));

api.post("/auth/signup", async (req, res, next) => {
  try {
    const body = z.object({ employeeId: z.string().min(3), email: z.string().email(), password: passwordSchema, role: z.enum(["ADMIN", "EMPLOYEE"]) }).parse(req.body);
    if (db.users.some((user) => user.email === body.email)) return res.status(409).json({ error: { code: "EMAIL_EXISTS", message: "An account with this email already exists." } });
    if (db.users.some((user) => user.employeeId === body.employeeId)) return res.status(409).json({ error: { code: "EMPLOYEE_ID_EXISTS", message: "An account with this employee ID already exists." } });
    const user = { id: id("u"), employeeId: body.employeeId, email: body.email, passwordHash: await bcrypt.hash(body.password, 10), role: body.role as Role, emailVerifiedAt: null, failedLoginCount: 0 };
    db.users.push(user);
    db.employees.push({ id: id("emp"), userId: user.id, employeeCode: body.employeeId, fullName: "New Employee", email: body.email, phone: "", address: "", jobTitle: "Pending onboarding", department: "People Operations", roleLabel: body.role === "ADMIN" ? "Admin / HR Officer" : "Employee", joiningDate: new Date().toISOString().slice(0, 10), employmentStatus: "ONBOARDING", reportingManager: "", baseSalary: 0, allowances: 0, deductions: 0, netSalary: 0, profilePictureUrl: "", completionPercent: 35 });
    db.verificationTokens.push({ userId: user.id, tokenHash: id("verify"), expiresAt: new Date(Date.now() + 86400000).toISOString() });
    audit(user.id, "EMPLOYEE_CREATION", "User", user.id);
    res.status(201).json({ message: "Account created. Verification email queued.", user: publicUser(user) });
  } catch (error) { next(error); }
});

api.post("/auth/login", async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email(), password: z.string(), remember: z.boolean().optional() }).parse(req.body);
    const user = db.users.find((item) => item.email === body.email);
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      if (user) user.failedLoginCount += 1;
      audit(user?.id, "FAILED_LOGIN", "User", user?.id, { email: body.email });
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." } });
    }
    user.failedLoginCount = 0;
    const employee = employeeForUser(user.id);
    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role, employeeId: employee?.id || "" });
    const refreshToken = id("refresh");
    db.sessions.push({ id: id("session"), userId: user.id, refreshHash: await bcrypt.hash(refreshToken, 10), expiresAt: new Date(Date.now() + (body.remember ? 30 : 7) * 86400000).toISOString() });
    res.cookie("dayflow_refresh", refreshToken, { httpOnly: true, sameSite: "lax", secure: process.env.COOKIE_SECURE === "true" });
    audit(user.id, "LOGIN", "User", user.id);
    res.json({ accessToken, user: publicUser(user), permissions: permissions[user.role], employee });
  } catch (error) { next(error); }
});

api.post("/auth/logout", authenticate, (req: AuthedRequest, res) => {
  db.sessions.filter((session) => session.userId === req.user?.id && !session.revokedAt).forEach((session) => session.revokedAt = new Date().toISOString());
  audit(req.user?.id, "LOGOUT", "Session");
  res.clearCookie("dayflow_refresh").json({ message: "Logged out." });
});

api.post("/auth/logout-all", authenticate, (req: AuthedRequest, res) => {
  db.sessions.filter((session) => session.userId === req.user?.id).forEach((session) => session.revokedAt = new Date().toISOString());
  audit(req.user?.id, "LOGOUT_ALL", "Session");
  res.json({ message: "All sessions revoked." });
});

api.post("/auth/forgot-password", (req, res) => {
  const email = z.object({ email: z.string().email() }).parse(req.body).email;
  const user = db.users.find((item) => item.email === email);
  if (user) db.resetTokens.push({ userId: user.id, tokenHash: id("reset"), expiresAt: new Date(Date.now() + 3600000).toISOString() });
  res.json({ message: "If the email exists, a reset link has been queued." });
});

api.post("/auth/reset-password", async (req, res) => {
  const body = z.object({ token: z.string(), password: passwordSchema }).parse(req.body);
  const token = db.resetTokens.find((item) => item.tokenHash === body.token && !item.usedAt);
  if (!token) return res.status(400).json({ error: { code: "TOKEN_INVALID", message: "Password reset token is invalid or expired." } });
  const user = db.users.find((item) => item.id === token.userId);
  if (user) user.passwordHash = await bcrypt.hash(body.password, 10);
  token.usedAt = new Date().toISOString();
  audit(user?.id, "PASSWORD_CHANGE", "User", user?.id);
  res.json({ message: "Password reset complete." });
});

api.use(authenticate);

api.get("/me", (req: AuthedRequest, res) => {
  const user = db.users.find((item) => item.id === req.user?.id);
  res.json({ user: user && publicUser(user), employee: employeeForUser(req.user!.id), permissions: permissions[req.user!.role] });
});

api.get("/dashboard/me", requirePermission("profile:read:self"), (req: AuthedRequest, res, next) => {
  try { res.json(dashboardFor(req.user!.id)); } catch (error) { next(error); }
});

api.get("/dashboard/admin", requirePermission("analytics:read"), (_req, res) => res.json(adminDashboard()));

api.get("/employees", requirePermission("employee:read:any"), (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const department = String(req.query.department || "");
  let employees = db.employees.filter((employee) => [employee.fullName, employee.employeeCode, employee.email, employee.department].join(" ").toLowerCase().includes(q));
  if (department) employees = employees.filter((employee) => employee.department === department);
  res.json(paginate(employees, req.query.page, req.query.pageSize));
});

api.post("/employees", requirePermission("employee:create"), async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({ employeeCode: z.string(), fullName: z.string(), email: z.string().email(), department: z.string(), jobTitle: z.string(), role: z.enum(["ADMIN", "EMPLOYEE"]).default("EMPLOYEE") }).parse(req.body);
    if (db.users.some((user) => user.email === body.email || user.employeeId === body.employeeCode)) return res.status(409).json({ error: { code: "DUPLICATE_EMPLOYEE", message: "Email or employee ID already exists." } });
    const user = { id: id("u"), employeeId: body.employeeCode, email: body.email, passwordHash: await bcrypt.hash("Dayflow@123", 10), role: body.role, emailVerifiedAt: null, failedLoginCount: 0 };
    db.users.push(user);
    const employee = { id: id("emp"), userId: user.id, employeeCode: body.employeeCode, fullName: body.fullName, email: body.email, phone: "", address: "", jobTitle: body.jobTitle, department: body.department, roleLabel: body.role, joiningDate: new Date().toISOString().slice(0, 10), employmentStatus: "ONBOARDING", reportingManager: "", baseSalary: 0, allowances: 0, deductions: 0, netSalary: 0, profilePictureUrl: "", completionPercent: 40 };
    db.employees.push(employee);
    audit(req.user?.id, "EMPLOYEE_CREATION", "Employee", employee.id);
    res.status(201).json(employee);
  } catch (error) { next(error); }
});

api.get("/employees/:id", (req: AuthedRequest, res) => {
  if (!canReadEmployee(req, req.params.id)) return res.status(403).json({ error: { code: "FORBIDDEN", message: "You cannot access another employee's private data." } });
  const employee = db.employees.find((item) => item.id === req.params.id);
  if (!employee) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Employee not found." } });
  res.json(employee);
});

api.patch("/employees/:id", (req: AuthedRequest, res) => {
  const employee = db.employees.find((item) => item.id === req.params.id);
  if (!employee) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Employee not found." } });
  const isAdmin = req.user?.role === "ADMIN";
  if (!isAdmin && req.user?.employeeId !== employee.id) return res.status(403).json({ error: { code: "FORBIDDEN", message: "You can update only your own allowed fields." } });
  const allowed = isAdmin ? ["fullName", "phone", "address", "jobTitle", "department", "employmentStatus", "reportingManager", "profilePictureUrl"] : ["phone", "address", "profilePictureUrl"];
  for (const key of allowed) if (key in req.body) (employee as Record<string, unknown>)[key] = req.body[key];
  employee.completionPercent = Math.min(100, employee.completionPercent + 2);
  audit(req.user?.id, "EMPLOYEE_UPDATE", "Employee", employee.id, { fields: Object.keys(req.body) });
  res.json(employee);
});

api.get("/attendance", (req: AuthedRequest, res) => {
  let rows = req.user?.role === "ADMIN" ? db.attendance : db.attendance.filter((item) => item.employeeId === req.user?.employeeId);
  if (req.query.status) rows = rows.filter((item) => item.status === req.query.status);
  if (req.query.employeeId && req.user?.role === "ADMIN") rows = rows.filter((item) => item.employeeId === req.query.employeeId);
  res.json(paginate(rows, req.query.page, req.query.pageSize));
});

api.post("/attendance/check-in", requirePermission("attendance:checkin"), (req: AuthedRequest, res, next) => {
  try { res.json(checkIn(req.user!.id)); } catch (error) { next(error); }
});

api.post("/attendance/check-out", requirePermission("attendance:checkout"), (req: AuthedRequest, res, next) => {
  try { res.json(checkOut(req.user!.id)); } catch (error) { next(error); }
});

api.patch("/attendance/:id", requirePermission("attendance:manage"), (req: AuthedRequest, res) => {
  const record = db.attendance.find((item) => item.id === req.params.id);
  if (!record) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Attendance record not found." } });
  Object.assign(record, req.body);
  audit(req.user?.id, "ATTENDANCE_MODIFICATION", "Attendance", record.id, { after: req.body });
  res.json(record);
});

api.get("/leaves", (req: AuthedRequest, res) => {
  let rows = req.user?.role === "ADMIN" ? db.leaveRequests : db.leaveRequests.filter((item) => item.employeeId === req.user?.employeeId);
  if (req.query.status) rows = rows.filter((item) => item.status === req.query.status);
  res.json({ data: rows, leaveTypes: db.leaveTypes, balances: db.leaveBalances.filter((item) => req.user?.role === "ADMIN" || item.employeeId === req.user?.employeeId) });
});

api.post("/leaves", requirePermission("leave:create"), (req: AuthedRequest, res, next) => {
  try { res.status(201).json(submitLeave(req.user!.id, req.body)); } catch (error) { next(error); }
});

api.post("/leaves/:id/approve", requirePermission("leave:approve"), (req: AuthedRequest, res, next) => {
  try { res.json(decideLeave(req.user!.id, req.params.id, "APPROVED", req.body.comment)); } catch (error) { next(error); }
});

api.post("/leaves/:id/reject", requirePermission("leave:reject"), (req: AuthedRequest, res, next) => {
  try { res.json(decideLeave(req.user!.id, req.params.id, "REJECTED", req.body.comment)); } catch (error) { next(error); }
});

api.get("/payroll", (req: AuthedRequest, res) => {
  const rows = req.user?.role === "ADMIN" ? db.payroll : db.payroll.filter((item) => item.employeeId === req.user?.employeeId);
  res.json({ data: rows });
});

api.patch("/payroll/structures/:employeeId", requirePermission("payroll:update"), (req: AuthedRequest, res, next) => {
  try { res.json(updateSalary(req.user!.id, req.params.employeeId, req.body)); } catch (error) { next(error); }
});

api.get("/payroll/:id/slip", (req: AuthedRequest, res) => {
  const payroll = db.payroll.find((item) => item.id === req.params.id);
  if (!payroll || (req.user?.role !== "ADMIN" && payroll.employeeId !== req.user?.employeeId)) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Salary slip not found." } });
  res.type("application/pdf").send(Buffer.from(`DAYFLOW salary slip\nPeriod: ${payroll.period}\nNet: ${payroll.net}`));
});

api.get("/notifications", (req: AuthedRequest, res) => res.json({ data: db.notifications.filter((item) => item.userId === req.user?.id), unread: db.notifications.filter((item) => item.userId === req.user?.id && !item.readAt).length }));
api.patch("/notifications/:id/read", (req: AuthedRequest, res) => {
  const note = db.notifications.find((item) => item.id === req.params.id && item.userId === req.user?.id);
  if (!note) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Notification not found." } });
  note.readAt = new Date().toISOString();
  res.json(note);
});
api.patch("/notifications/read-all", (req: AuthedRequest, res) => {
  db.notifications.filter((item) => item.userId === req.user?.id).forEach((item) => item.readAt = new Date().toISOString());
  res.json({ message: "All notifications marked as read." });
});

api.get("/documents", (req: AuthedRequest, res) => res.json({ data: db.documents.filter((item) => req.user?.role === "ADMIN" || item.employeeId === req.user?.employeeId) }));
api.post("/documents", (req: AuthedRequest, res) => {
  const body = z.object({ employeeId: z.string(), name: z.string(), category: z.string(), mimeType: z.string(), sizeBytes: z.number().max(10 * 1024 * 1024) }).parse(req.body);
  if (req.user?.role !== "ADMIN" && body.employeeId !== req.user?.employeeId) return res.status(403).json({ error: { code: "FORBIDDEN", message: "Document access denied." } });
  if (!["application/pdf", "image/png", "image/jpeg"].includes(body.mimeType)) return res.status(400).json({ error: { code: "FILE_TYPE_BLOCKED", message: "Only PDF, PNG, and JPG files are allowed." } });
  const doc = { ...body, id: id("doc"), storageKey: `secure/${id("file")}` };
  db.documents.unshift(doc);
  audit(req.user?.id, "DOCUMENT_UPLOAD", "Document", doc.id);
  res.status(201).json(doc);
});

api.get("/analytics", requirePermission("analytics:read"), (_req, res) => res.json(analytics()));
api.get("/reports/:type", requirePermission("reports:read"), (req, res) => {
  const type = req.params.type;
  const csv = type === "employees" ? toCsv(db.employees) : type === "payroll" ? toCsv(db.payroll) : type === "leaves" ? toCsv(db.leaveRequests) : toCsv(db.attendance);
  res.header("Content-Type", "text/csv").attachment(`${type}-report.csv`).send(csv);
});
api.get("/audit-logs", requirePermission("audit:read"), (req, res) => {
  let logs = db.auditLogs;
  if (req.query.action) logs = logs.filter((log) => log.action === req.query.action);
  res.json(paginate(logs, req.query.page, req.query.pageSize));
});
api.get("/search", (req: AuthedRequest, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const employees = req.user?.role === "ADMIN" ? db.employees.filter((employee) => [employee.fullName, employee.employeeCode, employee.email, employee.department].join(" ").toLowerCase().includes(q)) : [];
  res.json({ employees, leaves: db.leaveRequests.filter((leave) => leave.remarks.toLowerCase().includes(q)), attendance: db.attendance.filter((attendance) => attendance.date.includes(q)) });
});
api.get("/settings", requirePermission("settings:manage"), (_req, res) => res.json({ organization: { name: "Dayflow Demo Co.", timezone: "America/New_York" }, departments: db.departments, leaveTypes: db.leaveTypes, permissions }));

app.use("/api/v1", api);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup({ openapi: "3.0.0", info: { title: "Dayflow API", version: "1.0.0" }, paths: {} }));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  res.status(message.includes("not found") ? 404 : 400).json({ error: { code: "REQUEST_FAILED", message } });
});

function publicUser(user: { id: string; employeeId: string; email: string; role: Role; emailVerifiedAt?: string | null }) {
  return { id: user.id, employeeId: user.employeeId, email: user.email, role: user.role, emailVerifiedAt: user.emailVerifiedAt };
}

function paginate<T>(rows: T[], pageValue: unknown = 1, pageSizeValue: unknown = 10) {
  const page = Math.max(1, Number(pageValue || 1));
  const pageSize = Math.min(100, Math.max(1, Number(pageSizeValue || 10)));
  return { data: rows.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: rows.length };
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  return [keys.join(","), ...rows.map((row) => keys.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
}

if (process.env.NODE_ENV !== "test") {
  app.listen(Number(process.env.PORT || 4200), () => console.log(`Dayflow API listening on ${process.env.PORT || 4200}`));
}
