import Employee from '../models/Employee.js';
import User from '../models/User.js';
import { list, getOne, createOne, updateOne, deleteOne } from './crudFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { redactForRole } from '../middleware/rbac.js';
import { AppError } from '../utils/AppError.js';

// Scope: employees can only see their own record
const employeeScope = async (req) => (req.user.role === 'Employee' ? { _id: req.user.employee } : {});

// Allowed fields for employee creation/update (prevents mass assignment)
const EMPLOYEE_WRITABLE_FIELDS = [
  'fullName', 'email', 'phone', 'address', 'dateOfBirth', 'gender',
  'department', 'jobTitle', 'employmentType', 'joiningDate', 'salary',
  'manager', 'skills', 'emergencyContact', 'profileImage'
];

// Fields that only Admin/HR can modify (not self-service)
const ADMIN_ONLY_FIELDS = ['salary', 'department', 'jobTitle', 'employmentType', 'manager', 'joiningDate'];

export const listEmployees = list(Employee, {
  populate: 'department manager createdBy',
  scope: employeeScope,
  allowedSorts: ['createdAt', '-createdAt', 'fullName', '-fullName', 'joiningDate', '-joiningDate']
});

export const getEmployee = asyncHandler(async (req, res) => {
  const scope = await employeeScope(req);
  const employee = await Employee.findOne({ _id: req.params.id, ...scope })
    .populate('department manager createdBy user');

  if (!employee) throw new AppError('Employee not found', 404);

  // Redact sensitive fields from non-admin/HR users
  let data = employee.toObject();
  data = redactForRole(data, req.user.role, {
    'Employee': ['salary', 'createdBy'] // Employees cannot see others' salaries
  });

  res.json({ success: true, data });
});

export const createEmployee = createOne(Employee, {
  allowedFields: EMPLOYEE_WRITABLE_FIELDS,
  beforeCreate: async (req) => ({ ...req.body, createdBy: req.user._id })
});

export const updateEmployee = asyncHandler(async (req, res) => {
  // Filter fields: remove fields the user shouldn't modify
  const allowed = [...EMPLOYEE_WRITABLE_FIELDS];
  const payload = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowed.includes(key))
  );

  // Remove immutable fields from payload
  delete payload._id;
  delete payload.createdBy;
  delete payload.employeeId;

  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    payload,
    { new: true, runValidators: true }
  ).populate('department manager');

  if (!employee) throw new AppError('Employee not found', 404);
  res.json({ success: true, data: employee });
});

export const deleteEmployee = deleteOne(Employee, { scope: async () => ({}) });

export const toggleEmployeeStatus = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new AppError('Employee not found', 404);

  // Prevent disabling your own account
  if (employee.user?.toString() === req.user._id.toString()) {
    throw new AppError('You cannot change your own status', 403);
  }

  employee.status = employee.status === 'Active' ? 'Inactive' : 'Active';
  await employee.save();
  if (employee.user) await User.findByIdAndUpdate(employee.user, { isActive: employee.status === 'Active' });
  res.json({ success: true, data: employee });
});

// Self-service profile update — employees can only update their own limited fields
export const updateOwnProfile = asyncHandler(async (req, res) => {
  const employeeId = req.user.employee;
  if (!employeeId) throw new AppError('Employee profile not found', 404);

  // Only allow non-sensitive fields for self-service
  const selfServiceFields = ['phone', 'address', 'emergencyContact', 'profileImage', 'skills'];
  const payload = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => selfServiceFields.includes(key))
  );

  const employee = await Employee.findByIdAndUpdate(employeeId, payload, { new: true, runValidators: true });
  if (!employee) throw new AppError('Employee not found', 404);
  res.json({ success: true, data: employee });
});
