import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  Clock3,
  Command,
  Download,
  Eye,
  FileText,
  FileSearch,
  CheckCircle,
  LayoutDashboard,
  LogOut,
  Moon,
  Pencil,
  Plus,
  RotateCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  WalletCards,
  XCircle
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import "./styles.css";

type Role = "ADMIN" | "EMPLOYEE";
type User = { id: string; email: string; role: Role; employeeId: string };
type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  jobTitle: string;
  department: string;
  roleLabel: string;
  joiningDate: string;
  employmentStatus: string;
  reportingManager: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  profilePictureUrl?: string;
  completionPercent: number;
};

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4200/api/v1";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const colors = ["#0f766e", "#2563eb", "#dc2626", "#ca8a04", "#7c3aed"];

function App() {
  const [token, setToken] = useState(localStorage.getItem("dayflow_token") || "");
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [route, setRoute] = useState("dashboard");
  const [dark, setDark] = useState(localStorage.getItem("dayflow_theme") === "dark");
  const [commandOpen, setCommandOpen] = useState(false);
  const [toast, setToast] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);

  function notify(tone: "success" | "error" | "info", text: string) {
    setToast({ tone, text });
    window.setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("dayflow_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (!token) return;
    api("/me", token).then((data) => {
      setUser(data.user);
      setEmployee(data.employee);
    }).catch(() => setToken(""));
  }, [token]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!token || !user) return <AuthScreen onLogin={(nextToken, nextUser, nextEmployee) => {
    localStorage.setItem("dayflow_token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setEmployee(nextEmployee);
  }} />;

  const nav = navigation(user.role);
  const active = nav.find((item) => item.id === route) || nav[0];

  return (
    <div className="appShell">
      <div className="ambientLayer" aria-hidden="true" />
      <aside className="sidebar">
        <div className="brandMark">
          <div className="logo">D</div>
          <div>
            <strong>DAYFLOW</strong>
            <span>HRMS</span>
          </div>
        </div>
        <nav>
          {nav.map((item) => <button key={item.id} className={route === item.id ? "active" : ""} onClick={() => setRoute(item.id)} title={item.label}><item.icon size={18} /> <span>{item.label}</span></button>)}
        </nav>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="crumb">Dayflow / {active.label}</span>
            <h1>{active.label}</h1>
          </div>
          <div className="topActions">
            <span className="livePill"><span /> Live workspace</span>
            <button className="searchButton" onClick={() => setCommandOpen(true)}><Search size={16} /> Search</button>
            <button className="iconButton" onClick={() => setDark(!dark)} title="Toggle theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="iconButton" onClick={() => setRoute("notifications")} title="Notifications"><Bell size={18} /></button>
            <button className="avatarButton" onClick={() => setRoute("profile")}><UserRound size={18} /> {employee?.fullName}</button>
            <button className="iconButton" onClick={() => { localStorage.removeItem("dayflow_token"); setToken(""); setUser(null); }} title="Logout"><LogOut size={18} /></button>
          </div>
        </header>
        <Page route={route} role={user.role} token={token} employee={employee} setRoute={setRoute} notify={notify} refreshMe={() => api("/me", token).then((data) => setEmployee(data.employee))} />
      </main>
      {commandOpen && <CommandPalette token={token} nav={nav} close={() => setCommandOpen(false)} go={setRoute} />}
      {toast && <div className={`toast ${toast.tone}`}>{toast.text}</div>}
    </div>
  );
}

