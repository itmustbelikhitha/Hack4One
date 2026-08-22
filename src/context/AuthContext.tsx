import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { mapUser } from '@/lib/mappers';
import type { AppUser, AppUserRow } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: 'employee' | 'admin') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchAppUser(uid: string): Promise<AppUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle() as { data: AppUserRow | null; error: any };

    if (error) {
      console.error('Error fetching app user:', error);
      return null;
    }
    return data ? mapUser(data) : null;
  }

  async function ensureAppUser(authUser: User): Promise<AppUser | null> {
    let appUser = await fetchAppUser(authUser.id);
    if (appUser) return appUser;

    const meta = authUser.user_metadata || {};
    const name = meta.name || (authUser.email ? authUser.email.split('@')[0] : 'User');
    const role = meta.role === 'admin' ? 'admin' : 'employee';

    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert({
        user_id: authUser.id,
        name,
        email: authUser.email || '',
        role,
      })
      .select('*')
      .maybeSingle() as { data: AppUserRow | null; error: any };

    if (insertError) {
      console.error('Failed to auto-create users row:', insertError);
      return null;
    }

    return inserted ? mapUser(inserted) : null;
  }

  useEffect(() => {
    let mounted = true;

    // Check local fallback session first
    const savedLocalUser = localStorage.getItem('dayflow_local_user');
    if (savedLocalUser) {
      try {
        const u = JSON.parse(savedLocalUser);
        setUser(u);
        setSession({ access_token: 'local-token', user: { id: u.userId } } as any);
        setLoading(false);
      } catch (e) {}
    }

    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return;
        setSession(session);
        if (session) {
          ensureAppUser(session.user).then((u) => {
            if (!mounted) return;
            if (u) {
              setUser(u);
              localStorage.setItem('dayflow_local_user', JSON.stringify(u));
            }
            setLoading(false);
          });
        } else if (!savedLocalUser) {
          setLoading(false);
        }
      }).catch(() => {
        if (mounted) setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        setSession(session);
        if (session) {
          (async () => {
            const u = await ensureAppUser(session.user);
            if (!mounted) return;
            if (u) {
              setUser(u);
              localStorage.setItem('dayflow_local_user', JSON.stringify(u));
            }
            setLoading(false);
          })();
        } else if (!savedLocalUser) {
          setUser(null);
          setLoading(false);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } catch (e) {
      if (mounted) setLoading(false);
    }
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        const appUser = await ensureAppUser(data.user);
        if (appUser) {
          setUser(appUser);
          setSession(data.session);
          localStorage.setItem('dayflow_local_user', JSON.stringify(appUser));
          return;
        }
      }
    } catch (err: any) {
      console.warn('Supabase auth unavailable, using local auth fallback:', err);
    }

    // Local fallback for offline / development mode
    const storedUsers = JSON.parse(localStorage.getItem('dayflow_all_users') || '[]');
    let localUser = storedUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!localUser) {
      // Auto-create local user if signing in during dev mode
      const role = email.toLowerCase().includes('admin') ? 'admin' : 'employee';
      const uid = 'usr-' + Math.random().toString(36).substring(2, 9);
      const empId = 'emp-' + Math.random().toString(36).substring(2, 9);
      localUser = {
        userId: uid,
        employeeId: empId,
        name: email.split('@')[0],
        email,
        role,
        createdAt: new Date().toISOString(),
      };
      storedUsers.push(localUser);
      localStorage.setItem('dayflow_all_users', JSON.stringify(storedUsers));
    }

    setUser(localUser);
    setSession({ access_token: 'local-session-token', user: { id: localUser.userId } } as any);
    localStorage.setItem('dayflow_local_user', JSON.stringify(localUser));
  }

  async function signUp(email: string, password: string, name: string, role: 'employee' | 'admin') {
    let appUser: AppUser | null = null;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } },
      });

      if (!error && data.user) {
        const { error: profileError } = await supabase.from('users').insert({
          user_id: data.user.id,
          name,
          email,
          role,
        });
        if (!profileError) {
          appUser = await fetchAppUser(data.user.id);
        }
      }
    } catch (err: any) {
      console.warn('Supabase sign-up unavailable, using local fallback:', err);
    }

    if (!appUser) {
      // Local fallback
      const uid = 'usr-' + Math.random().toString(36).substring(2, 9);
      const empId = 'emp-' + Math.random().toString(36).substring(2, 9);
      appUser = {
        userId: uid,
        employeeId: empId,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      };

      const storedUsers = JSON.parse(localStorage.getItem('dayflow_all_users') || '[]');
      storedUsers.push(appUser);
      localStorage.setItem('dayflow_all_users', JSON.stringify(storedUsers));

      // Auto-create local employee profile
      const localEmployees = JSON.parse(localStorage.getItem('dayflow_employees') || '[]');
      localEmployees.push({
        employeeId: empId,
        userId: uid,
        fullName: name,
        email,
        phone: '123-456-7890',
        address: '123 Tech Park',
        department: role === 'admin' ? 'Management' : 'Engineering',
        designation: role === 'admin' ? 'System Administrator' : 'Software Engineer',
        joiningDate: new Date().toISOString().split('T')[0],
        profilePicture: null,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('dayflow_employees', JSON.stringify(localEmployees));
    }

    setUser(appUser);
    setSession({ access_token: 'local-session-token', user: { id: appUser.userId } } as any);
    localStorage.setItem('dayflow_local_user', JSON.stringify(appUser));
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('dayflow_local_user');
    setUser(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
