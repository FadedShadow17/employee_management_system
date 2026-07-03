import express from 'express';
import { createHrManager, listUsers, updateUser } from '../controllers/userController.js';
import { authorize, protect } from '../middleware/auth.js';
import { preventRoleEscalation } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../validators/employeeValidators.js';

const router = express.Router();

router.use(protect);
router.get('/', authorize('Admin'), listUsers);
router.post('/hr-manager', authorize('Admin'), preventRoleEscalation, createHrManager);
router.patch('/:id', authorize('Admin'), validate(idParamSchema), preventRoleEscalation, updateUser);

export default router;