function AuthScreen({ onLogin }: { onLogin: (token: string, user: User, employee: Employee) => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [form, setForm] = useState({ employeeId: "", email: "hr@dayflow.test", password: "Dayflow@123", role: "ADMIN" as Role, remember: true });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const strength = passwordStrength(form.password);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (mode === "forgot") {
        const data = await api("/auth/forgot-password", "", { method: "POST", body: { email: form.email } });
        setMessage(data.message);
      } else if (mode === "signup") {
        const data = await api("/auth/signup", "", { method: "POST", body: form });
        setMessage(data.message);
      } else {
        const data = await api("/auth/login", "", { method: "POST", body: { email: form.email, password: form.password, remember: form.remember } });
        onLogin(data.accessToken, data.user, data.employee);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <div className="authBackdrop" aria-hidden="true" />
      <section className="authHero">
        <div className="logo large">D</div>
        <h1>DAYFLOW</h1>
        <p>Every workday, perfectly aligned.</p>
        <div className="heroSignal">
          <Sparkles size={18} />
          <span>Smart HR operations with audit-ready workflows</span>
        </div>
        <div className="authPreview">
          <Metric label="Present today" value="96%" />
          <Metric label="Leave SLA" value="2h" />
          <Metric label="Payroll accuracy" value="99.8%" />
        </div>
      </section>
      <form className="authPanel" onSubmit={submit}>
        <div className="tabs">
          <button type="button" className={mode === "login" ? "selected" : ""} onClick={() => setMode("login")}>Sign in</button>
          <button type="button" className={mode === "signup" ? "selected" : ""} onClick={() => setMode("signup")}>Sign up</button>
          <button type="button" className={mode === "forgot" ? "selected" : ""} onClick={() => setMode("forgot")}>Reset</button>
        </div>
        {mode === "signup" && <Input label="Employee ID" value={form.employeeId} onChange={(employeeId) => setForm({ ...form, employeeId })} />}
        <Input label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        {mode !== "forgot" && <Input label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />}
        {mode !== "forgot" && <div className="strength"><span style={{ width: `${strength}%` }} /></div>}
        {mode === "signup" && <label className="field"><span>Role</span><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}><option value="EMPLOYEE">Employee</option><option value="ADMIN">Admin / HR Officer</option></select></label>}
        {mode === "login" && <label className="check"><input type="checkbox" checked={form.remember} onChange={(event) => setForm({ ...form, remember: event.target.checked })} /> Remember this device</label>}
        {message && <p className="notice">{message}</p>}
        <button className="primary" disabled={loading}>{loading ? "Working..." : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}</button>
      </form>
    </main>
  );
}

function Page(props: { route: string; role: Role; token: string; employee: Employee | null; setRoute: (route: string) => void; notify: (tone: "success" | "error" | "info", text: string) => void; refreshMe: () => void }) {
  if (props.route === "dashboard") return <Dashboard {...props} />;
  if (props.route === "employees") return <Employees token={props.token} notify={props.notify} />;
  if (props.route === "profile") return <Profile token={props.token} employee={props.employee} notify={props.notify} refreshMe={props.refreshMe} />;
  if (props.route === "attendance") return <Attendance token={props.token} role={props.role} notify={props.notify} />;
  if (props.route === "leave") return <Leave token={props.token} role={props.role} />;
  if (props.route === "payroll") return <Payroll token={props.token} role={props.role} employee={props.employee} />;
  if (props.route === "notifications") return <Notifications token={props.token} />;
  if (props.route === "documents") return <Documents token={props.token} employee={props.employee} />;
  if (props.route === "analytics") return <Analytics token={props.token} />;
  if (props.route === "reports") return <Reports token={props.token} />;
  if (props.route === "audit") return <AuditLogs token={props.token} />;
  return <SettingsPage token={props.token} role={props.role} />;
}

function Dashboard({ role, token, setRoute }: { role: Role; token: string; setRoute: (route: string) => void }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api(role === "ADMIN" ? "/dashboard/admin" : "/dashboard/me", token).then(setData); }, [role, token]);
  if (!data) return <SkeletonGrid />;
  const metrics = data.metrics;
  return (
    <section className="pageGrid">
      <div className="dashboardHero">
        <div>
          <span className="sectionKicker"><Sparkles size={16} /> Command center</span>
          <h2>{role === "ADMIN" ? "Workforce operations, ready for action." : "Your day, organized in one place."}</h2>
          <p>{role === "ADMIN" ? "Monitor attendance signals, people movement, payroll readiness, and approvals without jumping between tools." : "Track attendance, leave, pay, documents, and notifications from a single focused dashboard."}</p>
        </div>
        <div className="heroActions">
          <button className="primary" onClick={() => setRoute("attendance")}><Clock3 size={16} /> Attendance</button>
          <button onClick={() => setRoute(role === "ADMIN" ? "employees" : "leave")}><ArrowUpRight size={16} /> {role === "ADMIN" ? "Open people" : "Request leave"}</button>
        </div>
      </div>
      <div className="metricGrid">
        {Object.entries(metrics).slice(0, 7).map(([key, value]) => <Metric key={key} label={label(key)} value={typeof value === "object" && value ? ((value as { period?: string }).period || "Ready") : String(value)} />)}
      </div>
      <div className="insightStrip">
        <Insight icon={<CalendarCheck size={18} />} title="Attendance pulse" text="Trend chart updates from live attendance records." />
        <Insight icon={<ShieldCheck size={18} />} title="Audit posture" text="Sensitive HR actions are tracked for review." />
        <Insight icon={<Bell size={18} />} title="Queue focus" text="Notifications surface unread work first." />
      </div>
      <div className="split">
        <Panel title="Attendance Trend" action={<button onClick={() => setRoute("attendance")}><CalendarCheck size={16} /> Open</button>}>
          <Chart data={data.charts.attendanceTrend || data.charts.attendance} type="line" />
        </Panel>
        <Panel title={role === "ADMIN" ? "Department Distribution" : "Leave Balance"}>
          <Chart data={data.charts.departmentDistribution || data.charts.leave} type="bar" />
        </Panel>
      </div>
      <Panel title={role === "ADMIN" ? "Recent HR Activity" : "Recent Activity"}>
        <ActivityList rows={data.recentActivity || []} />
      </Panel>
    </section>
  );
}

