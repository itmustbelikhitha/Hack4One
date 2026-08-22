import { useEffect, useState } from 'react';
import { Clock, CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Spinner, Badge, EmptyState } from '@/components/ui';
import { getAllAttendance, getEmployees } from '@/lib/api';
import type { Attendance, Employee } from '@/types';

export function AdminAttendance() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [att, emps] = await Promise.all([getAllAttendance(), getEmployees()]);
        setAttendance(att);
        setEmployees(emps);
      } catch (err) {
        console.error('Attendance load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayCount = attendance.filter((a) => a.attendanceDate === today).length;
  const presentCount = attendance.filter((a) => a.attendanceDate === today && a.status === 'Present').length;

  return (
    <div>
      <PageHeader title="Attendance" subtitle="View all employee attendance records" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
            <CalendarDays size={22} />
          </div>
          <p className="text-sm text-slate-500 mb-1">Today's Records</p>
          <p className="text-xl font-bold text-slate-800">{todayCount}</p>
        </Card>
        <Card className="p-5">
          <div className="w-11 h-11 rounded-lg bg-green-50 text-green-700 flex items-center justify-center mb-3">
            <Clock size={22} />
          </div>
          <p className="text-sm text-slate-500 mb-1">Present Today</p>
          <p className="text-xl font-bold text-slate-800">{presentCount}</p>
        </Card>
        <Card className="p-5">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
            <CalendarDays size={22} />
          </div>
          <p className="text-sm text-slate-500 mb-1">Total Records</p>
          <p className="text-xl font-bold text-slate-800">{attendance.length}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="All Attendance Records" subtitle={`${attendance.length} records`} />
        <div className="p-4">
          {attendance.length === 0 ? (
            <EmptyState icon={<Clock size={40} />} title="No attendance records" description="Attendance records will appear here once employees check in." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2.5 px-3 font-medium">Employee</th>
                    <th className="py-2.5 px-3 font-medium">Date</th>
                    <th className="py-2.5 px-3 font-medium">Check In</th>
                    <th className="py-2.5 px-3 font-medium">Check Out</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((att) => {
                    const emp = employees.find((e) => e.employeeId === att.employeeId);
                    return (
                      <tr key={att.attendanceId} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-3 px-3 text-slate-700 font-medium">{emp?.fullName ?? 'Unknown'}</td>
                        <td className="py-3 px-3 text-slate-600">{att.attendanceDate}</td>
                        <td className="py-3 px-3 text-slate-600">{att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : '—'}</td>
                        <td className="py-3 px-3 text-slate-600">{att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : '—'}</td>
                        <td className="py-3 px-3">
                          <Badge variant={
                            att.status === 'Present' ? 'success' :
                            att.status === 'Absent' ? 'error' :
                            att.status === 'Leave' ? 'info' : 'warning'
                          }>
                            {att.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
