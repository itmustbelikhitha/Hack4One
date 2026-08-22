// ============================================================
// Dayflow HRMS — Auth Middleware
// ============================================================
// Verifies the JWT sent by the frontend (Supabase access token)
// and loads the matching app-level user row from the `users` table.
// Attaches `req.user` with { user_id, employee_id, role, name, email }.
// ============================================================

import { supabase } from './supabaseClient.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }

  const token = header.replace('Bearer ', '');

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const { data: appUser, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (profileError || !appUser) {
    return res.status(403).json({ error: 'User profile not found.' });
  }

  req.user = appUser;
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}
