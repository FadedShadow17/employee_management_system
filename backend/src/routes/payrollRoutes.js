import express from 'express';
import { createPayroll, deletePayroll, getPayroll, listPayroll, updatePayroll } from '../controllers/payrollController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createPayrollSchema, updatePayrollSchema, idParamSchema } from '../validators/commonValidators.js';

const router = express.Router();
router.use(protect);

// All users can view payroll (scoped by role in controller)
router.route('/')
  .get(listPayroll)
  .post(authorize('Admin', 'HR Manager'), validate(createPayrollSchema), createPayroll);

router.route('/:id')
  .get(validate(idParamSchema), getPayroll)
  .patch(authorize('Admin', 'HR Manager'), validate(idParamSchema), validate(updatePayrollSchema), updatePayroll)
  .delete(authorize('Admin'), validate(idParamSchema), deletePayroll);

export default router;
