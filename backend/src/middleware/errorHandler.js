import { AppError } from '../utils/AppError.js';

export const notFound = (req, _res, next) => next(new AppError(`Route not found: ${req.originalUrl}`, 404));

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const errors = err.errors ? Object.values(err.errors).map((item) => item.message) : undefined;
  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : err.message || 'Server error',
    errors
  });
};
