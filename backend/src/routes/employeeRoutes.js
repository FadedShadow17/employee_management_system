import express from 'express';
import {
  createEmployee, deleteEmployee, getEmployee, listEmployees,
  toggleEmployeeStatus, updateEmployee, updateOwnProfile
} from '../controllers/employeeController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createEmployeeSchema, updateEmployeeSchema, idParamSchema } from '../validators/employeeValidators.js';
import { checkEmployeeAccess, preventRoleEscalation, filterFields } from '../middleware/rbac.js';

const router = express.Router();
router.use(protect);

// Self-service route: employees update their own profile (limited fields)
router.patch('/me', updateOwnProfile);

router.route('/')
  .get(listEmployees)
  .post(authorize('Admin', 'HR Manager'), validate(createEmployeeSchema), createEmployee);

router.route('/:id')
  .get(validate(idParamSchema), checkEmployeeAccess, getEmployee)
  .patch(
    authorize('Admin', 'HR Manager'),
    validate(updateEmployeeSchema),
    filterFields({
      'Admin': ['fullName', 'email', 'phone', 'address', 'dateOfBirth', 'gender', 'department', 'jobTitle', 'employmentType', 'joiningDate', 'salary', 'manager', 'skills', 'emergencyContact', 'profileImage'],
      'HR Manager': ['fullName', 'email', 'phone', 'address', 'dateOfBirth', 'gender', 'department', 'jobTitle', 'employmentType', 'joiningDate', 'salary', 'manager', 'skills', 'emergencyContact', 'profileImage']
    }),
    updateEmployee
  )
  .delete(authorize('Admin'), validate(idParamSchema), deleteEmployee);

router.patch('/:id/toggle-status', authorize('Admin', 'HR Manager'), validate(idParamSchema), toggleEmployeeStatus);

export default router;
