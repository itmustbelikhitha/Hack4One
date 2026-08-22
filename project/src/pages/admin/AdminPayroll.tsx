import { useEffect, useState } from 'react';
import { Wallet, Save, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Spinner, EmptyState, Button, Input } from '@/components/ui';
import { getAllPayroll, getEmployees, updatePayroll } from '@/lib/api';
import type { Payroll, Employee } from '@/types';

export function AdminPayroll() {
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmp, setEditingEmp] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ basicSalary: '', allowances: '', deductions: '', effectiveFrom: '' });

  async function load() {
    try {
      const [pay, emps] = await Promise.all([getAllPayroll(), getEmployees()]);
      setPayroll(pay);
      setEmployees(emps);
    } catch (err) {
      console.error('Payroll load error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startEdit(emp: Employee) {
    const existing = payroll.find((p) => p.employeeId === emp.employeeId);
    setEditingEmp(emp.employeeId);
    setForm({
      basicSalary: existing ? String(existing.basicSalary) : '',
      allowances: existing ? String(existing.allowances) : '',
      deductions: existing ? String(existing.deductions) : '',
      effectiveFrom: existing ? existing.effectiveFrom : new Date().toISOString().split('T')[0],
    });
  }

  async function handleSave(employeeId: string) {
    setSaving(true);
    try {
      await updatePayroll(employeeId, {
        basicSalary: Number(form.basicSalary) || 0,
        allowances: Number(form.allowances) || 0,
        deductions: Number(form.deductions) || 0,
        effectiveFrom: form.effectiveFrom,
      });
      setEditingEmp(null);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to update payroll.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader title="Payroll Management" subtitle="Manage salary details for all employees" />

      <Card>
        <CardHeader title="Employee Payroll" subtitle={`${employees.length} employees`} />
        <div className="p-4">
          {employees.length === 0 ? (
            <EmptyState icon={<Wallet size={40} />} title="No employees" description="Add employees to manage their payroll." />
          ) : (
            <div className="space-y-4">
              {employees.map((emp) => {
                const pay = payroll.filter((p) => p.employeeId === emp.employeeId);
                const latest = pay[0];
                const isEditing = editingEmp === emp.employeeId;

                return (
                  <div key={emp.employeeId} className="p-4 rounded-lg border border-slate-200">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-semibold">
                          {emp.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{emp.fullName}</p>
                          <p className="text-xs text-slate-500">{emp.designation ?? '—'} · {emp.department ?? 'N/A'}</p>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 lg:max-w-2xl">
                          <Input label="Basic" type="number" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} placeholder="0" />
                          <Input label="Allowances" type="number" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} placeholder="0" />
                          <Input label="Deductions" type="number" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} placeholder="0" />
                          <Input label="Effective" type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
                          <div className="col-span-2 sm:col-span-4 flex gap-2">
                            <Button size="sm" onClick={() => handleSave(emp.employeeId)} disabled={saving}>
                              {saving ? <Spinner size="sm" /> : <><Save size={16} className="mr-1" /> Save</>}
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditingEmp(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-6">
                          {latest ? (
                            <>
                              <div className="text-right">
                                <p className="text-xs text-slate-500">Net Salary</p>
                                <p className="text-lg font-bold text-slate-800">${latest.netSalary.toLocaleString()}</p>
                              </div>
                              <Button size="sm" variant="secondary" onClick={() => startEdit(emp)}>Edit</Button>
                            </>
                          ) : (
                            <>
                              <span className="text-sm text-slate-400">Not set</span>
                              <Button size="sm" onClick={() => startEdit(emp)}>Set Salary</Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
