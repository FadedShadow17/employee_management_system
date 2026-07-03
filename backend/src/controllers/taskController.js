import Task from '../models/Task.js';
import { list, getOne, createOne, deleteOne } from './crudFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

// Scope: Employees only see tasks assigned to them
const taskScope = async (req) => (req.user.role === 'Employee' ? { assignedTo: req.user.employee } : {});

// Allowed fields for task creation (mass assignment prevention)
const TASK_WRITABLE_FIELDS = ['title', 'description', 'assignedTo', 'dueDate', 'priority', 'status', 'progress'];

export const listTasks = list(Task, { populate: 'assignedTo createdBy comments.user', scope: taskScope });
export const getTask = getOne(Task, { populate: 'assignedTo createdBy comments.user', scope: taskScope });

export const createTask = createOne(Task, {
  allowedFields: TASK_WRITABLE_FIELDS,
  beforeCreate: async (req) => ({ ...req.body, createdBy: req.user._id })
});

export const deleteTask = deleteOne(Task);

export const updateTask = asyncHandler(async (req, res) => {
  // Employees can only update status and progress of tasks assigned to them
  let payload;
  if (req.user.role === 'Employee') {
    const { status, progress } = req.body;
    payload = {};
    if (status !== undefined) payload.status = status;
    if (progress !== undefined) payload.progress = progress;
  } else {
    // Admin/HR can update all writable fields
    payload = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => TASK_WRITABLE_FIELDS.includes(key))
    );
  }

  // Strip forbidden fields
  delete payload._id;
  delete payload.__v;
  delete payload.createdBy;
  delete payload.createdAt;

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, ...(await taskScope(req)) },
    payload,
    { new: true, runValidators: true }
  ).populate('assignedTo createdBy comments.user');

  if (!task) throw new AppError('Task not found', 404);
  res.json({ success: true, data: task });
});

export const addTaskComment = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, ...(await taskScope(req)) });
  if (!task) throw new AppError('Task not found or access denied', 404);

  // Sanitize comment — only allow message field
  const message = req.body.message;
  if (!message || typeof message !== 'string') {
    throw new AppError('Comment message is required', 400);
  }

  task.comments.push({ user: req.user._id, message: message.trim() });
  await task.save();
  res.status(201).json({ success: true, data: task });
});
