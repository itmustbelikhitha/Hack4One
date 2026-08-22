import { useEffect, useState } from 'react';
import { Clock, LogIn, LogOut, CalendarDays } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Button, Spinner, Badge, EmptyState } from '@/components/ui';
import { getEmployeeByUserId, getTodayAttendance, checkIn, checkOut, getAttendanceByEmployee } from '@/lib/api';
import type { Employee, Attendance } from '@/types';

export function EmployeeAttendance() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todayAtt, setTodayAtt] = useState<Attendance | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    if (!user?.userId) return;
    try {
      const emp = await getEmployeeByUserId(user.userId);
      setEmployee(emp);
      if (emp) {
        const [today, hist] = await Promise.all([
          getTodayAttendance(emp.employeeId),
          getAttendanceByEmployee(emp.employeeId),
        ]);
        setTodayAtt(today);
        setHistory(hist);
      }
    } catch (err) {
      console.error('Attendance load error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [user?.userId]);

  async function handleCheckIn() {
    if (!employee) return;
    setActionLoading(true);
    try {
      await checkIn(employee.employeeId);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to check in.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    if (!todayAtt) return;
    setActionLoading(true);
    try {
      await checkOut(todayAtt.attendanceId);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to check out.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!employee) {
    return (
      <div>
        <PageHeader title="Attendance" />
        <Card className="p-6">
          <EmptyState
            icon={<Clock size={40} />}
            title="No employee profile found"
            description="Please complete your profile to use attendance."
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Check in and view your attendance history" />

      {/* Check-in card */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${todayAtt ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Today's Status</p>
              <p className="text-lg font-bold text-slate-800">
                {todayAtt ? todayAtt.status : 'Not checked in'}
              </p>
              {todayAtt?.checkIn && (
                <p className="text-xs text-slate-500 mt-0.5">
                  In: {new Date(todayAtt.checkIn).toLocaleTimeString()}
                  {todayAtt.checkOut && ` · Out: ${new Date(todayAtt.checkOut).toLocaleTimeString()}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            {!todayAtt ? (
              <Button onClick={handleCheckIn} disabled={actionLoading} variant="primary">
                {actionLoading ? <Spinner size="sm" /> : <><LogIn size={18} className="mr-2" /> Check In</>}
              </Button>
            ) : !todayAtt.checkOut ? (
              <Button onClick={handleCheckOut} disabled={actionLoading} variant="danger">
                {actionLoading ? <Spinner size="sm" /> : <><LogOut size={18} className="mr-2" /> Check Out</>}
              </Button>
            ) : (
              <Badge variant="success">Completed for today</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* History */}
      <Card>
        <CardHeader title="Attendance History" subtitle={`${history.length} records`} />
        <div className="p-4">
          {history.length === 0 ? (
            <EmptyState icon={<CalendarDays size={40} />} title="No attendance records" description="Your attendance history will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2.5 px-3 font-medium">Date</th>
                    <th className="py-2.5 px-3 font-medium">Check In</th>
                    <th className="py-2.5 px-3 font-medium">Check Out</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((att) => (
                    <tr key={att.attendanceId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-3 text-slate-700">{att.attendanceDate}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
