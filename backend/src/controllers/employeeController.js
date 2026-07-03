import Employee from '../models/Employee.js';
import User from '../models/User.js';
import { list, getOne, createOne, updateOne, deleteOne } from './crudFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const employeeScope = async (req) => (req.user.role === 'Employee' ? { _id: req.user.employee } : {});

export const listEmployees = list(Employee, { populate: 'department manager createdBy', scope: employeeScope });
export const getEmployee = getOne(Employee, { populate: 'department manager createdBy user', scope: employeeScope });
export const createEmployee = createOne(Employee, { beforeCreate: async (req) => ({ ...req.body, createdBy: req.user._id }) });
export const updateEmployee = updateOne(Employee);
export const deleteEmployee = deleteOne(Employee);

export const toggleEmployeeStatus = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  employee.status = employee.status === 'Active' ? 'Inactive' : 'Active';
  await employee.save();
  if (employee.user) await User.findByIdAndUpdate(employee.user, { isActive: employee.status === 'Active' });
  res.json({ success: true, data: employee });
});
