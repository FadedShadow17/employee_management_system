import express from 'express';
import { checkIn, checkOut, createAttendance, deleteAttendance, getAttendance, listAttendance, updateAttendance } from '../controllers/attendanceController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.route('/').get(listAttendance).post(authorize('Admin', 'HR Manager'), createAttendance);
router.route('/:id').get(getAttendance).patch(authorize('Admin', 'HR Manager'), updateAttendance).delete(authorize('Admin'), deleteAttendance);
export default router;
