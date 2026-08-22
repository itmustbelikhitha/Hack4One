import { useEffect, useState } from 'react';
import {
  Clock, CalendarDays, Wallet, TrendingUp, CheckCircle2,
  AlertCircle, ArrowRight, UserCircle, Briefcase, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Spinner, Badge, EmptyState, Button } from '@/components/ui';
import { Link, useRouter } from '@/router/Router';
import { getEmployeeByUserId, getTodayAttendance, getLeavesByEmployee, getPayrollByEmployee } from '@/lib/api';
import type { Employee, Attendance, LeaveRequest, Payroll } from '@/types';

export function EmployeeDashboard() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todayAtt, setTodayAtt] = useState<Attendance | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;
    (async () => {
      try {
        const emp = await getEmployeeByUserId(user.userId);
        setEmployee(emp);
        const empId = emp?.employeeId || user.employeeId;
        if (empId) {
          const [today, lv, pay] = await Promise.all([
            getTodayAttendance(empId).catch(() => null),
            getLeavesByEmployee(empId).catch(() => []),
            getPayrollByEmployee(empId).catch(() => []),
          ]);
          setTodayAtt(today);
          setLeaves(lv || []);
          setPayroll(pay || []);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.userId, user?.employeeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const effectiveEmpId = employee?.employeeId || user?.employeeId || 'N/A';
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const latestPayroll = payroll[0];

  const stats = [
    {
      label: "Today's Status",
      value: todayAtt?.status ?? 'Not checked in',
      icon: <Clock size={22} />,
      color: todayAtt?.status === 'Present' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700',
      badge: todayAtt?.checkIn ? `Checked in at ${new Date(todayAtt.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No check-in yet',
    },
    {
      label: 'Pending Leaves',
      value: pendingLeaves.toString(),
      icon: <CalendarDays size={22} />,
      color: 'bg-amber-50 text-amber-700',
      badge: `${leaves.length} total requests`,
    },
    {
      label: 'Net Salary',
      value: latestPayroll ? `$${latestPayroll.netSalary.toLocaleString()}` : '—',
      icon: <Wallet size={22} />,
      color: 'bg-blue-50 text-blue-700',
      badge: latestPayroll ? `Effective: ${latestPayroll.effectiveFrom}` : 'Payroll not generated',
    },
    {
      label: 'Department',
      value: employee?.department || 'General',
      icon: <TrendingUp size={22} />,
      color: 'bg-teal-50 text-teal-700',
      badge: employee?.designation || 'Staff Member',
    },
  ];

  const quickShortcuts = [
    {
      title: 'Attendance',
      desc: todayAtt?.checkIn ? 'View log or check out' : 'Mark daily check-in',
      icon: <Clock size={20} className="text-teal-600" />,
      path: '/employee/attendance',
      actionText: todayAtt?.checkIn ? 'View Record' : 'Check In Now',
    },
    {
      title: 'Apply Leave',
      desc: 'Submit paid, sick, or casual leave',
      icon: <CalendarDays size={20} className="text-indigo-600" />,
      path: '/employee/leave',
      actionText: 'Request Leave',
    },
    {
      title: 'My Profile',
      desc: 'View personal details & job info',
      icon: <UserCircle size={20} className="text-emerald-600" />,
      path: '/employee/profile',
      actionText: 'View Profile',
    },
    {
      title: 'Payroll & Slips',
      desc: 'Access monthly salary breakdowns',
      icon: <Wallet size={20} className="text-amber-600" />,
      path: '/employee/payroll',
      actionText: 'View Payroll',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Employee ID */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Briefcase size={12} /> Employee Portal
              </span>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {employee?.fullName || user?.name || 'Employee'}
            </h1>
            <p className="text-slate-300 text-sm mt-1 flex items-center gap-2">
              <span>Employee ID:</span>
              <code className="bg-slate-800/90 text-teal-300 px-2 py-0.5 rounded text-xs font-mono font-semibold tracking-wider border border-slate-700">
                {effectiveEmpId}
              </code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/employee/attendance')}
              className="shadow-lg shadow-teal-600/30"
            >
              <Clock size={16} className="mr-2" />
              {todayAtt ? 'Attendance Hub' : 'Check In Today'}
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

      {/* Quick Navigation Shortcuts */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickShortcuts.map((sc, idx) => (
            <Link
              key={idx}
              to={sc.path}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {sc.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                  {sc.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{sc.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-teal-600 group-hover:text-teal-700">
                <span>{sc.actionText}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Detailed Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Attendance Overview */}
        <Card>
          <CardHeader
            title="Today's Attendance"
            subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          />
          <div className="p-5">
            {todayAtt ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-teal-50/70 border border-teal-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-teal-950">Checked In</p>
                      <p className="text-xs text-teal-700">
                        {todayAtt.checkIn ? new Date(todayAtt.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Recorded'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Present</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {todayAtt.checkOut ? 'Checked Out' : 'Check Out Pending'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {todayAtt.checkOut
                          ? new Date(todayAtt.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : 'Check out at the end of your shift'}
                      </p>
                    </div>
                  </div>
                  {todayAtt.checkOut ? (
                    <Badge variant="info">Completed</Badge>
                  ) : (
                    <Link
                      to="/employee/attendance"
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800 bg-white border border-teal-200 px-3 py-1.5 rounded-lg shadow-sm"
                    >
                      Check Out →
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">You haven't checked in today</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Mark your attendance to log today's working hours.</p>
                <Button variant="primary" onClick={() => navigate('/employee/attendance')}>
                  <Clock size={16} className="mr-1.5" /> Check In Now
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Leave Requests */}
        <Card>
          <CardHeader
            title="Recent Leave Requests"
            subtitle="Integration with Leave Management"
          />
          <div className="p-5">
            {leaves.length === 0 ? (
              <EmptyState
                icon={<CalendarDays size={36} />}
                title="No leave requests yet"
                description="When you apply for leaves, status updates will appear here."
              />
            ) : (
              <div className="space-y-3">
                {leaves.slice(0, 4).map((leave) => (
                  <div key={leave.leaveId} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{leave.leaveType} Leave</p>
                      <p className="text-xs text-slate-500 mt-0.5">{leave.startDate} → {leave.endDate}</p>
                    </div>
                    <Badge variant={
                      leave.status === 'Approved' ? 'success' :
                      leave.status === 'Rejected' ? 'error' : 'warning'
                    }>
                      {leave.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <Link to="/employee/leave" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                View All Requests <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

