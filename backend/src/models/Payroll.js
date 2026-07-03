import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    basicSalary: { type: Number, required: true },
    allowance: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    deduction: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    month: { type: Number, min: 1, max: 12, required: true },
    year: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

payrollSchema.pre('save', function calculateNet(next) {
  this.netSalary = this.basicSalary + this.allowance + this.bonus - this.deduction - this.tax;
  next();
});

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Payroll', payrollSchema);
