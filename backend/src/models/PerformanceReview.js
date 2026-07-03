import mongoose from 'mongoose';

const performanceReviewSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    feedback: { type: String, required: true },
    goals: [String],
    reviewDate: { type: Date, default: Date.now },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default mongoose.model('PerformanceReview', performanceReviewSchema);
