// ============================================================
// Dayflow HRMS — Payroll Routes
// ============================================================
// GET /api/payroll/:employee_id — get one employee's payroll
// GET /api/payroll             — get all payroll (admin)
// PUT /api/payroll/:employee_id — update/insert payroll (admin)
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

// GET /api/payroll — admin only
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payroll')
      .select('*')
      .order('effective_from', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/payroll/:employee_id
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
      .from('payroll')
      .select('*')
      .eq('employee_id', employee_id)
      .order('effective_from', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/payroll/:employee_id — admin only
// Updates the latest payroll row or inserts a new one if none exists.
router.put('/:employee_id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { basic_salary, allowances, deductions, effective_from } = req.body;

    // Check if a payroll row already exists
    const { data: existing } = await supabase
      .from('payroll')
      .select('*')
      .eq('employee_id', employee_id)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    const basic = basic_salary !== undefined ? Number(basic_salary) : (existing ? Number(existing.basic_salary) : 0);
    const allow = allowances !== undefined ? Number(allowances) : (existing ? Number(existing.allowances) : 0);
    const deduct = deductions !== undefined ? Number(deductions) : (existing ? Number(existing.deductions) : 0);
    const net = basic + allow - deduct;

    const updates = {
      basic_salary: basic,
      allowances: allow,
      deductions: deduct,
      net_salary: net,
    };
    if (effective_from !== undefined) {
      updates.effective_from = effective_from;
    } else if (!existing) {
      updates.effective_from = new Date().toISOString().split('T')[0];
    }

    let result;
    let error;

    if (existing) {
      const res2 = await supabase
        .from('payroll')
        .update(updates)
        .eq('payroll_id', existing.payroll_id)
        .select('*')
        .maybeSingle();
      result = res2.data;
      error = res2.error;
    } else {
      const res2 = await supabase
        .from('payroll')
        .insert({ ...updates, employee_id })
        .select('*')
        .maybeSingle();
      result = res2.data;
      error = res2.error;
    }

    if (error) return res.status(500).json({ error: error.message });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
