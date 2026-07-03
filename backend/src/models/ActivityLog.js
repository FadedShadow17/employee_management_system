import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: String,
    entity: String,
    entityId: mongoose.Schema.Types.ObjectId,
    message: String
  },
  { timestamps: true }
);

export default mongoose.model('ActivityLog', activityLogSchema);
