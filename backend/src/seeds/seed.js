import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import ActivityLog from '../models/ActivityLog.js';
import Announcement from '../models/Announcement.js';
import Attendance from '../models/Attendance.js';
import Department from '../models/Department.js';
import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';
import Notification from '../models/Notification.js';
import Payroll from '../models/Payroll.js';
import PerformanceReview from '../models/PerformanceReview.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  await connectDB();
  // Safety: ensure we're connected to the intended `ems` database
  if (mongoose.connection && mongoose.connection.name !== (process.env.MONGODB_DB_NAME || 'ems')) {
    console.error(`Refusing to seed database. Connected to '${mongoose.connection.name}' but expected '${process.env.MONGODB_DB_NAME || 'ems'}'.`);
    await mongoose.connection.close();
    process.exit(1);
  }
  await Promise.all([
    ActivityLog.deleteMany(),
    Announcement.deleteMany(),
    Attendance.deleteMany(),
    Department.deleteMany(),
    Employee.deleteMany(),
    Leave.deleteMany(),
    Notification.deleteMany(),
    Payroll.deleteMany(),
    PerformanceReview.deleteMany(),
    Task.deleteMany(),
    User.deleteMany()
  ]);
  await Employee.collection.dropIndexes().catch(() => {});
  await Employee.syncIndexes();

  const admin = await User.create({ name: 'System Admin', email: 'admin@example.com', password: 'Admin@123', role: 'Admin' });
  const hrUser = await User.create({ name: 'Hira Manager', email: 'hr@example.com', password: 'Admin@123', role: 'HR Manager' });
  const employeeUsers = await User.create([
    { name: 'Aarav Sharma', email: 'aarav@example.com', password: 'Admin@123', role: 'Employee' },
    { name: 'Maya Gurung', email: 'maya@example.com', password: 'Admin@123', role: 'Employee' },
    { name: 'Nisha Thapa', email: 'nisha@example.com', password: 'Admin@123', role: 'Employee' }
  ]);

  const departments = await Department.create([
    { name: 'Engineering', description: 'Builds and maintains product platforms.' },
    { name: 'People Operations', description: 'Hiring, culture, and employee operations.' },
    { name: 'Finance', description: 'Payroll, budgets, and compliance.' }
  ]);

  const employees = [];
  employees.push(await Employee.create({
    user: hrUser._id,
    fullName: hrUser.name,
    email: hrUser.email,
    phone: '+977-9800000001',
    address: 'Kathmandu, Nepal',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    dateOfBirth: '1991-05-12',
    gender: 'Female',
    department: departments[1]._id,
    jobTitle: 'HR Manager',
    employmentType: 'Full Time',
    salary: 95000,
    skills: ['Hiring', 'Policy', 'People Analytics'],
    emergencyContact: { name: 'Suman', relationship: 'Spouse', phone: '+977-9800000010' },
    createdBy: admin._id
  }));
  employees.push(await Employee.create({
    user: employeeUsers[0]._id,
    fullName: employeeUsers[0].name,
    email: employeeUsers[0].email,
    phone: '+977-9800000002',
    address: 'Lalitpur, Nepal',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    dateOfBirth: '1996-08-20',
    gender: 'Male',
    department: departments[0]._id,
    jobTitle: 'Frontend Engineer',
    salary: 82000,
    skills: ['React', 'Tailwind', 'Testing'],
    createdBy: admin._id
  }));
  employees.push(await Employee.create({
    user: employeeUsers[1]._id,
    fullName: employeeUsers[1].name,
    email: employeeUsers[1].email,
    phone: '+977-9800000003',
    address: 'Bhaktapur, Nepal',
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    dateOfBirth: '1998-11-03',
    gender: 'Female',
    department: departments[0]._id,
    jobTitle: 'Backend Engineer',
    salary: 84000,
    skills: ['Node.js', 'MongoDB', 'APIs'],
    createdBy: admin._id
  }));
  employees.push(await Employee.create({
    user: employeeUsers[2]._id,
    fullName: employeeUsers[2].name,
    email: employeeUsers[2].email,
    phone: '+977-9800000004',
    address: 'Pokhara, Nepal',
    dateOfBirth: '1994-02-14',
    gender: 'Female',
    department: departments[2]._id,
    jobTitle: 'Payroll Analyst',
    salary: 76000,
    skills: ['Payroll', 'Excel', 'Compliance'],
    createdBy: admin._id
  }));

  await Promise.all([
    User.findByIdAndUpdate(hrUser._id, { employee: employees[0]._id }),
    ...employeeUsers.map((user, index) => User.findByIdAndUpdate(user._id, { employee: employees[index + 1]._id })),
    Department.findByIdAndUpdate(departments[1]._id, { manager: employees[0]._id }),
    Department.findByIdAndUpdate(departments[0]._id, { manager: employees[1]._id })
  ]);

  await Task.create([
    { title: 'Launch onboarding portal', description: 'Prepare employee onboarding screens.', assignedTo: [employees[1]._id, employees[2]._id], priority: 'High', status: 'In Progress', progress: 55, dueDate: new Date(Date.now() + 86400000 * 5), createdBy: admin._id },
    { title: 'Review payroll adjustments', description: 'Validate June payroll changes.', assignedTo: [employees[3]._id], priority: 'Urgent', status: 'Review', progress: 80, dueDate: new Date(Date.now() + 86400000 * 2), createdBy: hrUser._id },
    { title: 'Update leave policy', description: 'Publish revised leave policy.', assignedTo: [employees[0]._id], priority: 'Medium', status: 'To Do', progress: 10, dueDate: new Date(Date.now() - 86400000), createdBy: admin._id }
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await Attendance.create(employees.map((employee, index) => ({ employee: employee._id, date: today, checkIn: new Date(today.getTime() + 9 * 36e5 + index * 600000), checkOut: new Date(today.getTime() + 17 * 36e5), workingHours: 8, status: index === 2 ? 'Late' : 'Present', correctedBy: admin._id })));
  await Leave.create([{ employee: employees[2]._id, type: 'Annual', startDate: new Date(Date.now() + 86400000 * 7), endDate: new Date(Date.now() + 86400000 * 9), reason: 'Family event', status: 'Pending' }]);
  await Payroll.create(employees.map((employee) => ({ employee: employee._id, basicSalary: employee.salary, allowance: 5000, bonus: 3000, deduction: 1000, tax: 0.1 * employee.salary, month: new Date().getMonth() + 1, year: new Date().getFullYear(), paymentStatus: 'Pending', createdBy: admin._id })));
  await PerformanceReview.create([{ employee: employees[1]._id, rating: 4, feedback: 'Strong delivery and thoughtful collaboration.', goals: ['Lead component testing', 'Mentor interns'], reviewer: hrUser._id }]);
  await Announcement.create([{ title: 'Quarterly town hall', body: 'Join the company town hall this Friday at 3 PM.', audience: 'All', publishedBy: admin._id }]);
  await Notification.create(employeeUsers.map((user) => ({ user: user._id, title: 'Welcome to EMS', message: 'Your employee portal is ready.', type: 'success' })));

  console.log('Seed completed. Default admin: admin@example.com / Admin@123. Change these credentials in production.');
  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
