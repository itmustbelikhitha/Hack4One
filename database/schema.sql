-- ============================================================
-- Dayflow HRMS — Canonical Database Schema
-- ============================================================
-- This is the ONE shared schema for the entire Dayflow application.
-- All modules (Auth, Employee, Attendance, Leave, Payroll) use this database.
--
-- In production this schema lives in Supabase (PostgreSQL).
-- The supabase/migrations/ directory contains the applied migration
-- with full RLS policies and triggers. This file is the human-readable
-- reference that every developer should consult before making schema changes.
-- ============================================================

-- ============================================================
-- USERS TABLE
-- ============================================================
-- Application user accounts. Links 1:1 to Supabase Auth (auth.users).
-- Password hashing is handled by Supabase Auth — no password column here.
--
-- user_id     uuid PK  — defaults to auth.uid(), maps to auth.users.id
-- employee_id uuid     — FK to employees.employee_id (nullable, set by trigger)
-- name        text     — display name
-- email       text     — unique, matches auth.users.email
-- role        text     — 'employee' | 'admin' (default 'employee')
-- created_at  timestamptz
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  user_id     uuid PRIMARY KEY DEFAULT auth.uid(),
  employee_id uuid,
  name        text NOT NULL,
  email       text UNIQUE NOT NULL,
  role         text NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS: users can read/update their own row; admins can read all.
-- (See supabase/migrations/ for full policy definitions.)

-- ============================================================
-- EMPLOYEES TABLE
-- ============================================================
-- Employee profiles. One row per employee, linked to a user account.
--
-- employee_id     uuid PK  — defaults to gen_random_uuid()
-- user_id         uuid     — FK to users.user_id, UNIQUE, NOT NULL
-- full_name       text
-- email           text
-- phone           text
-- address         text
-- department      text
-- designation     text
-- joining_date    date
-- profile_picture text     — URL to profile image
-- created_at      timestamptz
-- ============================================================

CREATE TABLE IF NOT EXISTS employees (
  employee_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  full_name       text NOT NULL,
  email           text NOT NULL,
  phone           text,
  address         text,
  department      text,
  designation     text,
  joining_date    date,
  profile_picture text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- RLS: employees read/update their own profile; admins read/update all.

-- ============================================================
-- ATTENDANCE TABLE
-- ============================================================
-- Daily attendance records. One row per employee per day.
--
-- attendance_id   uuid PK
-- employee_id     uuid     — FK to employees.employee_id
-- attendance_date date
-- check_in         timestamptz
-- check_out        timestamptz
-- status          text     — 'Present' | 'Absent' | 'Half-day' | 'Leave'
-- created_at      timestamptz
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance (
  attendance_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     uuid NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  check_in        timestamptz,
  check_out       timestamptz,
  status          text NOT NULL DEFAULT 'Absent' CHECK (status IN ('Present', 'Absent', 'Half-day', 'Leave')),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS: employees read/insert/update their own; admins read/update all.

-- ============================================================
-- LEAVE_REQUESTS TABLE
-- ============================================================
-- Leave applications submitted by employees, approved/rejected by admins.
--
-- leave_id       uuid PK
-- employee_id    uuid  — FK to employees.employee_id
-- leave_type     text  — 'Paid' | 'Sick' | 'Unpaid'
-- start_date     date
-- end_date       date
-- remarks        text
-- status         text  — 'Pending' | 'Approved' | 'Rejected'
-- admin_comment  text
-- created_at     timestamptz
-- ============================================================

CREATE TABLE IF NOT EXISTS leave_requests (
  leave_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    uuid NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  leave_type     text NOT NULL CHECK (leave_type IN ('Paid', 'Sick', 'Unpaid')),
  start_date     date NOT NULL,
  end_date       date NOT NULL,
  remarks        text,
  status         text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  admin_comment  text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS: employees read/insert their own; admins read/update all.

-- ============================================================
-- PAYROLL TABLE
-- ============================================================
-- Salary records per employee. net_salary is auto-calculated by trigger.
--
-- payroll_id     uuid PK
-- employee_id    uuid          — FK to employees.employee_id
-- basic_salary   numeric(12,2)
-- allowances     numeric(12,2)
-- deductions     numeric(12,2)
-- net_salary     numeric(12,2) — auto: basic_salary + allowances - deductions
-- effective_from date
-- created_at     timestamptz
-- ============================================================

CREATE TABLE IF NOT EXISTS payroll (
  payroll_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    uuid NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
  basic_salary   numeric(12,2) NOT NULL DEFAULT 0,
  allowances     numeric(12,2) NOT NULL DEFAULT 0,
  deductions     numeric(12,2) NOT NULL DEFAULT 0,
  net_salary     numeric(12,2) NOT NULL DEFAULT 0,
  effective_from date NOT NULL DEFAULT current_date,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- RLS: employees read their own; admins read/update/insert all.

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_employees_user_id        ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id   ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date          ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status    ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id      ON payroll(employee_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-calculate net_salary = basic_salary + allowances - deductions
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
  FOR EACH ROW EXECUTE FUNCTION calculate_net_salary();

-- Auto-link users.employee_id when an employee row is created
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
  FOR EACH ROW EXECUTE FUNCTION link_employee_to_user();

-- ============================================================
-- RELATIONSHIPS SUMMARY
-- ============================================================
-- users.user_id          (1:1)  employees.user_id
-- employees.employee_id  (1:N)  attendance.employee_id
-- employees.employee_id  (1:N)  leave_requests.employee_id
-- employees.employee_id  (1:N)  payroll.employee_id
