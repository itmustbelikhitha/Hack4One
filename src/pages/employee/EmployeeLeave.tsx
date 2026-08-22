import { useEffect, useState } from 'react';
import { CalendarDays, Plus, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Button, Spinner, Badge, EmptyState, Select, Input } from '@/components/ui';
import { getEmployeeByUserId, getLeavesByEmployee, createLeaveRequest } from '@/lib/api';
import type { Employee, LeaveRequest } from '@/types';

export function EmployeeLeave() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [leaveType, setLeaveType] = useState('Sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');

  async function load() {
    if (!user?.userId) return;
    try {
      const emp = await getEmployeeByUserId(user.userId);
      setEmployee(emp);
      if (emp) {
        const lv = await getLeavesByEmployee(emp.employeeId);
        setLeaves(lv);
      }
    } catch (err) {
      console.error('Leave load error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [user?.userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employee || !startDate || !endDate) return;
    setSubmitting(true);
    try {
      await createLeaveRequest(employee.employeeId, leaveType, startDate, endDate, remarks);
      setShowForm(false);
      setStartDate('');
      setEndDate('');
      setRemarks('');
      setLeaveType('Sick');
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Leave Requests"
        subtitle="Apply for leave and track your requests"
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X size={18} className="mr-2" /> Cancel</> : <><Plus size={18} className="mr-2" /> Apply for Leave</>}
          </Button>
        }
      />

      {showForm && employee && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Leave Type"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              options={[
                { value: 'Sick', label: 'Sick Leave' },
                { value: 'Paid', label: 'Paid Leave' },
                { value: 'Unpaid', label: 'Unpaid Leave' },
              ]}
              required
            />
            <div />
            <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                placeholder="Optional notes for your leave request..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : 'Submit Request'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader title="Your Leave Requests" subtitle={`${leaves.length} total`} />
        <div className="p-4">
          {leaves.length === 0 ? (
            <EmptyState icon={<CalendarDays size={40} />} title="No leave requests" description="Apply for leave using the button above." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2.5 px-3 font-medium">Type</th>
                    <th className="py-2.5 px-3 font-medium">Start</th>
                    <th className="py-2.5 px-3 font-medium">End</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3 font-medium">Admin Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave.leaveId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-3 text-slate-700 font-medium">{leave.leaveType}</td>
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

export const LeavePage = EmployeeLeave;
export const EmployeeLeavePage = EmployeeLeave;
export default EmployeeLeave;
