import Leave from '../models/Leave.js';
import { list, getOne, createOne, deleteOne } from './crudFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

// Scope: Employees only see their own leave requests
const scope = async (req) => (req.user.role === 'Employee' ? { employee: req.user.employee } : {});

export const listLeaves = list(Leave, { populate: 'employee reviewedBy', scope });
export const getLeave = getOne(Leave, { populate: 'employee reviewedBy', scope });

export const createLeave = createOne(Leave, {
  allowedFields: ['type', 'startDate', 'endDate', 'reason', 'employee'],
  beforeCreate: async (req) => ({
    ...req.body,
    // Employees can only create leave for themselves
    employee: req.user.role === 'Employee' ? req.user.employee : req.body.employee
  })
});

export const deleteLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) throw new AppError('Leave request not found', 404);

  // Employees can only delete their own pending leaves
  if (req.user.role === 'Employee') {
    if (leave.employee.toString() !== req.user.employee?.toString()) {
      throw new AppError('You can only delete your own leave requests', 403);
    }
    if (leave.status !== 'Pending') {
      throw new AppError('You can only delete pending leave requests', 400);
    }
  }

  await leave.deleteOne();
  res.json({ success: true, data: leave });
});

export const updateLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) throw new AppError('Leave request not found', 404);

  let payload;

  if (req.user.role === 'Employee') {
    // Employees can only update their own PENDING leaves, and only certain fields
    if (leave.employee.toString() !== req.user.employee?.toString()) {
      throw new AppError('You can only modify your own leave requests', 403);
    }
    if (leave.status !== 'Pending') {
      throw new AppError('You can only edit pending leave requests', 400);
    }
    const { type, startDate, endDate, reason } = req.body;
    payload = { type, startDate, endDate, reason };
  } else {
    // Admin/HR can approve/reject — auto-set reviewedBy
    const { status, adminRemarks, ...rest } = req.body;
    payload = { ...rest, status, adminRemarks };
    if (status && status !== 'Pending') {
      payload.reviewedBy = req.user._id;
    }
    // Prevent modifying security-sensitive fields
    delete payload._id;
    delete payload.employee;
    delete payload.__v;
  }

  // Remove undefined keys
  payload = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));

  const updated = await Leave.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true })
    .populate('employee reviewedBy');
  res.json({ success: true, data: updated });
});