function Employees({ token, notify }: { token: string; notify: (tone: "success" | "error" | "info", text: string) => void }) {
  const [q, setQ] = useState("");
  const [data, setData] = useState<any>({ data: [] });
  const [draft, setDraft] = useState({ employeeCode: "", fullName: "", email: "", department: "Engineering", jobTitle: "" });
  const [selected, setSelected] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const load = () => api(`/employees?q=${encodeURIComponent(q)}`, token).then(setData).catch((error) => notify("error", error.message));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q, token]);
  async function createEmployee() {
    try {
      const employee = await api("/employees", token, { method: "POST", body: draft });
      setData({ ...data, data: [employee, ...data.data] });
      setDraft({ employeeCode: "", fullName: "", email: "", department: "Engineering", jobTitle: "" });
      notify("success", `${employee.fullName} was onboarded with a starter account.`);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Employee creation failed.");
    }
  }
  async function saveEmployee() {
    if (!editing) return;
    try {
      const employee = await api(`/employees/${editing.id}`, token, { method: "PATCH", body: editing });
      setData({ ...data, data: data.data.map((item: Employee) => item.id === employee.id ? employee : item) });
      setEditing(null);
      notify("success", "Employee profile updated.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Update failed.");
    }
  }
  async function deleteEmployee(employee: Employee) {
    if (!window.confirm(`Soft-delete ${employee.fullName}? Historical attendance, leave, payroll, and audit records will remain.`)) return;
    try {
      const result = await api(`/employees/${employee.id}`, token, { method: "DELETE" });
      setData({ ...data, data: data.data.map((item: Employee) => item.id === employee.id ? result.employee : item) });
      notify("info", result.message);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Delete failed.");
    }
  }
  return (
    <section className="pageGrid">
      <Panel title="Employee Directory" action={<button onClick={() => download(`${apiBase}/reports/employees`, token)}><Download size={16} /> Export</button>}>
        <div className="toolbar"><Input label="Search employees" value={q} onChange={setQ} /></div>
        <DataTable rows={data.data} columns={["employeeCode", "fullName", "department", "jobTitle", "email", "employmentStatus", "joiningDate"]} renderActions={(row) => <><button title="View profile" onClick={() => setSelected(row)}><Eye size={16} /></button><button title="Edit profile" onClick={() => setEditing(row)}><Pencil size={16} /></button><button title="Soft delete" onClick={() => deleteEmployee(row)}><Trash2 size={16} /></button></>} />
      </Panel>
      <Panel title="Onboard Employee">
        <div className="formGrid">
          {(["employeeCode", "fullName", "email", "department", "jobTitle"] as const).map((key) => <Input key={key} label={label(key)} value={draft[key]} onChange={(value) => setDraft({ ...draft, [key]: value })} />)}
          <button className="primary" onClick={createEmployee}><Plus size={16} /> Create employee</button>
        </div>
      </Panel>
      {selected && <Modal title={selected.fullName} close={() => setSelected(null)}>
        <KeyValue data={{ "Employee ID": selected.employeeCode, Email: selected.email, Phone: selected.phone, Address: selected.address, Department: selected.department, Title: selected.jobTitle, Manager: selected.reportingManager, Status: selected.employmentStatus, "Net salary": money.format(selected.netSalary), "Profile completion": `${selected.completionPercent}%` }} />
      </Modal>}
      {editing && <Modal title={`Edit ${editing.fullName}`} close={() => setEditing(null)} action={<button className="primary" onClick={saveEmployee}><Save size={16} /> Save</button>}>
        <div className="formGrid">
          {(["fullName", "phone", "address", "jobTitle", "department", "employmentStatus", "reportingManager"] as const).map((key) => <Input key={key} label={label(key)} value={String(editing[key] || "")} onChange={(value) => setEditing({ ...editing, [key]: value })} />)}
        </div>
      </Modal>}
    </section>
  );
}

