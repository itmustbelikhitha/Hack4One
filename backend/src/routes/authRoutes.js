// ============================================================
// Dayflow HRMS — Auth Routes
// ============================================================
// POST /api/auth/register — create a new user account
// POST /api/auth/login    — sign in with email + password
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
      user_metadata: { name, role: assignedRole },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // 2. Insert the app-level user row
    const { data: userRow, error: profileError } = await supabase
      .from('users')
      .insert({
        user_id: authData.user.id,
        name,
        email,
        role: assignedRole,
      })
      .select('*')
      .maybeSingle();

    if (profileError) {
      // Best-effort cleanup of the auth user if profile insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Failed to create user profile.' });
    }

    // 3. Create the corresponding employee record
    const today = new Date().toISOString().split('T')[0];
    const { data: empRow, error: empError } = await supabase
      .from('employees')
      .insert({
        user_id: authData.user.id,
        full_name: name,
        email,
        joining_date: today,
      })
      .select('*')
      .maybeSingle();

    let employeeId = empRow ? empRow.employee_id : null;
    if (employeeId) {
      await supabase.from('users').update({ employee_id: employeeId }).eq('user_id', authData.user.id);
    }

    return res.status(201).json({
      message: 'Account created successfully.',
      user: {
        user_id: authData.user.id,
        employee_id: employeeId,
        email,
        name,
        role: assignedRole,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
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

    // Fetch the app-level user row for role & employee_id info
    let { data: appUser, error: profileError } = await supabase
      .from('users')
      .select('user_id, employee_id, name, email, role')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (profileError || !appUser) {
      // Auto-recover user profile from auth user metadata if missing
      const meta = data.user.user_metadata || {};
      const name = meta.name || email.split('@')[0];
      const role = meta.role === 'admin' ? 'admin' : 'employee';

      const { data: createdUser } = await supabase
        .from('users')
        .insert({ user_id: data.user.id, name, email, role })
        .select('*')
        .maybeSingle();
      appUser = createdUser;
    }

    if (!appUser) {
      return res.status(403).json({ error: 'User profile not found.' });
    }

    // Ensure employee_id is linked
    if (!appUser.employee_id) {
      let { data: emp } = await supabase
        .from('employees')
        .select('employee_id')
        .eq('user_id', appUser.user_id)
        .maybeSingle();

      if (!emp) {
        const today = new Date().toISOString().split('T')[0];
        const { data: createdEmp } = await supabase
          .from('employees')
          .insert({
            user_id: appUser.user_id,
            full_name: appUser.name,
            email: appUser.email,
            joining_date: today,
          })
          .select('employee_id')
          .maybeSingle();
        emp = createdEmp;
      }

      if (emp) {
        appUser.employee_id = emp.employee_id;
        await supabase.from('users').update({ employee_id: emp.employee_id }).eq('user_id', appUser.user_id);
      }
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
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

