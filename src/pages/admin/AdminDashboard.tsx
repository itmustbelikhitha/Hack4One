import { useEffect, useState } from 'react';
import { Users, Clock, CalendarDays, Wallet, TrendingUp, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Spinner, Badge, EmptyState } from '@/components/ui';
import { getEmployees, getAllAttendance, getAllLeaves, getAllPayroll } from '@/lib/api';
import type { Employee, Attendance, LeaveRequest, Payroll } from '@/types';

export function AdminDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [emps, att, lvs, pay] = await Promise.all([
          getEmployees(),
          getAllAttendance(),
          getAllLeaves(),
          getAllPayroll(),
        ]);
        setEmployees(emps);
        setAttendance(att);
        setLeaves(lvs);
        setPayroll(pay);
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
  const presentToday = attendance.filter((a) => a.attendanceDate === today && a.status === 'Present').length;
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const totalPayroll = payroll.reduce((sum, p) => sum + p.netSalary, 0);

  const stats = [
    { label: 'Total Employees', value: employees.length.toString(), icon: <Users size={22} />, color: 'bg-teal-50 text-teal-700' },
    { label: 'Present Today', value: presentToday.toString(), icon: <CheckCircle2 size={22} />, color: 'bg-green-50 text-green-700' },
    { label: 'Pending Leaves', value: pendingLeaves.toString(), icon: <CalendarDays size={22} />, color: 'bg-amber-50 text-amber-700' },
    { label: 'Monthly Payroll', value: `$${totalPayroll.toLocaleString()}`, icon: <Wallet size={22} />, color: 'bg-blue-50 text-blue-700' },
  ];

  const recentLeaves = leaves.slice(0, 5);

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Organization overview and quick actions" />

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
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending leave requests */}
        <Card>
          <CardHeader title="Pending Leave Requests" subtitle={`${pendingLeaves} awaiting approval`} />
          <div className="p-4">
            {recentLeaves.length === 0 ? (
              <EmptyState icon={<CalendarDays size={40} />} title="No leave requests" description="Leave requests will appear here." />
            ) : (
              <div className="space-y-3">
                {recentLeaves.map((leave) => {
                  const emp = employees.find((e) => e.employeeId === leave.employeeId);
                  return (
                    <div key={leave.leaveId} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{emp?.fullName ?? 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{leave.leaveType} · {leave.startDate} → {leave.endDate}</p>
                      </div>
                      <Badge variant={leave.status === 'Approved' ? 'success' : leave.status === 'Rejected' ? 'error' : 'warning'}>
                        {leave.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Recent employees */}
        <Card>
          <CardHeader title="Recent Employees" subtitle={`${employees.length} total`} />
          <div className="p-4">
            {employees.length === 0 ? (
              <EmptyState icon={<Users size={40} />} title="No employees yet" description="Employees will appear here once registered." />
            ) : (
              <div className="space-y-3">
                {employees.slice(0, 5).map((emp) => (
                  <div key={emp.employeeId} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-semibold">
                      {emp.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{emp.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{emp.designation ?? '—'}</p>
                    </div>
                    <Badge variant="info">{emp.department ?? 'N/A'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
