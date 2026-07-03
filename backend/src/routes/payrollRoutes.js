import express from 'express';
import { createPayroll, deletePayroll, getPayroll, listPayroll, updatePayroll } from '../controllers/payrollController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.route('/').get(listPayroll).post(authorize('Admin', 'HR Manager'), createPayroll);
router.route('/:id').get(getPayroll).patch(authorize('Admin', 'HR Manager'), updatePayroll).delete(authorize('Admin'), deletePayroll);
export default router;
