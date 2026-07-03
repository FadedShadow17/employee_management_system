import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async ({ user, action, entity, entityId, message }) => {
  try {
    await ActivityLog.create({ user, action, entity, entityId, message });
  } catch {
    // Activity logging should never block the primary request.
  }
};
