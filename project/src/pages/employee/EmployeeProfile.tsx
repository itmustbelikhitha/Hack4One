import { useEffect, useState } from 'react';
import { UserCircle, Save, Mail, Phone, MapPin, Briefcase, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Button, Spinner, Input, EmptyState } from '@/components/ui';
import { getEmployeeByUserId, updateEmployee } from '@/lib/api';
import type { Employee } from '@/types';

export function EmployeeProfile() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: '', phone: '', address: '', department: '', designation: '', joiningDate: '',
  });

  useEffect(() => {
    if (!user?.userId) return;
    (async () => {
      try {
        const emp = await getEmployeeByUserId(user.userId);
        setEmployee(emp);
        if (emp) {
          setForm({
            fullName: emp.fullName,
            phone: emp.phone ?? '',
            address: emp.address ?? '',
            department: emp.department ?? '',
            designation: emp.designation ?? '',
            joiningDate: emp.joiningDate ?? '',
          });
        }
      } catch (err) {
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!employee) return;
    setSaving(true);
    try {
      const updated = await updateEmployee(employee.employeeId, {
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
        department: form.department,
        designation: form.designation,
        joiningDate: form.joiningDate,
      });
      setEmployee(updated);
      setEditing(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!employee) {
    return (
      <div>
        <PageHeader title="My Profile" />
        <Card className="p-6">
          <EmptyState
            icon={<UserCircle size={40} />}
            title="No employee profile found"
            description="Your profile will be created when an admin adds you as an employee."
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="View and update your personal information"
        action={
          !editing ? (
            <Button onClick={() => setEditing(true)}>Edit Profile</Button>
          ) : (
            <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
          )
        }
      />

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-2xl font-bold">
            {employee.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{employee.fullName}</h2>
            <p className="text-sm text-slate-500">{employee.designation ?? 'No designation'}</p>
            <p className="text-sm text-teal-600 mt-1">{employee.department ?? 'No department'}</p>
          </div>
        </div>
      </Card>

      {editing ? (
        <Card>
          <CardHeader title="Edit Profile" />
          <form onSubmit={handleSave} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Your address" />
            <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Department" />
            <Input label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Job title" />
            <Input label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner size="sm" /> : <><Save size={18} className="mr-2" /> Save Changes</>}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Personal Information" />
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InfoRow icon={<Mail size={18} />} label="Email" value={employee.email} />
            <InfoRow icon={<Phone size={18} />} label="Phone" value={employee.phone ?? 'Not set'} />
            <InfoRow icon={<MapPin size={18} />} label="Address" value={employee.address ?? 'Not set'} />
            <InfoRow icon={<Briefcase size={18} />} label="Designation" value={employee.designation ?? 'Not set'} />
            <InfoRow icon={<Briefcase size={18} />} label="Department" value={employee.department ?? 'Not set'} />
            <InfoRow icon={<Calendar size={18} />} label="Joining Date" value={employee.joiningDate ?? 'Not set'} />
          </div>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}
