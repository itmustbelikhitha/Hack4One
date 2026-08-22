// ============================================================
// Dayflow HRMS — Employee Routes
// ============================================================
// GET  /api/employees             — list all employees (admin)
// GET  /api/employees/:employee_id — get one employee
// PUT  /api/employees/:employee_id — update an employee
// ============================================================

import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/employees — admin only
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/employees/:employee_id
router.get('/:employee_id', requireAuth, async (req, res) => {
  try {
    const { employee_id } = req.params;

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employee_id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Employee not found.' });

    // Non-admins can only view their own profile
    if (req.user.role !== 'admin' && data.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/employees/:employee_id
router.put('/:employee_id', requireAuth, async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { full_name, phone, address, department, designation, joining_date, profile_picture } = req.body;

    // Build the update payload (only permitted fields)
    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (profile_picture !== undefined) updates.profile_picture = profile_picture;

    // Only admins can modify organization fields (department, designation, joining_date)
    if (req.user.role === 'admin') {
      if (department !== undefined) updates.department = department;
      if (designation !== undefined) updates.designation = designation;
      if (joining_date !== undefined) updates.joining_date = joining_date;
    }

    // Verify ownership or admin
    const { data: emp } = await supabase
      .from('employees')
      .select('user_id')
      .eq('employee_id', employee_id)
      .maybeSingle();

    if (!emp) return res.status(404).json({ error: 'Employee not found.' });

    if (req.user.role !== 'admin' && emp.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('employee_id', employee_id)
      .select('*')
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
