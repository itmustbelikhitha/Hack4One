import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard, Users, Clock, CalendarDays, Wallet, UserCircle,
  LogOut, Menu, X, Building2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link, useRouter } from '@/router/Router';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const employeeNav: NavItem[] = [
  { label: 'Dashboard', path: '/employee/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'My Profile', path: '/employee/profile', icon: <UserCircle size={20} /> },
  { label: 'Attendance', path: '/employee/attendance', icon: <Clock size={20} /> },
  { label: 'Apply Leave', path: '/employee/leave', icon: <CalendarDays size={20} /> },
  { label: 'Payroll', path: '/employee/payroll', icon: <Wallet size={20} /> },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Employees', path: '/admin/employees', icon: <Users size={20} /> },
  { label: 'Attendance', path: '/admin/attendance', icon: <Clock size={20} /> },
  { label: 'Leave Requests', path: '/admin/leaves', icon: <CalendarDays size={20} /> },
  { label: 'Payroll', path: '/admin/payroll', icon: <Wallet size={20} /> },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { path, navigate } = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = user?.role === 'admin' ? adminNav : employeeNav;
  const isAdmin = user?.role === 'admin';

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
            <Building2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">Dayflow</h1>
            <p className="text-slate-400 text-xs mt-0.5">HRMS</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = path === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info + sign out */}
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${isAdmin ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">Dayflow</span>
          </div>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
