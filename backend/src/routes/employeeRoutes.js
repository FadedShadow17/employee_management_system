import express from 'express';
import { createEmployee, deleteEmployee, getEmployee, listEmployees, toggleEmployeeStatus, updateEmployee } from '../controllers/employeeController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.route('/').get(listEmployees).post(authorize('Admin', 'HR Manager'), createEmployee);
router.route('/:id').get(getEmployee).patch(authorize('Admin', 'HR Manager'), updateEmployee).delete(authorize('Admin'), deleteEmployee);
router.patch('/:id/toggle-status', authorize('Admin', 'HR Manager'), toggleEmployeeStatus);

export default router;
