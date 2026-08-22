// ============================================================
// Dayflow HRMS — Auth Routes
// ============================================================
// POST /api/auth/register — create a new user account
// POST /api/auth/login  — sign in with email + password
// ============================================================

import { Router } from 'express';
import { supabase } from '../supabaseClient.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required.' });
    }

    const assignedRole = role === 'admin' ? 'admin' : 'employee';

    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // 2. Insert the app-level user row
    const { error: profileError } = await supabase.from('users').insert({
      user_id: authData.user.id,
      name,
      email,
      role: assignedRole,
    });

    if (profileError) {
      // Best-effort cleanup of the auth user if profile insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Failed to create user profile.' });
    }

    return res.status(201).json({
      message: 'Account created. Please sign in.',
      user: { user_id: authData.user.id, email, name, role: assignedRole },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Fetch the app-level user row for role info
    const { data: appUser, error: profileError } = await supabase
      .from('users')
      .select('user_id, employee_id, name, email, role')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (profileError || !appUser) {
      return res.status(403).json({ error: 'User profile not found.' });
    }

    return res.json({
      message: 'Login successful.',
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      user: appUser,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
