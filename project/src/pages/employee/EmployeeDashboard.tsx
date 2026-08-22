import { useEffect, useState } from 'react';
import { Clock, CalendarDays, Wallet, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Spinner, Badge, EmptyState } from '@/components/ui';
import { getEmployeeByUserId, getTodayAttendance, getLeavesByEmployee, getPayrollByEmployee } from '@/lib/api';
import type { Employee, Attendance, LeaveRequest, Payroll } from '@/types';

export function EmployeeDashboard() {
  const { user } = useAuth();
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
        if (emp) {
          const [today, lv, pay] = await Promise.all([
            getTodayAttendance(emp.employeeId),
            getLeavesByEmployee(emp.employeeId),
            getPayrollByEmployee(emp.employeeId),
          ]);
          setTodayAtt(today);
          setLeaves(lv);
          setPayroll(pay);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const latestPayroll = payroll[0];

  const stats = [
    {
      label: 'Today\'s Status',
      value: todayAtt?.status ?? 'Not checked in',
      icon: <Clock size={22} />,
      color: 'bg-teal-50 text-teal-700',
      badge: todayAtt?.checkIn ? 'Checked in' : 'No check-in',
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
      badge: latestPayroll ? `From ${latestPayroll.effectiveFrom}` : 'Not set',
    },
    {
      label: 'Department',
      value: employee?.department ?? 'Not assigned',
      icon: <TrendingUp size={22} />,
      color: 'bg-slate-100 text-slate-700',
      badge: employee?.designation ?? '—',
    },
  ];

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name}`} subtitle="Here's your overview for today" />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.badge}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent leaves */}
        <Card>
          <CardHeader title="Recent Leave Requests" subtitle="Your latest applications" />
          <div className="p-4">
            {leaves.length === 0 ? (
              <EmptyState
                icon={<CalendarDays size={40} />}
                title="No leave requests yet"
                description="Apply for leave from the Leave page."
              />
            ) : (
              <div className="space-y-3">
                {leaves.slice(0, 5).map((leave) => (
                  <div key={leave.leaveId} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{leave.leaveType} Leave</p>
                      <p className="text-xs text-slate-500">{leave.startDate} → {leave.endDate}</p>
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
          </div>
        </Card>

        {/* Today's attendance */}
        <Card>
          <CardHeader title="Today's Attendance" subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} />
          <div className="p-4">
            {todayAtt ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle2 size={24} className="text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Checked In</p>
                    <p className="text-xs text-green-600">
                      {todayAtt.checkIn ? new Date(todayAtt.checkIn).toLocaleTimeString() : '—'}
                    </p>
                  </div>
                </div>
                {todayAtt.checkOut ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <Clock size={24} className="text-slate-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Checked Out</p>
                      <p className="text-xs text-slate-500">
                        {new Date(todayAtt.checkOut).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertCircle size={24} className="text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Still checked in</p>
                      <p className="text-xs text-amber-600">Remember to check out before leaving.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={<Clock size={40} />}
                title="Not checked in today"
                description="Go to the Attendance page to check in."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
