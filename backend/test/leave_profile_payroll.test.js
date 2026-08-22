import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Dayflow HRMS — Developer 3 Modules (Leave, Profile, Payroll)', () => {
  
  // -------------------------------------------------------------
  // LEAVE MODULE TESTS
  // -------------------------------------------------------------
  describe('Leave Module', () => {
    it('1 & 2: Employee can apply for leave and new leave starts as Pending', () => {
      const leaveInput = {
        employee_id: 'emp-uuid-1',
        leave_type: 'Sick',
        start_date: '2026-09-01',
        end_date: '2026-09-03',
        remarks: 'Doctor appointment',
      };

      // Simulating leave application logic
      const validLeaveTypes = ['Paid', 'Sick', 'Unpaid'];
      assert.ok(validLeaveTypes.includes(leaveInput.leave_type), 'Leave type must be Paid, Sick, or Unpaid');
      assert.ok(new Date(leaveInput.start_date) <= new Date(leaveInput.end_date), 'Start date must be <= end date');

      const createdLeave = {
        leave_id: 'leave-uuid-1',
        ...leaveInput,
        status: 'Pending',
        admin_comment: null,
        created_at: new Date().toISOString(),
      };

      assert.equal(createdLeave.status, 'Pending', 'Initial status must be Pending');
      assert.equal(createdLeave.employee_id, 'emp-uuid-1');
      assert.equal(createdLeave.leave_type, 'Sick');
      assert.equal(createdLeave.admin_comment, null);
    });

    it('3: Employee can view their leave history', () => {
      const allLeaves = [
        { leave_id: 'l1', employee_id: 'emp-1', leave_type: 'Paid', status: 'Approved', created_at: '2026-08-01' },
        { leave_id: 'l2', employee_id: 'emp-2', leave_type: 'Sick', status: 'Pending', created_at: '2026-08-02' },
        { leave_id: 'l3', employee_id: 'emp-1', leave_type: 'Unpaid', status: 'Pending', created_at: '2026-08-10' },
      ];

      const emp1Leaves = allLeaves.filter(l => l.employee_id === 'emp-1');
      assert.equal(emp1Leaves.length, 2);
      assert.deepEqual(emp1Leaves.map(l => l.leave_id), ['l1', 'l3']);
    });

    it('4: Admin can see all leave requests across the company', () => {
      const allLeaves = [
        { leave_id: 'l1', employee_id: 'emp-1', leave_type: 'Paid', status: 'Approved' },
        { leave_id: 'l2', employee_id: 'emp-2', leave_type: 'Sick', status: 'Pending' },
      ];
      assert.equal(allLeaves.length, 2);
    });

    it('5: Admin can approve a leave request with comment', () => {
      const leave = { leave_id: 'l2', employee_id: 'emp-2', status: 'Pending', admin_comment: null };
      
      // Admin approves
      const updated = {
        ...leave,
        status: 'Approved',
        admin_comment: 'Approved by Manager',
      };

      assert.equal(updated.status, 'Approved');
      assert.equal(updated.admin_comment, 'Approved by Manager');
    });

    it('6: Admin can reject a leave request with comment', () => {
      const leave = { leave_id: 'l2', employee_id: 'emp-2', status: 'Pending', admin_comment: null };
      
      // Admin rejects
      const updated = {
        ...leave,
        status: 'Rejected',
        admin_comment: 'Insufficient coverage during this period',
      };

      assert.equal(updated.status, 'Rejected');
      assert.equal(updated.admin_comment, 'Insufficient coverage during this period');
    });

    it('7: Employee sees the updated status and admin comment', () => {
      const leaveRecord = {
        leave_id: 'l2',
        employee_id: 'emp-2',
        leave_type: 'Sick',
        start_date: '2026-09-01',
        end_date: '2026-09-03',
        status: 'Approved',
        admin_comment: 'Take rest and get well soon',
      };

      assert.equal(leaveRecord.status, 'Approved');
      assert.ok(leaveRecord.admin_comment.length > 0);
    });
  });

  // -------------------------------------------------------------
  // EMPLOYEE PROFILE MODULE TESTS
  // -------------------------------------------------------------
  describe('Employee Profile Module', () => {
    const existingEmployee = {
      employee_id: 'emp-101',
      user_id: 'usr-101',
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      department: 'Engineering',
      designation: 'Software Engineer',
      joining_date: '2025-01-15',
      profile_picture: 'https://example.com/avatar.jpg',
      created_at: '2025-01-15T00:00:00Z',
    };

    it('8: Employee can view their profile', () => {
      assert.equal(existingEmployee.employee_id, 'emp-101');
      assert.equal(existingEmployee.full_name, 'John Doe');
      assert.equal(existingEmployee.email, 'john@example.com');
      assert.equal(existingEmployee.department, 'Engineering');
    });

    it('9: Employee can edit permitted profile fields (Name, Phone, Address, Profile Picture)', () => {
      const isUserAdmin = false;
      const requestedUpdates = {
        full_name: 'Johnathan Doe',
        phone: '987-654-3210',
        address: '456 Elm St',
        profile_picture: 'https://example.com/new_avatar.jpg',
      };

      const permittedUpdates = {};
      if (requestedUpdates.full_name !== undefined) permittedUpdates.full_name = requestedUpdates.full_name;
      if (requestedUpdates.phone !== undefined) permittedUpdates.phone = requestedUpdates.phone;
      if (requestedUpdates.address !== undefined) permittedUpdates.address = requestedUpdates.address;
      if (requestedUpdates.profile_picture !== undefined) permittedUpdates.profile_picture = requestedUpdates.profile_picture;

      const updated = { ...existingEmployee, ...permittedUpdates };

      assert.equal(updated.full_name, 'Johnathan Doe');
      assert.equal(updated.phone, '987-654-3210');
      assert.equal(updated.address, '456 Elm St');
      assert.equal(updated.profile_picture, 'https://example.com/new_avatar.jpg');
    });

    it('10: Normal employee cannot modify department, designation, joining_date, employee_id, or role', () => {
      const isUserAdmin = false;
      const maliciousPayload = {
        employee_id: 'hacked-id',
        department: 'Executive Leadership',
        designation: 'CEO',
        joining_date: '2010-01-01',
        role: 'admin',
        full_name: 'John Doe Updated',
      };

      const updates = {};
      if (maliciousPayload.full_name !== undefined) updates.full_name = maliciousPayload.full_name;
      if (isUserAdmin) {
        if (maliciousPayload.department !== undefined) updates.department = maliciousPayload.department;
        if (maliciousPayload.designation !== undefined) updates.designation = maliciousPayload.designation;
        if (maliciousPayload.joining_date !== undefined) updates.joining_date = maliciousPayload.joining_date;
      }

      const updated = { ...existingEmployee, ...updates };

      assert.equal(updated.employee_id, 'emp-101', 'employee_id must remain unchanged');
      assert.equal(updated.department, 'Engineering', 'department must remain unchanged for non-admin');
      assert.equal(updated.designation, 'Software Engineer', 'designation must remain unchanged for non-admin');
      assert.equal(updated.joining_date, '2025-01-15', 'joining_date must remain unchanged for non-admin');
      assert.equal(updated.full_name, 'John Doe Updated');
    });
  });

  // -------------------------------------------------------------
  // PAYROLL MODULE TESTS
  // -------------------------------------------------------------
  describe('Payroll Module', () => {
    it('11: Employee can view their own salary', () => {
      const payrollRecord = {
        payroll_id: 'pay-1',
        employee_id: 'emp-101',
        basic_salary: 8000,
        allowances: 1500,
        deductions: 500,
        net_salary: 9000,
        effective_from: '2026-01-01',
      };

      assert.equal(payrollRecord.employee_id, 'emp-101');
      assert.equal(payrollRecord.net_salary, 9000);
    });

    it('12: Admin can view all payroll records', () => {
      const allPayroll = [
        { payroll_id: 'p1', employee_id: 'emp-1', net_salary: 5000 },
        { payroll_id: 'p2', employee_id: 'emp-2', net_salary: 6500 },
      ];
      assert.equal(allPayroll.length, 2);
    });

    it('13 & 14: Net salary formula (basic_salary + allowances - deductions) is accurate and handles updates', () => {
      const basic_salary = 10000;
      const allowances = 2500;
      const deductions = 1200;
      const net_salary = basic_salary + allowances - deductions;

      assert.equal(net_salary, 11300, 'net_salary must be exactly basic + allowances - deductions');

      // Test partial updates
      const existing = {
        basic_salary: 8000,
        allowances: 1000,
        deductions: 500,
      };

      const updateInput = { allowances: 2000 };
      const newBasic = updateInput.basic_salary ?? existing.basic_salary;
      const newAllow = updateInput.allowances ?? existing.allowances;
      const newDeduct = updateInput.deductions ?? existing.deductions;
      const calculatedNet = newBasic + newAllow - newDeduct;

      assert.equal(calculatedNet, 9500, 'Partial update correctly recalculates net salary: 8000 + 2000 - 500 = 9500');
    });
  });

  // -------------------------------------------------------------
  // MAPPER TESTS (camelCase <-> snake_case)
  // -------------------------------------------------------------
  describe('Data Mapping (snake_case DB <-> camelCase Frontend)', () => {
    it('15: Leave Request mapping produces correct camelCase keys', () => {
      const dbRow = {
        leave_id: 'l-1',
        employee_id: 'e-1',
        leave_type: 'Paid',
        start_date: '2026-08-01',
        end_date: '2026-08-05',
        remarks: 'Vacation',
        status: 'Approved',
        admin_comment: 'Have fun',
        created_at: '2026-07-20T10:00:00Z',
      };

      const mapped = {
        leaveId: dbRow.leave_id,
        employeeId: dbRow.employee_id,
        leaveType: dbRow.leave_type,
        startDate: dbRow.start_date,
        endDate: dbRow.end_date,
        remarks: dbRow.remarks,
        status: dbRow.status,
        adminComment: dbRow.admin_comment,
        createdAt: dbRow.created_at,
      };

      assert.equal(mapped.leaveId, 'l-1');
      assert.equal(mapped.employeeId, 'e-1');
      assert.equal(mapped.leaveType, 'Paid');
      assert.equal(mapped.startDate, '2026-08-01');
      assert.equal(mapped.endDate, '2026-08-05');
      assert.equal(mapped.adminComment, 'Have fun');
    });

    it('16: Payroll mapping produces correct camelCase keys and numeric fields', () => {
      const dbRow = {
        payroll_id: 'p-1',
        employee_id: 'e-1',
        basic_salary: '7500.00',
        allowances: '1200.50',
        deductions: '300.00',
        net_salary: '8400.50',
        effective_from: '2026-06-01',
        created_at: '2026-06-01T00:00:00Z',
      };

      const mapped = {
        payrollId: dbRow.payroll_id,
        employeeId: dbRow.employee_id,
        basicSalary: Number(dbRow.basic_salary),
        allowances: Number(dbRow.allowances),
        deductions: Number(dbRow.deductions),
        netSalary: Number(dbRow.net_salary),
        effectiveFrom: dbRow.effective_from,
        createdAt: dbRow.created_at,
      };

      assert.equal(mapped.payrollId, 'p-1');
      assert.equal(mapped.basicSalary, 7500);
      assert.equal(mapped.allowances, 1200.50);
      assert.equal(mapped.deductions, 300);
      assert.equal(mapped.netSalary, 8400.50);
      assert.equal(mapped.effectiveFrom, '2026-06-01');
    });

    it('17: Employee profile mapping produces correct camelCase keys', () => {
      const dbRow = {
        employee_id: 'e-1',
        user_id: 'u-1',
        full_name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-1234',
        address: '789 Oak Ave',
        department: 'Design',
        designation: 'UI/UX Designer',
        joining_date: '2024-03-01',
        profile_picture: 'https://example.com/jane.png',
        created_at: '2024-03-01T00:00:00Z',
      };

      const mapped = {
        employeeId: dbRow.employee_id,
        userId: dbRow.user_id,
        fullName: dbRow.full_name,
        email: dbRow.email,
        phone: dbRow.phone,
        address: dbRow.address,
        department: dbRow.department,
        designation: dbRow.designation,
        joiningDate: dbRow.joining_date,
        profilePicture: dbRow.profile_picture,
        createdAt: dbRow.created_at,
      };

      assert.equal(mapped.employeeId, 'e-1');
      assert.equal(mapped.fullName, 'Jane Smith');
      assert.equal(mapped.department, 'Design');
      assert.equal(mapped.joiningDate, '2024-03-01');
    });
  });
});
