import { useEffect, useState } from 'react';
import {
  Clock, LogIn, LogOut, CalendarDays, CheckCircle2,
  AlertCircle, Search, Timer, ArrowUpRight, History
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Button, Spinner, Badge, EmptyState } from '@/components/ui';
import { getEmployeeByUserId, getTodayAttendance, checkIn, checkOut, getAttendanceByEmployee } from '@/lib/api';
import type { Employee, Attendance, AttendanceStatus } from '@/types';

export function EmployeeAttendance() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todayAtt, setTodayAtt] = useState<Attendance | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchDate, setSearchDate] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function load() {
    if (!user?.userId) return;
    try {
      const emp = await getEmployeeByUserId(user.userId);
      setEmployee(emp);
      const empId = emp?.employeeId || user.employeeId;
      if (empId) {
        const [today, hist] = await Promise.all([
          getTodayAttendance(empId).catch(() => null),
          getAttendanceByEmployee(empId).catch(() => []),
        ]);
        setTodayAtt(today);
        setHistory(hist || []);
      }
    } catch (err) {
      console.error('Attendance load error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.userId, user?.employeeId]);

  async function handleCheckIn() {
    const empId = employee?.employeeId || user?.employeeId;
    if (!empId) {
      setFeedback({ type: 'error', message: 'Employee profile not identified. Please complete profile.' });
      return;
    }
    setActionLoading(true);
    setFeedback(null);
    try {
      await checkIn(empId);
      setFeedback({ type: 'success', message: 'Successfully checked in! Have a productive workday.' });
      await load();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to check in.' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    if (!todayAtt) {
      setFeedback({ type: 'error', message: 'No check-in record found for today.' });
      return;
    }
    setActionLoading(true);
    setFeedback(null);
    try {
      await checkOut(todayAtt.attendanceId);
      setFeedback({ type: 'success', message: 'Successfully checked out! Work hours logged.' });
      await load();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to check out.' });
    } finally {
      setActionLoading(false);
    }
  }

  function calculateDuration(checkInStr: string | null, checkOutStr: string | null): string {
    if (!checkInStr) return '—';
    const start = new Date(checkInStr).getTime();
    const end = checkOutStr ? new Date(checkOutStr).getTime() : currentTime.getTime();
    const diffMs = end - start;
    if (diffMs <= 0) return '0m';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const effectiveEmpId = employee?.employeeId || user?.employeeId;

  if (!effectiveEmpId) {
    return (
      <div>
        <PageHeader title="Attendance" subtitle="Track your daily work hours" />
        <Card className="p-8">
          <EmptyState
            icon={<Clock size={44} />}
            title="Employee Profile Missing"
            description="Your user account is not yet linked to an employee profile. Please contact HR or visit the Profile page."
          />
        </Card>
      </div>
    );
  }

  const filteredHistory = history.filter((att) => {
    if (!searchDate) return true;
    return att.attendanceDate.includes(searchDate);
  });

  const totalDaysPresent = history.filter((h) => h.status === 'Present').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Time Tracking"
        subtitle="Manage daily check-in, check-out, and review past attendance logs"
      />

      {feedback && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border animate-[fadeIn_0.2s_ease-out] ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium">{feedback.message}</div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-60 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Check-In / Check-Out Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Clock & Punch Card */}
        <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-white to-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                <Timer size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Workstation Clock</p>
                <p className="text-2xl font-bold text-slate-800 font-mono tracking-tight">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-400">Today's Date</p>
              <p className="text-sm font-semibold text-slate-700">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5">
            <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/60">
              <p className="text-xs text-slate-500 font-medium">Check In</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">
                {todayAtt?.checkIn
                  ? new Date(todayAtt.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </p>
              <span className="text-[11px] text-slate-400">
                {todayAtt?.checkIn ? 'Logged on time' : 'Awaiting punch'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/60">
              <p className="text-xs text-slate-500 font-medium">Check Out</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">
                {todayAtt?.checkOut
                  ? new Date(todayAtt.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </p>
              <span className="text-[11px] text-slate-400">
                {todayAtt?.checkOut ? 'Shift completed' : todayAtt?.checkIn ? 'In progress' : 'Not started'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/60">
              <p className="text-xs text-slate-500 font-medium">Logged Hours</p>
              <p className="text-lg font-bold text-teal-700 mt-0.5">
                {todayAtt?.checkIn ? calculateDuration(todayAtt.checkIn, todayAtt.checkOut) : '0h 0m'}
              </p>
              <span className="text-[11px] text-slate-400">
                {todayAtt?.checkOut ? 'Total for today' : todayAtt?.checkIn ? 'Active timer' : 'No activity'}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Current Status:</span>
              <Badge variant={
                todayAtt?.status === 'Present' ? 'success' :
                todayAtt?.status === 'Leave' ? 'info' : 'warning'
              }>
                {todayAtt ? todayAtt.status : 'Not checked in'}
              </Badge>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!todayAtt ? (
                <Button
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  variant="primary"
                  className="w-full sm:w-auto px-6 py-2.5 shadow-md shadow-teal-600/30"
                >
                  {actionLoading ? <Spinner size="sm" /> : <><LogIn size={18} className="mr-2" /> Check In Now</>}
                </Button>
              ) : !todayAtt.checkOut ? (
                <Button
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  variant="danger"
                  className="w-full sm:w-auto px-6 py-2.5 shadow-md shadow-red-600/30"
                >
                  {actionLoading ? <Spinner size="sm" /> : <><LogOut size={18} className="mr-2" /> Check Out</>}
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-sm font-semibold text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                  <CheckCircle2 size={18} />
                  <span>Attendance completed for today</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Attendance Summary Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Monthly Summary</h3>
            <p className="text-xs text-slate-500 mb-4">Your attendance record metrics</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-sm text-slate-600">Total Logs Recorded</span>
                <span className="text-base font-bold text-slate-800">{history.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50 border border-teal-100 text-teal-900">
                <span className="text-sm font-medium">Days Present</span>
                <span className="text-base font-bold">{totalDaysPresent}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-sm text-slate-600">Employee ID</span>
                <span className="text-xs font-mono font-bold text-slate-700 truncate max-w-[120px]">{effectiveEmpId}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Check-in records are automatically timestamped and verified by the server.
            </p>
          </div>
        </Card>
      </div>

      {/* Attendance History Section */}
      <Card>
        <CardHeader
          title="Attendance History"
          subtitle={`Showing ${filteredHistory.length} of ${history.length} recorded workdays`}
          action={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              {searchDate && (
                <button
                  onClick={() => setSearchDate('')}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Clear
                </button>
              )}
            </div>
          }
        />

        <div className="p-4">
          {filteredHistory.length === 0 ? (
            <EmptyState
              icon={<History size={40} />}
              title="No attendance records found"
              description={searchDate ? "No attendance found for the selected date." : "Your daily attendance logs will appear here once you check in."}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-3 px-3 font-semibold">Date</th>
                    <th className="py-3 px-3 font-semibold">Check In</th>
                    <th className="py-3 px-3 font-semibold">Check Out</th>
                    <th className="py-3 px-3 font-semibold">Duration</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((att) => (
                    <tr key={att.attendanceId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3 font-medium text-slate-800">
                        {att.attendanceDate}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-mono text-xs">
                        {calculateDuration(att.checkIn, att.checkOut)}
                      </td>
                      <td className="py-3.5 px-3">
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

