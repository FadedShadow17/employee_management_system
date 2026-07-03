import Task from '../models/Task.js';
import { list, getOne, createOne, deleteOne } from './crudFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const taskScope = async (req) => (req.user.role === 'Employee' ? { assignedTo: req.user.employee } : {});

export const listTasks = list(Task, { populate: 'assignedTo createdBy comments.user', scope: taskScope });
export const getTask = getOne(Task, { populate: 'assignedTo createdBy comments.user', scope: taskScope });
export const createTask = createOne(Task, { beforeCreate: async (req) => ({ ...req.body, createdBy: req.user._id }) });
export const deleteTask = deleteOne(Task);

export const updateTask = asyncHandler(async (req, res) => {
  const payload = req.user.role === 'Employee'
    ? { status: req.body.status, progress: req.body.progress }
    : req.body;
  const task = await Task.findOneAndUpdate({ _id: req.params.id, ...(await taskScope(req)) }, payload, { new: true, runValidators: true });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  res.json({ success: true, data: task });
});

export const addTaskComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  task.comments.push({ user: req.user._id, message: req.body.message });
  await task.save();
  res.status(201).json({ success: true, data: task });
});
