import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, 'Invalid ID format');

// ─── Task Validators ─────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional(),
    assignedTo: z.array(z.string().regex(objectIdRegex)).min(1, 'At least one assignee required').optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
    status: z.enum(['Todo', 'In Progress', 'Review', 'Done']).optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    progress: z.number().min(0).max(100).optional()
  })
});

export const updateTaskSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    assignedTo: z.array(z.string().regex(objectIdRegex)).optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
    status: z.enum(['Todo', 'In Progress', 'Review', 'Done']).optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    progress: z.number().min(0).max(100).optional()
  })
});

export const addCommentSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    text: z.string().min(1, 'Comment text is required').max(1000)
  })
});

// ─── Leave Validators ────────────────────────────────────────────────────────

export const createLeaveSchema = z.object({
  body: z.object({
    type: z.enum(['Annual', 'Sick', 'Personal', 'Unpaid', 'Maternity', 'Paternity', 'Other']),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z.string().min(1, 'Reason is required').max(500)
  })
});

export const updateLeaveSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    status: z.enum(['Pending', 'Approved', 'Rejected']).optional(),
    type: z.enum(['Annual', 'Sick', 'Personal', 'Unpaid', 'Maternity', 'Paternity', 'Other']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    reason: z.string().max(500).optional()
  })
});

// ─── Payroll Validators ──────────────────────────────────────────────────────

export const createPayrollSchema = z.object({
  body: z.object({
    employee: z.string().regex(objectIdRegex, 'Invalid employee ID'),
    basicSalary: z.number().min(0, 'Basic salary must be positive'),
    allowance: z.number().min(0).optional(),
    bonus: z.number().min(0).optional(),
    deduction: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
    month: z.number().min(1).max(12),
    year: z.number().min(2000).max(2100),
    paymentStatus: z.enum(['Pending', 'Paid']).optional()
  })
});

export const updatePayrollSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    basicSalary: z.number().min(0).optional(),
    allowance: z.number().min(0).optional(),
    bonus: z.number().min(0).optional(),
    deduction: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
    month: z.number().min(1).max(12).optional(),
    year: z.number().min(2000).max(2100).optional(),
    paymentStatus: z.enum(['Pending', 'Paid']).optional()
  })
});

// ─── Attendance Validators ───────────────────────────────────────────────────

export const createAttendanceSchema = z.object({
  body: z.object({
    employee: z.string().regex(objectIdRegex, 'Invalid employee ID'),
    date: z.string().min(1, 'Date is required'),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    status: z.enum(['Present', 'Absent', 'Late', 'Half Day', 'On Leave']).optional(),
    notes: z.string().max(500).optional()
  })
});

// ─── Department Validators ───────────────────────────────────────────────────

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    manager: z.string().regex(objectIdRegex).optional().nullable(),
    isActive: z.boolean().optional()
  })
});

// ─── Announcement Validators ─────────────────────────────────────────────────

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    body: z.string().min(1, 'Body is required').max(5000),
    audience: z.enum(['All', 'Admin', 'HR Manager', 'Employee']).optional(),
    isPublished: z.boolean().optional()
  })
});

// ─── Generic ID param validator ──────────────────────────────────────────────

export const idParamSchema = z.object({
  params: z.object({ id: objectId })
});

// ─── Query validators (pagination, search) ───────────────────────────────────

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().max(50).optional(),
    search: z.string().max(100).optional(),
    status: z.string().max(30).optional()
  }).passthrough() // Allow additional query params
});