function Profile({ token, employee, notify, refreshMe }: { token: string; employee: Employee | null; notify: (tone: "success" | "error" | "info", text: string) => void; refreshMe: () => void }) {
  const [form, setForm] = useState(employee);
  if (!form) return null;
  async function save() {
    try {
      setForm(await api(`/employees/${form!.id}`, token, { method: "PATCH", body: form }));
      refreshMe();
      notify("success", "Profile saved and audit logged.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Profile save failed.");
    }
  }
  return (
    <section className="split">
      <Panel title="Personal Information">
        <div className="profileHeader"><div className="profileOrb">{form.fullName.slice(0, 2).toUpperCase()}</div><div><h2>{form.fullName}</h2><p>{form.jobTitle} / {form.department}</p></div></div>
        <div className="completion"><span style={{ width: `${form.completionPercent}%` }} /> <b>{form.completionPercent}% complete</b></div>
        <div className="formGrid">
          <Input label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
          <Input label="Address" value={form.address} onChange={(address) => setForm({ ...form, address })} />
          <Input label="Profile picture URL" value={form.profilePictureUrl || ""} onChange={(profilePictureUrl) => setForm({ ...form, profilePictureUrl })} />
          <button className="primary" onClick={save}><Save size={16} /> Save profile</button>
        </div>
      </Panel>
      <Panel title="Job and Salary">
        <KeyValue data={{ "Employee ID": form.employeeCode, Role: form.roleLabel, Manager: form.reportingManager, Status: form.employmentStatus, "Base salary": money.format(form.baseSalary), Allowances: money.format(form.allowances), Deductions: money.format(form.deductions), "Net salary": money.format(form.netSalary) }} />
      </Panel>
    </section>
  );
}

function Attendance({ token, role, notify }: { token: string; role: Role; notify: (tone: "success" | "error" | "info", text: string) => void }) {
  const [data, setData] = useState<any>({ data: [] });
  const [status, setStatus] = useState("");
  const load = () => api(`/attendance${status ? `?status=${status}` : ""}`, token).then(setData).catch((error) => notify("error", error.message));
  useEffect(() => { load(); }, [status]);
  async function action(path: string) {
    try {
      await api(path, token, { method: "POST" });
      notify("success", path.includes("check-in") ? "Checked in for today." : "Checked out and working hours were calculated.");
      load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Attendance action failed.");
    }
  }
  async function correct(row: any, status: string) {
    const now = new Date().toISOString();
    try {
      await api(`/attendance/${row.id}`, token, { method: "PATCH", body: { status, checkInAt: row.checkInAt || now, checkOutAt: status === "ABSENT" || status === "LEAVE" ? null : row.checkOutAt || now, notes: `HR correction: ${status}` } });
      notify("success", "Attendance correction saved with an audit entry.");
      load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Attendance correction failed.");
    }
  }
  return (
    <Panel title="Attendance" action={<><button onClick={() => action("/attendance/check-in")}><CalendarCheck size={16} /> Check in</button><button onClick={() => action("/attendance/check-out")}><Activity size={16} /> Check out</button></>}>
      <div className="toolbar"><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option>PRESENT</option><option>ABSENT</option><option>HALF_DAY</option><option>LEAVE</option></select></div>
      <DataTable rows={data.data} columns={["date", "employeeId", "checkInAt", "checkOutAt", "status", "totalWorkingHours", "late", "earlyDeparture", "anomaly"]} renderActions={(row) => role === "ADMIN" ? <><button title="Mark present" onClick={() => correct(row, "PRESENT")}><CheckCircle size={16} /></button><button title="Mark half day" onClick={() => correct(row, "HALF_DAY")}><Activity size={16} /></button><button title="Mark absent" onClick={() => correct(row, "ABSENT")}><XCircle size={16} /></button></> : null} />
      {role === "ADMIN" && <p className="hint">HR correction buttons recalculate hours where possible and write an audit entry.</p>}
    </Panel>
  );
}

