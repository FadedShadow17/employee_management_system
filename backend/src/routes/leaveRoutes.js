import express from 'express';
import { createLeave, deleteLeave, getLeave, listLeaves, updateLeave } from '../controllers/leaveController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.route('/').get(listLeaves).post(createLeave);
router.route('/:id').get(getLeave).patch(authorize('Admin', 'HR Manager'), updateLeave).delete(authorize('Admin', 'HR Manager'), deleteLeave);
export default router;
