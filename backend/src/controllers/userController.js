import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select('-password').populate('employee');
  res.json({ success: true, data: users });
});

export const createHrManager = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) throw new AppError('Email is already registered', 409);
  const user = await User.create({ name, email, password, role: 'HR Manager' });
  res.status(201).json({ success: true, data: { ...user.toObject(), password: undefined } });
});

export const updateUser = asyncHandler(async (req, res) => {
  const allowed = ['name', 'avatar', 'isActive'];
  const payload = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const user = await User.findByIdAndUpdate(req.params.id, payload, { new: true }).select('-password');
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: user });
});
