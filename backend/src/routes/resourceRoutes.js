import express from 'express';
import Announcement from '../models/Announcement.js';
import Department from '../models/Department.js';
import Notification from '../models/Notification.js';
import PerformanceReview from '../models/PerformanceReview.js';
import { authorize, protect } from '../middleware/auth.js';
import { createOne, deleteOne, getOne, list, updateOne } from '../controllers/crudFactory.js';
import { createDepartment, deleteDepartment, getDepartment, listDepartments, updateDepartment } from '../controllers/departmentController.js';

const reviewPopulate = 'employee reviewer';
const announcementPopulate = 'publishedBy';

export const departmentRoutes = express.Router();
departmentRoutes.use(protect);
departmentRoutes.route('/').get(listDepartments).post(authorize('Admin', 'HR Manager'), createDepartment);
departmentRoutes.route('/:id').get(getDepartment).patch(authorize('Admin', 'HR Manager'), updateDepartment).delete(authorize('Admin'), deleteDepartment);

export const performanceRoutes = express.Router();
performanceRoutes.use(protect);
performanceRoutes.route('/').get(list(PerformanceReview, { populate: reviewPopulate })).post(authorize('Admin', 'HR Manager'), createOne(PerformanceReview, { beforeCreate: async (req) => ({ ...req.body, reviewer: req.user._id }) }));
performanceRoutes.route('/:id').get(getOne(PerformanceReview, { populate: reviewPopulate })).patch(authorize('Admin', 'HR Manager'), updateOne(PerformanceReview)).delete(authorize('Admin'), deleteOne(PerformanceReview));

export const announcementRoutes = express.Router();
announcementRoutes.use(protect);
announcementRoutes.route('/').get(list(Announcement, { populate: announcementPopulate })).post(authorize('Admin', 'HR Manager'), createOne(Announcement, { beforeCreate: async (req) => ({ ...req.body, publishedBy: req.user._id }) }));
announcementRoutes.route('/:id').get(getOne(Announcement, { populate: announcementPopulate })).patch(authorize('Admin', 'HR Manager'), updateOne(Announcement)).delete(authorize('Admin'), deleteOne(Announcement));

export const notificationRoutes = express.Router();
notificationRoutes.use(protect);
notificationRoutes.get('/', list(Notification, { scope: async (req) => ({ user: req.user._id }) }));
notificationRoutes.patch('/:id/read', updateOne(Notification, { scope: async (req) => ({ user: req.user._id }) }));
