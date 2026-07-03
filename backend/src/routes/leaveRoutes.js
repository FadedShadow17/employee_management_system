import express from 'express';
import { createLeave, deleteLeave, getLeave, listLeaves, updateLeave } from '../controllers/leaveController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createLeaveSchema, updateLeaveSchema, idParamSchema } from '../validators/commonValidators.js';

const router = express.Router();
router.use(protect);
router.route('/')
  .get(listLeaves)
  .post(validate(createLeaveSchema), createLeave);
router.route('/:id')
  .get(validate(idParamSchema), getLeave)
  .patch(authorize('Admin', 'HR Manager'), validate(updateLeaveSchema), updateLeave)
  .delete(authorize('Admin', 'HR Manager'), validate(idParamSchema), deleteLeave);
export default router;
