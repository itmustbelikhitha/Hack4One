import { useEffect, useState } from 'react';
import {
  Users, Clock, CalendarDays, Wallet, TrendingUp, CheckCircle2,
  ArrowRight, ShieldCheck, UserCheck, AlertCircle, ChevronRight
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Spinner, Badge, EmptyState, Button } from '@/components/ui';
import { Link, useRouter } from '@/router/Router';
import { getEmployees, getAllAttendance, getAllLeaves, getAllPayroll } from '@/lib/api';
import type { Employee, Attendance, LeaveRequest, Payroll } from '@/types';

export function AdminDashboard() {
  const { navigate } = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [emps, att, lvs, pay] = await Promise.all([
          getEmployees().catch(() => []),
          getAllAttendance().catch(() => []),
          getAllLeaves().catch(() => []),
          getAllPayroll().catch(() => []),
        ]);
        setEmployees(emps || []);
        setAttendance(att || []);
        setLeaves(lvs || []);
        setPayroll(pay || []);
      } catch (err) {
        console.error('Admin dashboard error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => a.attendanceDate === today);
  const presentToday = todayAttendance.filter((a) => a.status === 'Present').length;
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const totalPayroll = payroll.reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const attendanceRate = employees.length > 0 ? Math.round((presentToday / employees.length) * 100) : 0;

  const stats = [
    {
      label: 'Total Employees',
      value: employees.length.toString(),
      icon: <Users size={22} />,
      color: 'bg-teal-50 text-teal-700',
      badge: 'Active workforce',
    },
    {
      label: 'Present Today',
      value: `${presentToday} / ${employees.length}`,
      icon: <CheckCircle2 size={22} />,
      color: 'bg-green-50 text-green-700',
      badge: `${attendanceRate}% turnout today`,
    },
    {
      label: 'Pending Leaves',
      value: pendingLeaves.toString(),
      icon: <CalendarDays size={22} />,
      color: 'bg-amber-50 text-amber-700',
      badge: `${leaves.length} total filings`,
    },
    {
      label: 'Monthly Payroll',
      value: `$${totalPayroll.toLocaleString()}`,
      icon: <Wallet size={22} />,
      color: 'bg-blue-50 text-blue-700',
      badge: `${payroll.length} salary records`,
    },
  ];

  const adminShortcuts = [
    {
      title: 'Employee Directory',
      desc: 'Add, view, and manage all staff members',
      icon: <Users size={20} className="text-teal-600" />,
      path: '/admin/employees',
      actionText: 'Manage Staff',
    },
    {
      title: 'Attendance Monitor',
      desc: 'Review daily check-ins & export records',
      icon: <Clock size={20} className="text-blue-600" />,
      path: '/admin/attendance',
      actionText: 'View Attendance',
    },
    {
      title: 'Leave Approvals',
      desc: 'Process pending leave applications',
      icon: <CalendarDays size={20} className="text-amber-600" />,
      path: '/admin/leaves',
      actionText: 'Review Leaves',
    },
    {
      title: 'Payroll Control',
      desc: 'Manage salaries, bonuses, and slips',
      icon: <Wallet size={20} className="text-emerald-600" />,
      path: '/admin/payroll',
      actionText: 'Configure Payroll',
    },
  ];

  const recentLeaves = leaves.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <ShieldCheck size={12} /> Admin Command Center
              </span>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              HR Administration Overview
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Real-time monitoring of organization attendance, leaves, and staff operations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/admin/attendance')}
              className="shadow-lg shadow-teal-600/30"
            >
              <Clock size={16} className="mr-2" />
              Live Attendance
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-slate-800 truncate">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1 truncate">{stat.badge}</p>
          </Card>
        ))}
      </div>

      {/* Admin Quick Action Shortcuts */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Admin Operations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminShortcuts.map((sc, idx) => (
            <Link
              key={idx}
              to={sc.path}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {sc.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                  {sc.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{sc.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
                <span>{sc.actionText}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Grid Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending leave requests */}
        <Card>
          <CardHeader
            title="Pending Leave Requests"
            subtitle={`${pendingLeaves} awaiting review`}
          />
          <div className="p-5">
            {recentLeaves.length === 0 ? (
              <EmptyState
                icon={<CalendarDays size={36} />}
                title="No leave requests"
                description="Staff leave requests will appear here for your review."
              />
            ) : (
              <div className="space-y-3">
                {recentLeaves.map((leave) => {
                  const emp = employees.find((e) => e.employeeId === leave.employeeId);
                  return (
                    <div key={leave.leaveId} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{emp?.fullName ?? 'Staff Member'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{leave.leaveType} · {leave.startDate} → {leave.endDate}</p>
                      </div>
                      <Badge variant={leave.status === 'Approved' ? 'success' : leave.status === 'Rejected' ? 'error' : 'warning'}>
                        {leave.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <Link to="/admin/leaves" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Manage Leave Requests <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </Card>

        {/* Recent employees list */}
        <Card>
          <CardHeader
            title="Organization Employees"
            subtitle={`${employees.length} total staff members`}
          />
          <div className="p-5">
            {employees.length === 0 ? (
              <EmptyState
                icon={<Users size={36} />}
                title="No employees registered"
                description="Registered employees will appear in this roster."
              />
            ) : (
              <div className="space-y-3">
                {employees.slice(0, 5).map((emp) => (
                  <div key={emp.employeeId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {emp.fullName?.charAt(0).toUpperCase() || 'E'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{emp.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{emp.designation || 'Staff'} · {emp.email}</p>
                    </div>
                    <Badge variant="info">{emp.department || 'General'}</Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <Link to="/admin/employees" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View Full Directory <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

