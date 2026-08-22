import { useEffect, useState } from 'react';
import { Users, Search, UserCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, Spinner, Badge, EmptyState } from '@/components/ui';
import { getEmployees } from '@/lib/api';
import type { Employee } from '@/types';

export function AdminEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const emps = await getEmployees();
        setEmployees(emps);
      } catch (err) {
        console.error('Employees load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.department ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader title="Employees" subtitle={`${employees.length} total employees`} />

      <Card className="mb-6 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>
      </Card>

      <Card>
        <div className="p-4">
          {filtered.length === 0 ? (
            <EmptyState icon={<Users size={40} />} title="No employees found" description="Employees will appear here once they register and create profiles." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2.5 px-3 font-medium">Employee</th>
                    <th className="py-2.5 px-3 font-medium">Email</th>
                    <th className="py-2.5 px-3 font-medium">Department</th>
                    <th className="py-2.5 px-3 font-medium">Designation</th>
                    <th className="py-2.5 px-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => (
                    <tr key={emp.employeeId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-semibold">
                            {emp.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-700">{emp.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{emp.email}</td>
                      <td className="py-3 px-3"><Badge variant="info">{emp.department ?? 'N/A'}</Badge></td>
                      <td className="py-3 px-3 text-slate-600">{emp.designation ?? '—'}</td>
                      <td className="py-3 px-3 text-slate-500">{emp.joiningDate ?? '—'}</td>
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
