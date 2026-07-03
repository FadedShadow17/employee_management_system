import Attendance from '../models/Attendance.js';
import { list, getOne, createOne, updateOne, deleteOne } from './crudFactory.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Scope: Employees only see their own attendance
const scope = async (req) => (req.user.role === 'Employee' ? { employee: req.user.employee } : {});

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

// Allowed fields for admin manual attendance creation
const ATTENDANCE_WRITABLE_FIELDS = ['employee', 'date', 'status', 'checkIn', 'checkOut', 'workingHours', 'remarks'];

export const listAttendance = list(Attendance, { populate: 'employee correctedBy', scope });
export const getAttendance = getOne(Attendance, { populate: 'employee correctedBy', scope });

export const createAttendance = createOne(Attendance, {
  allowedFields: ATTENDANCE_WRITABLE_FIELDS,
  beforeCreate: async (req) => ({ ...req.body, correctedBy: req.user._id })
});

export const updateAttendance = updateOne(Attendance, {
  allowedFields: [...ATTENDANCE_WRITABLE_FIELDS, 'correctedBy'],
  scope
});

export const deleteAttendance = deleteOne(Attendance, { scope: async () => ({}) });

export const checkIn = asyncHandler(async (req, res) => {
  if (!req.user.employee) throw new AppError('Employee profile not linked', 400);

  const { start, end } = todayRange();
  const exists = await Attendance.findOne({ employee: req.user.employee, date: { $gte: start, $lt: end } });
  if (exists?.checkIn) throw new AppError('Already checked in today', 400);
  const record = exists || new Attendance({ employee: req.user.employee, date: start, status: 'Present' });
  record.checkIn = new Date();
  await record.save();
  res.json({ success: true, data: record });
});

export const checkOut = asyncHandler(async (req, res) => {
  if (!req.user.employee) throw new AppError('Employee profile not linked', 400);

  const { start, end } = todayRange();
  const record = await Attendance.findOne({ employee: req.user.employee, date: { $gte: start, $lt: end } });
  if (!record?.checkIn) throw new AppError('Check in first', 400);
  if (record.checkOut) throw new AppError('Already checked out today', 400);
  record.checkOut = new Date();
  record.workingHours = Number(((record.checkOut - record.checkIn) / 36e5).toFixed(2));
  await record.save();
  res.json({ success: true, data: record });
});
