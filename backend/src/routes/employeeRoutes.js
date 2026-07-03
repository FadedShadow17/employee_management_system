import express from 'express';
import { createEmployee, deleteEmployee, getEmployee, listEmployees, toggleEmployeeStatus, updateEmployee } from '../controllers/employeeController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createEmployeeSchema, updateEmployeeSchema, idParamSchema } from '../validators/employeeValidators.js';

const router = express.Router();
router.use(protect);
router.route('/')
  .get(listEmployees)
  .post(authorize('Admin', 'HR Manager'), validate(createEmployeeSchema), createEmployee);
router.route('/:id')
  .get(validate(idParamSchema), getEmployee)
  .patch(authorize('Admin', 'HR Manager'), validate(updateEmployeeSchema), updateEmployee)
  .delete(authorize('Admin'), validate(idParamSchema), deleteEmployee);
router.patch('/:id/toggle-status', authorize('Admin', 'HR Manager'), validate(idParamSchema), toggleEmployeeStatus);

export default router;
