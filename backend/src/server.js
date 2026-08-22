// ============================================================
// Dayflow HRMS — Express API Server
// ============================================================
// This is the shared backend for all Dayflow modules.
// It implements the fixed API contract:
//
//   POST /api/auth/login
//   POST /api/auth/register
//   GET  /api/employees
//   GET  /api/employees/:employee_id
//   PUT  /api/employees/:employee_id
//   POST /api/attendance/check-in
//   POST /api/attendance/check-out
//   GET  /api/attendance/:employee_id
//   GET  /api/attendance
//   POST /api/leaves
//   GET  /api/leaves/:employee_id
//   GET  /api/leaves
//   PUT  /api/leaves/:leave_id/approve
//   PUT  /api/leaves/:leave_id/reject
//   GET  /api/payroll/:employee_id
//   GET  /api/payroll
//   PUT  /api/payroll/:employee_id
//
// All routes use the shared Supabase database.
// ============================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'dayflow-api', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Dayflow API server running on http://localhost:${PORT}`);
});
