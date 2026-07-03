import { AppError } from '../utils/AppError.js';

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(', ');
    throw new AppError(message, 400);
  }
  next();
};
