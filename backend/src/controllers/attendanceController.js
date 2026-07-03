import Attendance from '../models/Attendance.js';
import { list, getOne, createOne, updateOne, deleteOne } from './crudFactory.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const scope = async (req) => (req.user.role === 'Employee' ? { employee: req.user.employee } : {});
const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

export const listAttendance = list(Attendance, { populate: 'employee correctedBy', scope });
export const getAttendance = getOne(Attendance, { populate: 'employee correctedBy', scope });
export const createAttendance = createOne(Attendance, { beforeCreate: async (req) => ({ ...req.body, correctedBy: req.user._id }) });
export const updateAttendance = updateOne(Attendance);
export const deleteAttendance = deleteOne(Attendance);

export const checkIn = asyncHandler(async (req, res) => {
  const { start, end } = todayRange();
  const exists = await Attendance.findOne({ employee: req.user.employee, date: { $gte: start, $lt: end } });
  if (exists?.checkIn) throw new AppError('Already checked in today', 400);
  const record = exists || new Attendance({ employee: req.user.employee, date: start, status: 'Present' });
  record.checkIn = new Date();
  await record.save();
  res.json({ success: true, data: record });
});

export const checkOut = asyncHandler(async (req, res) => {
  const { start, end } = todayRange();
  const record = await Attendance.findOne({ employee: req.user.employee, date: { $gte: start, $lt: end } });
  if (!record?.checkIn) throw new AppError('Check in first', 400);
  record.checkOut = new Date();
  record.workingHours = Number(((record.checkOut - record.checkIn) / 36e5).toFixed(2));
  await record.save();
  res.json({ success: true, data: record });
});