function Leave({ token, role }: { token: string; role: Role }) {
  const [data, setData] = useState<any>({ data: [], leaveTypes: [], balances: [] });
  const [form, setForm] = useState({ leaveTypeId: "lt_paid", startDate: "", endDate: "", remarks: "" });
  const load = () => api("/leaves", token).then(setData);
  useEffect(() => { load(); }, []);
  async function submit() { await api("/leaves", token, { method: "POST", body: form }); load(); }
  async function decide(id: string, path: "approve" | "reject") { await api(`/leaves/${id}/${path}`, token, { method: "POST", body: { comment: path === "approve" ? "Approved by HR" : "Rejected by HR" } }); load(); }
  return (
    <section className="pageGrid">
      <Panel title="Apply for Leave">
        <div className="formGrid">
          <label className="field"><span>Leave type</span><select value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}>{data.leaveTypes.map((type: any) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
          <Input label="Start date" type="date" value={form.startDate} onChange={(startDate) => setForm({ ...form, startDate })} />
          <Input label="End date" type="date" value={form.endDate} onChange={(endDate) => setForm({ ...form, endDate })} />
          <Input label="Remarks" value={form.remarks} onChange={(remarks) => setForm({ ...form, remarks })} />
          <button className="primary" onClick={submit}>Submit leave</button>
        </div>
      </Panel>
      <Panel title="Leave Requests">
        <DataTable rows={data.data} columns={["type", "startDate", "endDate", "days", "status", "remarks"]} renderActions={(row) => role === "ADMIN" && row.status === "PENDING" ? <><button onClick={() => decide(row.id, "approve")}>Approve</button><button onClick={() => decide(row.id, "reject")}>Reject</button></> : null} />
      </Panel>
    </section>
  );
}

function Payroll({ token, role, employee }: { token: string; role: Role; employee: Employee | null }) {
  const [data, setData] = useState<any>({ data: [] });
  const [salary, setSalary] = useState({ baseSalary: employee?.baseSalary || 0, allowances: employee?.allowances || 0, deductions: employee?.deductions || 0, reason: "Annual revision" });
  const load = () => api("/payroll", token).then(setData);
  useEffect(() => { load(); }, []);
  async function save() { if (employee) await api(`/payroll/structures/${employee.id}`, token, { method: "PATCH", body: salary }); load(); }
  return (
    <section className="pageGrid">
      <Panel title="Payroll History">
        <DataTable rows={data.data} columns={["period", "gross", "deductions", "net", "status"]} renderActions={(row) => <button onClick={() => download(`${apiBase}/payroll/${row.id}/slip`, token)}><FileText size={16} /> Slip</button>} />
      </Panel>
      {role === "ADMIN" && <Panel title="Salary Structure">
        <div className="formGrid">
          <Input label="Base salary" type="number" value={String(salary.baseSalary)} onChange={(baseSalary) => setSalary({ ...salary, baseSalary: Number(baseSalary) })} />
          <Input label="Allowances" type="number" value={String(salary.allowances)} onChange={(allowances) => setSalary({ ...salary, allowances: Number(allowances) })} />
          <Input label="Deductions" type="number" value={String(salary.deductions)} onChange={(deductions) => setSalary({ ...salary, deductions: Number(deductions) })} />
          <Input label="Reason" value={salary.reason} onChange={(reason) => setSalary({ ...salary, reason })} />
          <button className="primary" onClick={save}>Update salary</button>
        </div>
      </Panel>}
    </section>
  );
}

function Notifications({ token }: { token: string }) {
  const [data, setData] = useState<any>({ data: [], unread: 0 });
  const load = () => api("/notifications", token).then(setData);
  useEffect(() => { load(); }, []);
  return <Panel title={`Notifications (${data.unread} unread)`} action={<button onClick={() => api("/notifications/read-all", token, { method: "PATCH" }).then(load)}>Mark all read</button>}>
    <div className="list">{data.data.map((note: any) => <button className="listItem" key={note.id} onClick={() => api(`/notifications/${note.id}/read`, token, { method: "PATCH" }).then(load)}><b>{note.title}</b><span>{note.body}</span><Status value={note.readAt ? "READ" : "UNREAD"} /></button>)}</div>
  </Panel>;
}

function Documents({ token, employee }: { token: string; employee: Employee | null }) {
  const [data, setData] = useState<any>({ data: [] });
  const [doc, setDoc] = useState({ employeeId: employee?.id || "", name: "", category: "Employment", mimeType: "application/pdf", sizeBytes: 1000 });
  const load = () => api("/documents", token).then(setData);
  useEffect(() => { load(); }, []);
  async function upload() { await api("/documents", token, { method: "POST", body: doc }); load(); }
  return <section className="pageGrid"><Panel title="Documents"><DataTable rows={data.data} columns={["name", "category", "mimeType", "sizeBytes"]} /></Panel><Panel title="Secure Upload Metadata"><div className="formGrid"><Input label="Name" value={doc.name} onChange={(name) => setDoc({ ...doc, name })} /><Input label="Category" value={doc.category} onChange={(category) => setDoc({ ...doc, category })} /><button className="primary" onClick={upload}>Upload document</button></div></Panel></section>;
}

function Analytics({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api("/analytics", token).then(setData); }, []);
  if (!data) return <SkeletonGrid />;
  return <section className="split"><Panel title="Attendance"><Chart data={data.attendanceTrend} type="line" /></Panel><Panel title="Leave Types"><Chart data={data.leaveDistribution} type="pie" /></Panel><Panel title="Departments"><Chart data={data.departmentDistribution} type="bar" /></Panel><Panel title="Payroll Trend"><Chart data={data.payrollTrend} type="line" /></Panel></section>;
}

