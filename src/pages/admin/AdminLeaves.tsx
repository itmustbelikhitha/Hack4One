import { useEffect, useState } from 'react';
import { CalendarDays, Check, X, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Spinner, Badge, EmptyState, Button } from '@/components/ui';
import { getAllLeaves, getEmployees, approveLeave, rejectLeave } from '@/lib/api';
import type { LeaveRequest, Employee } from '@/types';

export function AdminLeaves() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [comment, setComment] = useState<Record<string, string>>({});

  async function load() {
    try {
      const [lvs, emps] = await Promise.all([getAllLeaves(), getEmployees()]);
      setLeaves(lvs);
      setEmployees(emps);
    } catch (err) {
      console.error('Leaves load error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(leaveId: string) {
    setActionLoading(leaveId);
    try {
      await approveLeave(leaveId, comment[leaveId] ?? 'Approved');
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to approve leave.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(leaveId: string) {
    setActionLoading(leaveId);
    try {
      await rejectLeave(leaveId, comment[leaveId] ?? 'Rejected');
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to reject leave.');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  const pending = leaves.filter((l) => l.status === 'Pending');

  return (
    <div>
      <PageHeader title="Leave Requests" subtitle={`${pending.length} pending approval`} />

      <Card className="mb-6">
        <CardHeader title="Pending Approvals" />
        <div className="p-4">
          {pending.length === 0 ? (
            <EmptyState icon={<CalendarDays size={40} />} title="No pending requests" description="All leave requests have been processed." />
          ) : (
            <div className="space-y-4">
              {pending.map((leave) => {
                const emp = employees.find((e) => e.employeeId === leave.employeeId);
                return (
                  <div key={leave.leaveId} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-semibold">
                          {emp?.fullName.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{emp?.fullName ?? 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{leave.leaveType} Leave · {leave.startDate} → {leave.endDate}</p>
                        </div>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    {leave.remarks && (
                      <p className="text-sm text-slate-600 mb-3 bg-white rounded-lg p-2.5 border border-slate-100">
                        <MessageSquare size={14} className="inline mr-1.5 text-slate-400" />
                        {leave.remarks}
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={comment[leave.leaveId] ?? ''}
                        onChange={(e) => setComment({ ...comment, [leave.leaveId]: e.target.value })}
                        placeholder="Add a comment (optional)..."
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="success" onClick={() => handleApprove(leave.leaveId)} disabled={actionLoading === leave.leaveId}>
                          <Check size={16} className="mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(leave.leaveId)} disabled={actionLoading === leave.leaveId}>
                          <X size={16} className="mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="All Leave Requests" subtitle={`${leaves.length} total`} />
        <div className="p-4">
          {leaves.length === 0 ? (
            <EmptyState icon={<CalendarDays size={40} />} title="No leave requests" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2.5 px-3 font-medium">Employee</th>
                    <th className="py-2.5 px-3 font-medium">Type</th>
                    <th className="py-2.5 px-3 font-medium">Start</th>
                    <th className="py-2.5 px-3 font-medium">End</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 font-medium">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => {
                    const emp = employees.find((e) => e.employeeId === leave.employeeId);
                    return (
                      <tr key={leave.leaveId} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-3 px-3 text-slate-700 font-medium">{emp?.fullName ?? 'Unknown'}</td>
                        <td className="py-3 px-3 text-slate-600">{leave.leaveType}</td>
                        <td className="py-3 px-3 text-slate-600">{leave.startDate}</td>
                        <td className="py-3 px-3 text-slate-600">{leave.endDate}</td>
                        <td className="py-3 px-3">
                          <Badge variant={
                            leave.status === 'Approved' ? 'success' :
                            leave.status === 'Rejected' ? 'error' : 'warning'
                          }>
                            {leave.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{leave.adminComment ?? '—'}</td>
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
