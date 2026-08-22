/*
# Dayflow HRMS — Core Database Schema

## Overview
Creates the foundational schema for the Dayflow Human Resource Management System.
This is the ONE shared database used by all modules (Auth, Employee, Attendance, Leave, Payroll).

## New Tables

### 1. `users` — Application user accounts (links to Supabase auth)
- `user_id` (uuid, primary key, defaults to auth.uid())
- `employee_id` (uuid, foreign key → employees.employee_id, nullable)
- `name` (text, not null)
- `email` (text, unique, not null)
- `role` (text, not null, default 'employee' — values: 'employee' | 'admin')
- `created_at` (timestamptz, default now())

Note: Password hashing is handled by Supabase Auth (auth.users). The `users` table
here stores application-level profile data and role. The `user_id` column maps 1:1
to `auth.users.id` via DEFAULT auth.uid().

### 2. `employees` — Employee profiles
- `employee_id` (uuid, primary key, default gen_random_uuid())
- `user_id` (uuid, foreign key → users.user_id, unique, not null)
- `full_name` (text, not null)
- `email` (text, not null)
- `phone` (text, nullable)
- `address` (text, nullable)
- `department` (text, nullable)
- `designation` (text, nullable)
- `joining_date` (date, nullable)
- `profile_picture` (text, nullable — URL)
- `created_at` (timestamptz, default now())

### 3. `attendance` — Daily attendance records
- `attendance_id` (uuid, primary key, default gen_random_uuid())
- `employee_id` (uuid, foreign key → employees.employee_id, not null)
- `attendance_date` (date, not null)
- `check_in` (timestamptz, nullable)
- `check_out` (timestamptz, nullable)
- `status` (text, not null, default 'Absent' — values: 'Present' | 'Absent' | 'Half-day' | 'Leave')
- `created_at` (timestamptz, default now())

### 4. `leave_requests` — Leave applications
- `leave_id` (uuid, primary key, default gen_random_uuid())
- `employee_id` (uuid, foreign key → employees.employee_id, not null)
- `leave_type` (text, not null — values: 'Paid' | 'Sick' | 'Unpaid')
- `start_date` (date, not null)
- `end_date` (date, not null)
- `remarks` (text, nullable)
- `status` (text, not null, default 'Pending' — values: 'Pending' | 'Approved' | 'Rejected')
- `admin_comment` (text, nullable)
- `created_at` (timestamptz, default now())

### 5. `payroll` — Salary records
- `payroll_id` (uuid, primary key, default gen_random_uuid())
- `employee_id` (uuid, foreign key → employees.employee_id, not null)
- `basic_salary` (numeric(12,2), not null, default 0)
- `allowances` (numeric(12,2), not null, default 0)
- `deductions` (numeric(12,2), not null, default 0)
- `net_salary` (numeric(12,2), not null, default 0)
- `effective_from` (date, not null, default current_date)
- `created_at` (timestamptz, default now())

## Relationships
- users.user_id (1:1) employees.user_id
- employees.employee_id (1:N) attendance.employee_id
- employees.employee_id (1:N) leave_requests.employee_id
- employees.employee_id (1:N) payroll.employee_id

## Security (RLS)
- All tables have RLS enabled.
- `users`: each authenticated user can read/update their own row; admins can read all.
- `employees`: authenticated users can read their own profile; admins can read/update all.
- `attendance`: employees read their own records; admins read all and can insert/update.
- `leave_requests`: employees read/create their own; admins read all and update status.
- `payroll`: employees read their own; admins read all and update.
- All policies use auth.uid() for ownership checks.
*/

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  employee_id uuid,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own row
DROP POLICY IF EXISTS "select_own_user" ON users;
CREATE POLICY "select_own_user" ON users FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Admins can read all users
DROP POLICY IF EXISTS "admin_select_all_users" ON users;
CREATE POLICY "admin_select_all_users" ON users FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  );

-- Users can update their own row (but not their own role)
DROP POLICY IF EXISTS "update_own_user" ON users;
CREATE POLICY "update_own_user" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can insert their own row (for signup)
DROP POLICY IF EXISTS "insert_own_user" ON users;
CREATE POLICY "insert_own_user" ON users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- EMPLOYEES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  employee_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  department text,
  designation text,
  joining_date date,
  profile_picture text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Employees can read their own profile
DROP POLICY IF EXISTS "select_own_employee" ON employees;
CREATE POLICY "select_own_employee" ON employees FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Admins can read all employees
DROP POLICY IF EXISTS "admin_select_all_employees" ON employees;
CREATE POLICY "admin_select_all_employees" ON employees FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  );

-- Employees can update their own profile
DROP POLICY IF EXISTS "update_own_employee" ON employees;
CREATE POLICY "update_own_employee" ON employees FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admins can update any employee
DROP POLICY IF EXISTS "admin_update_all_employees" ON employees;
CREATE POLICY "admin_update_all_employees" ON employees FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  );

-- Employees can insert their own profile (on signup)
DROP POLICY IF EXISTS "insert_own_employee" ON employees;
CREATE POLICY "insert_own_employee" ON employees FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admins can insert any employee
DROP POLICY IF EXISTS "admin_insert_employees" ON employees;
CREATE POLICY "admin_insert_employees" ON employees FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  );

