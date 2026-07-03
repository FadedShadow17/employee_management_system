import Department from '../models/Department.js';
import Employee from '../models/Employee.js';
import { createOne, deleteOne, getOne, updateOne } from './crudFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listDepartments = asyncHandler(async (_req, res) => {
  const departments = await Department.find().populate('manager').sort('name').lean();
  const counts = await Employee.aggregate([{ $group: { _id: '$department', employeeCount: { $sum: 1 } } }]);
  const countMap = new Map(counts.map((item) => [String(item._id), item.employeeCount]));
  res.json({ success: true, data: departments.map((department) => ({ ...department, employeeCount: countMap.get(String(department._id)) || 0 })), pagination: { page: 1, limit: departments.length, total: departments.length, pages: 1 } });
});

export const getDepartment = getOne(Department, { populate: 'manager' });
export const createDepartment = createOne(Department);
export const updateDepartment = updateOne(Department);
export const deleteDepartment = deleteOne(Department);
