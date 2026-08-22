import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, ArrowUpCircle, ArrowDownCircle, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Spinner, EmptyState } from '@/components/ui';
import { getEmployeeByUserId, getPayrollByEmployee } from '@/lib/api';
import type { Employee, Payroll } from '@/types';

export function EmployeePayroll() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;
    (async () => {
      try {
        const emp = await getEmployeeByUserId(user.userId);
        setEmployee(emp);
        if (emp) {
          const pay = await getPayrollByEmployee(emp.employeeId);
          setPayroll(pay);
        }
      } catch (err) {
        console.error('Payroll load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.userId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  const latest = payroll[0];

  return (
    <div>
      <PageHeader title="Payroll" subtitle="Your salary and payment details" />

      {latest ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-5">
            <div className="w-11 h-11 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
              <DollarSign size={22} />
            </div>
            <p className="text-sm text-slate-500 mb-1">Basic Salary</p>
            <p className="text-xl font-bold text-slate-800">${latest.basicSalary.toLocaleString()}</p>
          </Card>
          <Card className="p-5">
            <div className="w-11 h-11 rounded-lg bg-green-50 text-green-700 flex items-center justify-center mb-3">
              <ArrowUpCircle size={22} />
            </div>
            <p className="text-sm text-slate-500 mb-1">Allowances</p>
            <p className="text-xl font-bold text-green-700">${latest.allowances.toLocaleString()}</p>
          </Card>
          <Card className="p-5">
            <div className="w-11 h-11 rounded-lg bg-red-50 text-red-700 flex items-center justify-center mb-3">
              <ArrowDownCircle size={22} />
            </div>
            <p className="text-sm text-slate-500 mb-1">Deductions</p>
            <p className="text-xl font-bold text-red-700">${latest.deductions.toLocaleString()}</p>
          </Card>
          <Card className="p-5 bg-slate-900 text-white border-slate-900">
            <div className="w-11 h-11 rounded-lg bg-teal-600 text-white flex items-center justify-center mb-3">
              <TrendingUp size={22} />
            </div>
            <p className="text-sm text-slate-400 mb-1">Net Salary</p>
            <p className="text-2xl font-bold">${latest.netSalary.toLocaleString()}</p>
          </Card>
        </div>
      ) : (
        <Card className="p-6 mb-6">
          <EmptyState icon={<Wallet size={40} />} title="No payroll records" description="Your salary details will appear here once set by an admin." />
        </Card>
      )}

      <Card>
        <CardHeader title="Payroll History" subtitle={`${payroll.length} records`} />
        <div className="p-4">
          {payroll.length === 0 ? (
            <EmptyState icon={<Wallet size={40} />} title="No payroll history" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2.5 px-3 font-medium">Effective From</th>
                    <th className="py-2.5 px-3 font-medium">Basic</th>
                    <th className="py-2.5 px-3 font-medium">Allowances</th>
                    <th className="py-2.5 px-3 font-medium">Deductions</th>
                    <th className="py-2.5 px-3 font-medium">Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll.map((p) => (
                    <tr key={p.payrollId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-3 text-slate-700">{p.effectiveFrom}</td>
                      <td className="py-3 px-3 text-slate-600">${p.basicSalary.toLocaleString()}</td>
                      <td className="py-3 px-3 text-green-600">${p.allowances.toLocaleString()}</td>
                      <td className="py-3 px-3 text-red-600">${p.deductions.toLocaleString()}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">${p.netSalary.toLocaleString()}</td>
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

export const PayrollPage = EmployeePayroll;
export const EmployeePayrollPage = EmployeePayroll;
export default EmployeePayroll;
