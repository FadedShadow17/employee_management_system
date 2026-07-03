import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Role-Based Access Control (RBAC) & IDOR Protection Middleware
 *
 * Provides:
 * 1. Object-level authorization (ownership checks)
 * 2. Field-level filtering (mass assignment prevention)
 * 3. Privilege escalation prevention
 * 4. Hierarchical role checks
 */

// ─────────────────────────────────────────────────────────────────────────────
// ROLE HIERARCHY
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_LEVELS = {
  'Admin': 3,
  'HR Manager': 2,
  'Employee': 1
};

/**
 * Check if a role has higher or equal privilege than another
 */
export const hasHigherRole = (userRole, targetRole) => {
  return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[targetRole] || 0);
};

// ─────────────────────────────────────────────────────────────────────────────
// FIELD WHITELISTING (Mass Assignment Prevention)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Middleware: Filter request body to only allowed fields based on role
 *
 * Usage:
 *   filterFields({
 *     'Admin': ['name', 'email', 'role', 'isActive', 'salary'],
 *     'HR Manager': ['name', 'email', 'salary'],
 *     'Employee': ['name', 'phone', 'address']
 *   })
 */
export const filterFields = (allowedByRole) => (req, _res, next) => {
  const role = req.user.role;
  const allowed = allowedByRole[role] || allowedByRole['Employee'] || [];

  // Filter body to only include allowed fields
  const filtered = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      filtered[key] = req.body[key];
    }
  }
  req.body = filtered;
  next();
};

/**
 * Simple field whitelist (same for all roles)
 */
export const allowOnly = (...fields) => (req, _res, next) => {
  const filtered = {};
  for (const key of fields) {
    if (req.body[key] !== undefined) {
      filtered[key] = req.body[key];
    }
  }
  req.body = filtered;
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNERSHIP VERIFICATION (IDOR Prevention)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Middleware: Verify the authenticated user owns the resource or has elevated role
 *
 * @param {Function} getOwnerId - Async function that receives (req) and returns the owner's user ID
 * @param {object} options - { allowRoles: ['Admin', 'HR Manager'] } - roles that bypass ownership check
 *
 * Usage:
 *   checkOwnership(
 *     async (req) => {
 *       const leave = await Leave.findById(req.params.id);
 *       return leave?.employee?.user?.toString();
 *     },
 *     { allowRoles: ['Admin', 'HR Manager'] }
 *   )
 */
export const checkOwnership = (getOwnerId, options = {}) => asyncHandler(async (req, _res, next) => {
  const { allowRoles = ['Admin'] } = options;

  // Elevated roles bypass ownership check
  if (allowRoles.includes(req.user.role)) return next();

  const ownerId = await getOwnerId(req);

  if (!ownerId) {
    throw new AppError('Resource not found', 404);
  }

  const currentUserId = req.user._id.toString();
  const ownerIdStr = ownerId.toString();

  if (currentUserId !== ownerIdStr) {
    throw new AppError('You do not have permission to access this resource', 403);
  }

  next();
});

/**
 * Middleware: Verify user can only access their own employee profile
 * (unless they are Admin or HR Manager)
 */
export const checkEmployeeAccess = asyncHandler(async (req, _res, next) => {
  if (['Admin', 'HR Manager'].includes(req.user.role)) return next();

  const requestedId = req.params.id;
  const userEmployeeId = req.user.employee?.toString();

  if (requestedId !== userEmployeeId) {
    throw new AppError('You can only access your own profile', 403);
  }

  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// PRIVILEGE ESCALATION PREVENTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Middleware: Prevent users from assigning roles higher than their own
 * Used on user creation/update endpoints
 */
export const preventRoleEscalation = (req, _res, next) => {
  const { role } = req.body;

  if (role) {
    const userLevel = ROLE_LEVELS[req.user.role] || 0;
    const targetLevel = ROLE_LEVELS[role] || 0;

    if (targetLevel > userLevel) {
      throw new AppError('You cannot assign a role higher than your own', 403);
    }
  }

  next();
};

/**
 * Middleware: Prevent users from modifying higher-privileged users
 */
export const preventUpwardModification = (Model) => asyncHandler(async (req, _res, next) => {
  if (req.user.role === 'Admin') return next(); // Admins can modify anyone

  const target = await Model.findById(req.params.id);
  if (!target) throw new AppError('Resource not found', 404);

  // If target is a User, check role directly
  const targetRole = target.role || 'Employee';
  const userLevel = ROLE_LEVELS[req.user.role] || 0;
  const targetLevel = ROLE_LEVELS[targetRole] || 0;

  if (targetLevel >= userLevel) {
    throw new AppError('You cannot modify a user with equal or higher privileges', 403);
  }

  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// SENSITIVE FIELD REDACTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Middleware: Remove sensitive fields from response based on role
 * Applied as a response transform in the controller
 *
 * Usage in controller:
 *   const data = redactForRole(employee.toObject(), req.user.role, {
 *     'Employee': ['salary', 'emergencyContact']
 *   });
 */
export const redactForRole = (data, role, hiddenByRole) => {
  const hidden = hiddenByRole[role] || [];
  if (hidden.length === 0) return data;

  const result = { ...data };
  for (const field of hidden) {
    delete result[field];
  }
  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITE MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Require the user to be the resource owner OR have specific roles
 * Commonly used pattern: "own data or admin"
 */
export const ownerOrRoles = (getOwnerId, ...roles) => {
  return checkOwnership(getOwnerId, { allowRoles: roles });
};
