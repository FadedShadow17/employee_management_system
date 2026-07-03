import Payroll from '../models/Payroll.js';
import { list, getOne, createOne, updateOne, deleteOne } from './crudFactory.js';

const scope = async (req) => (req.user.role === 'Employee' ? { employee: req.user.employee } : {});

export const listPayroll = list(Payroll, { populate: 'employee createdBy', scope });
export const getPayroll = getOne(Payroll, { populate: 'employee createdBy', scope });
export const createPayroll = createOne(Payroll, { beforeCreate: async (req) => ({ ...req.body, createdBy: req.user._id }) });
export const updatePayroll = updateOne(Payroll);
export const deletePayroll = deleteOne(Payroll);
