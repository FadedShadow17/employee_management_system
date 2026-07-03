import Payroll from '../models/Payroll.js';
import { list, getOne, createOne, updateOne, deleteOne } from './crudFactory.js';

// Scope: Employees only see their own payroll records
const scope = async (req) => (req.user.role === 'Employee' ? { employee: req.user.employee } : {});

// Allowed fields for payroll (mass assignment prevention)
const PAYROLL_WRITABLE_FIELDS = [
  'employee', 'month', 'year', 'basicSalary', 'allowance',
  'bonus', 'deduction', 'tax', 'netSalary', 'status', 'paymentDate', 'remarks'
];

export const listPayroll = list(Payroll, { populate: 'employee createdBy', scope });
export const getPayroll = getOne(Payroll, { populate: 'employee createdBy', scope });

export const createPayroll = createOne(Payroll, {
  allowedFields: PAYROLL_WRITABLE_FIELDS,
  beforeCreate: async (req) => ({ ...req.body, createdBy: req.user._id })
});

export const updatePayroll = updateOne(Payroll, {
  allowedFields: PAYROLL_WRITABLE_FIELDS,
  scope: async () => ({}) // Admin/HR only — no scope restriction
});

export const deletePayroll = deleteOne(Payroll, { scope: async () => ({}) });
