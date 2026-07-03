import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activity.js';

const parseListQuery = (query) => {
  const { page = 1, limit = 10, sort = '-createdAt', search, ...filters } = query;
  // Sanitize: cap limit to prevent excessive data exposure
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined));
  return { page: safePage, limit: safeLimit, sort, search, filters: cleanFilters };
};

export const list = (Model, options = {}) => asyncHandler(async (req, res) => {
  const { page, limit, sort, search, filters } = parseListQuery(req.query);
  const query = { ...filters, ...(options.scope ? await options.scope(req) : {}) };
  if (search) query.$text = { $search: search };

  // Only allow sort on predefined fields to prevent information leakage
  const allowedSorts = options.allowedSorts || ['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name'];
  const safeSort = allowedSorts.includes(sort) ? sort : '-createdAt';

  const [data, total] = await Promise.all([
    Model.find(query)
      .populate(options.populate || '')
      .sort(safeSort)
      .skip((page - 1) * limit)
      .limit(limit),
    Model.countDocuments(query)
  ]);
  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

export const getOne = (Model, options = {}) => asyncHandler(async (req, res) => {
  const doc = await Model.findOne({ _id: req.params.id, ...(options.scope ? await options.scope(req) : {}) }).populate(options.populate || '');
  if (!doc) throw new AppError('Record not found', 404);
  res.json({ success: true, data: doc });
});

export const createOne = (Model, options = {}) => asyncHandler(async (req, res) => {
  // Apply field whitelist if provided (mass assignment prevention)
  let payload = req.body;
  if (options.allowedFields) {
    payload = Object.fromEntries(
      Object.entries(payload).filter(([key]) => options.allowedFields.includes(key))
    );
  }
  if (options.beforeCreate) {
    payload = await options.beforeCreate(req);
  }
  const doc = await Model.create(payload);
  await logActivity({ user: req.user._id, action: 'create', entity: Model.modelName, entityId: doc._id, message: `${Model.modelName} created` });
  res.status(201).json({ success: true, data: doc });
});

export const updateOne = (Model, options = {}) => asyncHandler(async (req, res) => {
  // Apply field whitelist if provided (mass assignment prevention)
  let payload = req.body;
  if (options.allowedFields) {
    payload = Object.fromEntries(
      Object.entries(payload).filter(([key]) => options.allowedFields.includes(key))
    );
  }

  // Prevent direct modification of security-sensitive fields
  const forbiddenFields = ['_id', '__v', 'createdAt', 'updatedAt', 'createdBy'];
  for (const field of forbiddenFields) {
    delete payload[field];
  }

  const doc = await Model.findOneAndUpdate(
    { _id: req.params.id, ...(options.scope ? await options.scope(req) : {}) },
    payload,
    { new: true, runValidators: true }
  );
  if (!doc) throw new AppError('Record not found', 404);
  await logActivity({ user: req.user._id, action: 'update', entity: Model.modelName, entityId: doc._id, message: `${Model.modelName} updated` });
  res.json({ success: true, data: doc });
});

export const deleteOne = (Model, options = {}) => asyncHandler(async (req, res) => {
  const query = { _id: req.params.id, ...(options.scope ? await options.scope(req) : {}) };
  const doc = await Model.findOneAndDelete(query);
  if (!doc) throw new AppError('Record not found', 404);
  await logActivity({ user: req.user._id, action: 'delete', entity: Model.modelName, entityId: doc._id, message: `${Model.modelName} deleted` });
  res.json({ success: true, data: doc });
});