function Reports({ token }: { token: string }) {
  return <Panel title="Reports"><div className="reportGrid">{["attendance", "leaves", "employees", "payroll"].map((type) => <button key={type} className="reportTile" onClick={() => download(`${apiBase}/reports/${type}`, token)}><Download size={18} /><b>{label(type)} report</b><span>CSV export and print-ready source data</span></button>)}</div></Panel>;
}

function AuditLogs({ token }: { token: string }) {
  const [data, setData] = useState<any>({ data: [] });
  useEffect(() => { api("/audit-logs", token).then(setData); }, []);
  return <Panel title="Audit Logs"><DataTable rows={data.data} columns={["createdAt", "action", "entity", "entityId", "ipAddress"]} /></Panel>;
}

function SettingsPage({ token, role }: { token: string; role: Role }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => { if (role === "ADMIN") api("/settings", token).then(setData); }, [role]);
  if (role !== "ADMIN") return <Panel title="Settings"><KeyValue data={{ "Notification preference": "In-app enabled", "MFA": "Ready for enrollment", "Session management": "Current device active" }} /></Panel>;
  return <section className="split"><Panel title="Organization Settings"><KeyValue data={data?.organization || {}} /></Panel><Panel title="Departments"><DataTable rows={data?.departments || []} columns={["name"]} /></Panel><Panel title="Leave Types"><DataTable rows={data?.leaveTypes || []} columns={["name", "paid", "annualAllowance"]} /></Panel><Panel title="Security"><KeyValue data={{ "Rate limiting": "Enabled", "Refresh rotation": "Enabled", "CSRF-ready cookies": "Enabled", "Audit trail": "Enabled" }} /></Panel></section>;
}

