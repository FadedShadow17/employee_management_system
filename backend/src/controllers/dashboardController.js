import ActivityLog from '../models/ActivityLog.js';
import Attendance from '../models/Attendance.js';
import Department from '../models/Department.js';
import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';
import Task from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboard = asyncHandler(async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalEmployees,
    activeEmployees,
    departments,
    pendingLeaves,
    presentToday,
    overdueTasks,
    recentEmployees,
    upcomingBirthdays,
    recentActivities,
    taskStatus,
    departmentDistribution,
    attendanceByStatus
  ] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: 'Active' }),
    Department.countDocuments(),
    Leave.countDocuments({ status: 'Pending' }),
    Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'Present' }),
    Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $ne: 'Completed' } }),
    Employee.find().sort('-createdAt').limit(5).populate('department'),
    Employee.find({ dateOfBirth: { $exists: true } }).limit(5).select('fullName dateOfBirth profileImage'),
    ActivityLog.find().sort('-createdAt').limit(8).populate('user', 'name'),
    Task.aggregate([{ $group: { _id: '$status', value: { $sum: 1 } } }]),
    Employee.aggregate([{ $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'department' } }, { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } }, { $group: { _id: '$department.name', value: { $sum: 1 } } }]),
    Attendance.aggregate([{ $group: { _id: '$status', value: { $sum: 1 } } }])
  ]);

  const employeeGrowth = await Employee.aggregate([
    { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, value: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      stats: { totalEmployees, activeEmployees, departments, pendingLeaves, presentToday, overdueTasks },
      charts: { taskStatus, departmentDistribution, attendanceByStatus, employeeGrowth },
      recentEmployees,
      upcomingBirthdays,
      recentActivities
    }
  });
});
