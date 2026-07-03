import express from 'express';
import { addTaskComment, createTask, deleteTask, getTask, listTasks, updateTask } from '../controllers/taskController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.route('/').get(listTasks).post(authorize('Admin', 'HR Manager'), createTask);
router.route('/:id').get(getTask).patch(updateTask).delete(authorize('Admin', 'HR Manager'), deleteTask);
router.post('/:id/comments', addTaskComment);
export default router;