function CommandPalette({ token, nav, close, go }: { token: string; nav: ReturnType<typeof navigation>; close: () => void; go: (route: string) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any>({ employees: [] });
  useEffect(() => { const t = setTimeout(() => q && api(`/search?q=${encodeURIComponent(q)}`, token).then(setResults), 250); return () => clearTimeout(t); }, [q, token]);
  return <div className="overlay" onClick={close}><div className="commandPanel" onClick={(event) => event.stopPropagation()}><label><Command size={18} /><input autoFocus placeholder="Search or jump..." value={q} onChange={(event) => setQ(event.target.value)} /></label><div>{nav.map((item) => <button key={item.id} onClick={() => { go(item.id); close(); }}><item.icon size={16} /> {item.label}</button>)}{results.employees?.map((employee: Employee) => <button key={employee.id} onClick={() => { go("employees"); close(); }}><UsersRound size={16} /> {employee.fullName}</button>)}</div></div></div>;
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="panel"><div className="panelHeader"><h2>{title}</h2><div className="panelActions">{action}</div></div>{children}</section>;
}

function Modal({ title, action, close, children }: { title: string; action?: React.ReactNode; close: () => void; children: React.ReactNode }) {
  return (
    <div className="overlay" onClick={close}>
      <section className="modalPanel" onClick={(event) => event.stopPropagation()}>
        <div className="panelHeader">
          <h2>{title}</h2>
          <div className="panelActions">
            {action}
            <button className="iconButton" onClick={close} title="Close"><XCircle size={18} /></button>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className="metric"><span>{label}</span><strong>{value}</strong></article>;
}

function Insight({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article className="insight"><div>{icon}</div><b>{title}</b><span>{text}</span></article>;
}

function DataTable({ rows, columns, renderActions }: { rows: any[]; columns: string[]; renderActions?: (row: any) => React.ReactNode }) {
  return <div className="tableWrap"><table><thead><tr>{columns.map((column) => <th key={column}>{label(column)}</th>)}{renderActions && <th>Actions</th>}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || index}>{columns.map((column) => <td key={column}>{format(row[column])}</td>)}{renderActions && <td className="rowActions">{renderActions(row)}</td>}</tr>)}</tbody></table>{!rows.length && <div className="empty">No records found.</div>}</div>;
}

function Chart({ data, type }: { data: any[]; type: "line" | "bar" | "pie" }) {
  const normalized = (data || []).map((item) => ({ name: item.name || item.date || item.period || item.leaveTypeId, value: item.value ?? item.present ?? item.net ?? item.allocated ?? 0 }));
  if (type === "pie") return <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={normalized} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96}>{normalized.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>;
  if (type === "bar") return <ResponsiveContainer width="100%" height={260}><BarChart data={normalized}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>;
  return <ResponsiveContainer width="100%" height={260}><LineChart data={normalized}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot /></LineChart></ResponsiveContainer>;
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function KeyValue({ data }: { data: Record<string, any> }) {
  return <dl className="keyValue">{Object.entries(data).map(([key, value]) => <React.Fragment key={key}><dt>{key}</dt><dd>{format(value)}</dd></React.Fragment>)}</dl>;
}

function ActivityList({ rows }: { rows: any[] }) {
  return <div className="list">{rows.map((row) => <div className="listItem" key={row.id}><b>{row.action}</b><span>{row.entity} {row.entityId}</span><small>{format(row.createdAt)}</small></div>)}</div>;
}

function Status({ value }: { value: string }) {
  return <span className={`status ${value.toLowerCase()}`}>{value}</span>;
}

function SkeletonGrid() {
  return <section className="pageGrid"><div className="dashboardHero skeletonHero" /><div className="metricGrid">{Array.from({ length: 6 }, (_, index) => <div className="skeleton" key={index} />)}</div></section>;
}

function navigation(role: Role) {
  const employee = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "profile", label: "My Profile", icon: UserRound },
    { id: "attendance", label: "Attendance", icon: CalendarCheck },
    { id: "leave", label: "Leave", icon: BriefcaseBusiness },
    { id: "payroll", label: "Payroll", icon: WalletCards },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings }
  ];
  if (role === "EMPLOYEE") return employee;
  return [
    employee[0],
    { id: "employees", label: "Employees", icon: UsersRound },
    employee[2],
    employee[3],
    employee[4],
    { id: "analytics", label: "Analytics", icon: Activity },
    { id: "reports", label: "Reports", icon: Download },
    employee[5],
    employee[6],
    { id: "audit", label: "Audit Logs", icon: ShieldCheck },
    employee[7]
  ];
}

async function api(path: string, token = "", options: { method?: string; body?: unknown } = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) throw new Error(data?.error?.message || "Request failed.");
  return data;
}

function download(url: string, token: string) {
  fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(async (response) => {
    const blob = await response.blob();
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = url.split("/").pop() || "dayflow-report";
    link.click();
    URL.revokeObjectURL(href);
  });
}

function label(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function format(value: any) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" && value > 1000) return money.format(value);
  if (typeof value === "string" && value.includes("T")) return new Date(value).toLocaleString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function passwordStrength(password: string) {
  return [password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length * 20;
}

createRoot(document.getElementById("root")!).render(<App />);
