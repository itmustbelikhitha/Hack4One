// ============================================================
// Dayflow HRMS — Leave Routes
// ============================================================
// POST /api/leaves                  — create a leave request
// GET  /api/leaves/:employee_id      — get one employee's leaves
// GET  /api/leaves                   — get all leaves (admin)
// PUT  /api/leaves/:leave_id/approve — approve a leave (admin)
// PUT  /api/leaves/:leave_id/reject  — reject a leave (admin)
// ============================================================

import { Router } from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Helper
async function getEmployeeIdForUser(userId) {
  const { data, error } = await supabase
    .from('employees')
    .select('employee_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data.employee_id;
}

// POST /api/leaves
router.post('/', requireAuth, async (req, res) => {
  try {
    const { leave_type, start_date, end_date, remarks } = req.body;

    if (!leave_type || !start_date || !end_date) {
      return res.status(400).json({ error: 'leave_type, start_date, and end_date are required.' });
    }

    if (!['Paid', 'Sick', 'Unpaid'].includes(leave_type)) {
      return res.status(400).json({ error: 'leave_type must be Paid, Sick, or Unpaid.' });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'start_date cannot be after end_date.' });
    }

    const employeeId = await getEmployeeIdForUser(req.user.user_id);
    if (!employeeId) {
      return res.status(404).json({ error: 'Employee profile not found.' });
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        employee_id: employeeId,
        leave_type,
        start_date,
        end_date,
        remarks: remarks || null,
        status: 'Pending',
      })
      .select('*')
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/leaves — admin only
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/leaves/:employee_id
router.get('/:employee_id', requireAuth, async (req, res) => {
  try {
    const { employee_id } = req.params;

    if (req.user.role !== 'admin') {
      const empId = await getEmployeeIdForUser(req.user.user_id);
      if (empId !== employee_id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employee_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/leaves/:leave_id/approve — admin only
router.put('/:leave_id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { leave_id } = req.params;
    const { admin_comment } = req.body || {};

    const { data, error } = await supabase
      .from('leave_requests')
      .update({ status: 'Approved', admin_comment: admin_comment !== undefined ? admin_comment : 'Approved' })
      .eq('leave_id', leave_id)
      .select('*')
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Leave request not found.' });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/leaves/:leave_id/reject — admin only
router.put('/:leave_id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { leave_id } = req.params;
    const { admin_comment } = req.body || {};

    const { data, error } = await supabase
      .from('leave_requests')
      .update({ status: 'Rejected', admin_comment: admin_comment !== undefined ? admin_comment : 'Rejected' })
      .eq('leave_id', leave_id)
      .select('*')
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Leave request not found.' });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
