import express from 'express';
import { addTaskComment, createTask, deleteTask, getTask, listTasks, updateTask } from '../controllers/taskController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTaskSchema, updateTaskSchema, addCommentSchema, idParamSchema } from '../validators/commonValidators.js';

const router = express.Router();
router.use(protect);
router.route('/')
  .get(listTasks)
  .post(authorize('Admin', 'HR Manager'), validate(createTaskSchema), createTask);
router.route('/:id')
  .get(validate(idParamSchema), getTask)
  .patch(validate(updateTaskSchema), updateTask)
  .delete(authorize('Admin', 'HR Manager'), validate(idParamSchema), deleteTask);
router.post('/:id/comments', validate(addCommentSchema), addTaskComment);
export default router;
