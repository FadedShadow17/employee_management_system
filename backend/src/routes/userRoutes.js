import express from 'express';
import { createHrManager, listUsers, updateUser } from '../controllers/userController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', authorize('Admin'), listUsers);
router.post('/hr-manager', authorize('Admin'), createHrManager);
router.patch('/:id', authorize('Admin'), updateUser);

export default router;
