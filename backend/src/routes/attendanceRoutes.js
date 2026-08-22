// ============================================================
// Dayflow HRMS — Attendance Routes
// ============================================================
// POST /api/attendance/check-in      — employee checks in for today
// POST /api/attendance/check-out     — employee checks out for today
// GET  /api/attendance/:employee_id  — get one employee's attendance
// GET  /api/attendance               — get all attendance (admin)
// ============================================================

import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Helper: get the employee_id for the current user
async function getEmployeeIdForUser(userId, appUser) {
  if (appUser?.employee_id) return appUser.employee_id;
  const { data, error } = await supabase
    .from('employees')
    .select('employee_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.employee_id;
}

// POST /api/attendance/check-in
router.post('/check-in', requireAuth, async (req, res) => {
  try {
    const employeeId = await getEmployeeIdForUser(req.user.user_id, req.user);
    if (!employeeId) {
      return res.status(404).json({ error: 'Employee profile not found.' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Prevent duplicate check-in for today
    const { data: existing, error: existingError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('attendance_date', today)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'Already checked in today.', attendance: existing });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        employee_id: employeeId,
        attendance_date: today,
        check_in: now,
        status: 'Present',
      })
      .select('*')
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json(data);
  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/attendance/check-out
router.post('/check-out', requireAuth, async (req, res) => {
  try {
    const employeeId = await getEmployeeIdForUser(req.user.user_id, req.user);
    if (!employeeId) {
      return res.status(404).json({ error: 'Employee profile not found.' });
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: existing, error: findError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('attendance_date', today)
      .maybeSingle();

    if (findError) return res.status(500).json({ error: findError.message });
    if (!existing) {
      return res.status(404).json({ error: 'No check-in record found for today.' });
    }
    if (existing.check_out) {
      return res.status(409).json({ error: 'Already checked out today.', attendance: existing });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('attendance')
      .update({ check_out: now })
      .eq('attendance_id', existing.attendance_id)
      .select('*')
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
  } catch (err) {
    console.error('Check-out error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/attendance/:employee_id
router.get('/:employee_id', requireAuth, async (req, res) => {
  try {
    const { employee_id } = req.params;

    // Non-admins can only view their own attendance
    if (req.user.role !== 'admin') {
      const empId = await getEmployeeIdForUser(req.user.user_id, req.user);
      if (empId !== employee_id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee_id)
      .order('attendance_date', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
  } catch (err) {
    console.error('Fetch attendance error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/attendance — admin only
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('attendance_date', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
  } catch (err) {
    console.error('Fetch all attendance error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

