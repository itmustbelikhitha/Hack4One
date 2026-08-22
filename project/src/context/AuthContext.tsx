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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session) {
        ensureAppUser(session.user).then((u) => {
          if (!mounted) return;
          setUser(u);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      if (session) {
        (async () => {
          const u = await ensureAppUser(session.user);
          if (!mounted) return;
          setUser(u);
          setLoading(false);
        })();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.user) {
      const appUser = await ensureAppUser(data.user);
      if (!appUser) {
        throw new Error('Login succeeded but your profile could not be loaded. Please contact an administrator.');
      }
      setUser(appUser);
      setSession(data.session);
    }
  }

  async function signUp(email: string, password: string, name: string, role: 'employee' | 'admin') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Sign-up failed: no user returned.');

    const { error: profileError } = await supabase.from('users').insert({
      user_id: data.user.id,
      name,
      email,
      role,
    });
    if (profileError) throw profileError;
  }

  async function signOut() {
    await supabase.auth.signOut();
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
