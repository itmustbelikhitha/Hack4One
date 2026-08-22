import { useEffect, useState } from 'react';
import {
  Clock, CalendarDays, Users, Search, Filter,
  CheckCircle2, AlertCircle, ArrowUpDown, Download
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Spinner, Badge, EmptyState, Button } from '@/components/ui';
import { getAllAttendance, getEmployees } from '@/lib/api';
import type { Attendance, Employee, AttendanceStatus } from '@/types';

export function AdminAttendance() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    (async () => {
      try {
        const [att, emps] = await Promise.all([
          getAllAttendance().catch(() => []),
          getEmployees().catch(() => []),
        ]);
        setAttendance(att || []);
        setEmployees(emps || []);
      } catch (err) {
        console.error('Attendance load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function calculateDuration(checkInStr: string | null, checkOutStr: string | null): string {
    if (!checkInStr) return '—';
    if (!checkOutStr) return 'Active';
    const start = new Date(checkInStr).getTime();
    const end = new Date(checkOutStr).getTime();
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

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendance.filter((a) => a.attendanceDate === today);
  const presentToday = todayRecords.filter((a) => a.status === 'Present').length;
  const attendanceRate = employees.length > 0 ? Math.round((presentToday / employees.length) * 100) : 0;

  // Filter attendance records
  const filteredRecords = attendance.filter((att) => {
    const emp = employees.find((e) => e.employeeId === att.employeeId);
    const empName = emp?.fullName?.toLowerCase() || '';
    const empEmail = emp?.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = !query || empName.includes(query) || empEmail.includes(query) || att.employeeId.toLowerCase().includes(query);
    const matchesDate = !selectedDate || att.attendanceDate === selectedDate;
    const matchesStatus = statusFilter === 'All' || att.status === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Management"
        subtitle="Monitor workforce daily attendance, working hours, and presence records"
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <CalendarDays size={22} />
            </div>
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Today's Check-ins</p>
          <p className="text-2xl font-bold text-slate-800">{todayRecords.length}</p>
          <p className="text-xs text-slate-400 mt-1">Date: {today}</p>
        </Card>

        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Present Today</p>
          <p className="text-2xl font-bold text-slate-800">{presentToday} / {employees.length}</p>
          <p className="text-xs text-green-600 font-medium mt-1">{attendanceRate}% attendance rate</p>
        </Card>

        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock size={22} />
            </div>
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Total Logs Stored</p>
          <p className="text-2xl font-bold text-slate-800">{attendance.length}</p>
          <p className="text-xs text-slate-400 mt-1">Across all employees</p>
        </Card>

        <Card className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users size={22} />
            </div>
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Total Staff</p>
          <p className="text-2xl font-bold text-slate-800">{employees.length}</p>
          <p className="text-xs text-slate-400 mt-1">Registered staff members</p>
        </Card>
      </div>

      {/* Main Attendance Table */}
      <Card>
        <CardHeader
          title="All Attendance Records"
          subtitle={`Displaying ${filteredRecords.length} records`}
        />

        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-3 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Half-day">Half-day</option>
              <option value="Leave">Leave</option>
            </select>

            {(searchQuery || selectedDate || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDate('');
                  setStatusFilter('All');
                }}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="p-4">
          {filteredRecords.length === 0 ? (
            <EmptyState
              icon={<Clock size={40} />}
              title="No attendance entries found"
              description="No attendance logs match your current filter criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-3 px-3.5 font-semibold">Employee</th>
                    <th className="py-3 px-3.5 font-semibold">Date</th>
                    <th className="py-3 px-3.5 font-semibold">Check In</th>
                    <th className="py-3 px-3.5 font-semibold">Check Out</th>
                    <th className="py-3 px-3.5 font-semibold">Duration</th>
                    <th className="py-3 px-3.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((att) => {
                    const emp = employees.find((e) => e.employeeId === att.employeeId);
                    return (
                      <tr key={att.attendanceId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                              {emp?.fullName?.charAt(0).toUpperCase() || 'E'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                                {emp?.fullName ?? 'Unknown Employee'}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {att.employeeId.slice(0, 8)}... · {emp?.department || 'General'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 text-slate-700 font-medium whitespace-nowrap">
                          {att.attendanceDate}
                        </td>
                        <td className="py-3.5 px-3.5 text-slate-600 whitespace-nowrap">
                          {att.checkIn
                            ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="py-3.5 px-3.5 text-slate-600 whitespace-nowrap">
                          {att.checkOut
                            ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="py-3.5 px-3.5 text-slate-600 font-mono text-xs whitespace-nowrap">
                          {calculateDuration(att.checkIn, att.checkOut)}
                        </td>
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
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