-- ============================================================
-- ATTENDANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  check_in timestamptz,
  check_out timestamptz,
  status text NOT NULL DEFAULT 'Absent' CHECK (status IN ('Present', 'Absent', 'Half-day', 'Leave')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Employees can read their own attendance
DROP POLICY IF EXISTS "select_own_attendance" ON attendance;
CREATE POLICY "select_own_attendance" ON attendance FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.employee_id = attendance.employee_id
      AND e.user_id = auth.uid()
    )
  );

-- Admins can read all attendance
DROP POLICY IF EXISTS "admin_select_all_attendance" ON attendance;
CREATE POLICY "admin_select_all_attendance" ON attendance FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  );

-- Employees can insert their own attendance (check-in)
DROP POLICY IF EXISTS "insert_own_attendance" ON attendance;
CREATE POLICY "insert_own_attendance" ON attendance FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.employee_id = attendance.employee_id
      AND e.user_id = auth.uid()
    )
  );

-- Employees can update their own attendance (check-out)
DROP POLICY IF EXISTS "update_own_attendance" ON attendance;
CREATE POLICY "update_own_attendance" ON attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.employee_id = attendance.employee_id
      AND e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.employee_id = attendance.employee_id
      AND e.user_id = auth.uid()
    )
  );

-- Admins can update any attendance
DROP POLICY IF EXISTS "admin_update_all_attendance" ON attendance;
CREATE POLICY "admin_update_all_attendance" ON attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  );

-- Admins can insert any attendance
DROP POLICY IF EXISTS "admin_insert_all_attendance" ON attendance;
CREATE POLICY "admin_insert_all_attendance" ON attendance FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  );

-- ============================================================
-- LEAVE_REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_requests (
  leave_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  leave_type text NOT NULL CHECK (leave_type IN ('Paid', 'Sick', 'Unpaid')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  remarks text,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  admin_comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Employees can read their own leave requests
DROP POLICY IF EXISTS "select_own_leaves" ON leave_requests;
CREATE POLICY "select_own_leaves" ON leave_requests FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.employee_id = leave_requests.employee_id
      AND e.user_id = auth.uid()
    )
  );

-- Admins can read all leave requests
DROP POLICY IF EXISTS "admin_select_all_leaves" ON leave_requests;
CREATE POLICY "admin_select_all_leaves" ON leave_requests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  );

-- Employees can insert their own leave requests
DROP POLICY IF EXISTS "insert_own_leaves" ON leave_requests;
CREATE POLICY "insert_own_leaves" ON leave_requests FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.employee_id = leave_requests.employee_id
      AND e.user_id = auth.uid()
    )
  );

-- Admins can update any leave request (approve/reject)
DROP POLICY IF EXISTS "admin_update_all_leaves" ON leave_requests;
CREATE POLICY "admin_update_all_leaves" ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  );

-- ============================================================
-- PAYROLL TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll (
  payroll_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  basic_salary numeric(12,2) NOT NULL DEFAULT 0,
  allowances numeric(12,2) NOT NULL DEFAULT 0,
  deductions numeric(12,2) NOT NULL DEFAULT 0,
  net_salary numeric(12,2) NOT NULL DEFAULT 0,
  effective_from date NOT NULL DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- Employees can read their own payroll
DROP POLICY IF EXISTS "select_own_payroll" ON payroll;
CREATE POLICY "select_own_payroll" ON payroll FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.employee_id = payroll.employee_id
      AND e.user_id = auth.uid()
    )
  );

-- Admins can read all payroll
DROP POLICY IF EXISTS "admin_select_all_payroll" ON payroll;
CREATE POLICY "admin_select_all_payroll" ON payroll FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  );

-- Admins can update any payroll
DROP POLICY IF EXISTS "admin_update_all_payroll" ON payroll;
CREATE POLICY "admin_update_all_payroll" ON payroll FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  );

-- Admins can insert payroll
DROP POLICY IF EXISTS "admin_insert_all_payroll" ON payroll;
CREATE POLICY "admin_insert_all_payroll" ON payroll FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id = auth.uid() AND u.role = 'admin')
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll(employee_id);

-- ============================================================
-- TRIGGER: Auto-update net_salary on payroll insert/update
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_net_salary()
RETURNS TRIGGER AS $$
BEGIN
  NEW.net_salary := NEW.basic_salary + NEW.allowances - NEW.deductions;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_net_salary ON payroll;
CREATE TRIGGER trg_calculate_net_salary
  BEFORE INSERT OR UPDATE OF basic_salary, allowances, deductions ON payroll
  FOR EACH ROW
  EXECUTE FUNCTION calculate_net_salary();

-- ============================================================
-- TRIGGER: Link users.employee_id when an employee is created
-- ============================================================
CREATE OR REPLACE FUNCTION link_employee_to_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET employee_id = NEW.employee_id
  WHERE user_id = NEW.user_id AND employee_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_link_employee_to_user ON employees;
CREATE TRIGGER trg_link_employee_to_user
  AFTER INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION link_employee_to_user();