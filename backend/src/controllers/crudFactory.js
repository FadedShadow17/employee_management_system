import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logActivity } from '../utils/activity.js';

const parseListQuery = (query) => {
  const { page = 1, limit = 10, sort = '-createdAt', search, ...filters } = query;
  const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined));
  return { page: Number(page), limit: Number(limit), sort, search, filters: cleanFilters };
};

export const list = (Model, options = {}) => asyncHandler(async (req, res) => {
  const { page, limit, sort, search, filters } = parseListQuery(req.query);
  const query = { ...filters, ...(options.scope ? await options.scope(req) : {}) };
  if (search) query.$text = { $search: search };
  const [data, total] = await Promise.all([
    Model.find(query)
      .populate(options.populate || '')
      .sort(sort)
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
  const payload = options.beforeCreate ? await options.beforeCreate(req) : req.body;
  const doc = await Model.create(payload);
  await logActivity({ user: req.user._id, action: 'create', entity: Model.modelName, entityId: doc._id, message: `${Model.modelName} created` });
  res.status(201).json({ success: true, data: doc });
});

export const updateOne = (Model, options = {}) => asyncHandler(async (req, res) => {
  const doc = await Model.findOneAndUpdate(
    { _id: req.params.id, ...(options.scope ? await options.scope(req) : {}) },
    req.body,
    { new: true, runValidators: true }
  );
  if (!doc) throw new AppError('Record not found', 404);
  await logActivity({ user: req.user._id, action: 'update', entity: Model.modelName, entityId: doc._id, message: `${Model.modelName} updated` });
  res.json({ success: true, data: doc });
});

export const deleteOne = (Model) => asyncHandler(async (req, res) => {
  const doc = await Model.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError('Record not found', 404);
  await logActivity({ user: req.user._id, action: 'delete', entity: Model.modelName, entityId: doc._id, message: `${Model.modelName} deleted` });
  res.json({ success: true, data: doc });
});
