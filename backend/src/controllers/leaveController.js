import Leave from '../models/Leave.js';
import { list, getOne, createOne, deleteOne } from './crudFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const scope = async (req) => (req.user.role === 'Employee' ? { employee: req.user.employee } : {});

export const listLeaves = list(Leave, { populate: 'employee reviewedBy', scope });
export const getLeave = getOne(Leave, { populate: 'employee reviewedBy', scope });
export const createLeave = createOne(Leave, { beforeCreate: async (req) => ({ ...req.body, employee: req.user.role === 'Employee' ? req.user.employee : req.body.employee }) });
export const deleteLeave = deleteOne(Leave);

export const updateLeave = asyncHandler(async (req, res) => {
  const payload = req.user.role === 'Employee'
    ? (({ type, startDate, endDate, reason }) => ({ type, startDate, endDate, reason }))(req.body)
    : { ...req.body, reviewedBy: req.body.status ? req.user._id : req.body.reviewedBy };
  const leave = await Leave.findOneAndUpdate({ _id: req.params.id, ...(await scope(req)) }, payload, { new: true, runValidators: true });
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
  res.json({ success: true, data: leave });
});
