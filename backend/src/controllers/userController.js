import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hasHigherRole } from '../middleware/rbac.js';
import { logActivity } from '../utils/activity.js';

export const listUsers = asyncHandler(async (req, res) => {
  // Paginate user list to prevent data dumping
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  const [users, total] = await Promise.all([
    User.find().select('-password -passwordHistory -twoFactorSecret -twoFactorBackupCodes')
      .populate('employee')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments()
  ]);

  res.json({ success: true, data: users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const createHrManager = asyncHandler(async (req, res) => {
  // Only accept specific fields (prevent mass assignment)
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }
  if (await User.findOne({ email })) throw new AppError('Email is already registered', 409);
  const user = await User.create({ name, email, password, role: 'HR Manager' });

  await logActivity({ user: req.user._id, action: 'create', entity: 'User', entityId: user._id, message: 'HR Manager account created' });
  res.status(201).json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role } });
});

export const updateUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw new AppError('User not found', 404);

  // Prevent modifying users of equal or higher privilege (unless self)
  if (req.params.id !== req.user._id.toString() && !hasHigherRole(req.user.role, target.role)) {
    throw new AppError('You cannot modify a user with equal or higher privileges', 403);
  }

  // Prevent self-deactivation
  if (req.params.id === req.user._id.toString() && req.body.isActive === false) {
    throw new AppError('You cannot deactivate your own account', 403);
  }

  // Only allow specific fields (mass assignment prevention)
  const allowed = ['name', 'avatar', 'isActive', 'role'];
  const payload = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));

  // Prevent role escalation
  if (payload.role) {
    const userLevel = { 'Admin': 3, 'HR Manager': 2, 'Employee': 1 }[req.user.role] || 0;
    const targetLevel = { 'Admin': 3, 'HR Manager': 2, 'Employee': 1 }[payload.role] || 0;
    if (targetLevel > userLevel) {
      throw new AppError('You cannot assign a role higher than your own', 403);
    }
  }

  const user = await User.findByIdAndUpdate(req.params.id, payload, { new: true })
    .select('-password -passwordHistory -twoFactorSecret -twoFactorBackupCodes');

  await logActivity({ user: req.user._id, action: 'update', entity: 'User', entityId: user._id, message: `User updated: ${Object.keys(payload).join(', ')}` });
  res.json({ success: true, data: user });
});
