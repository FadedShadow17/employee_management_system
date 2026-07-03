import mongoose from 'mongoose';
import { encryptionPlugin } from '../utils/encryptionPlugin.js';

const payrollSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    basicSalary: { type: String, required: true },   // Encrypted
    allowance: { type: String, default: '0' },       // Encrypted
    bonus: { type: String, default: '0' },           // Encrypted
    deduction: { type: String, default: '0' },       // Encrypted
    tax: { type: String, default: '0' },             // Encrypted
    netSalary: { type: String, default: '0' },       // Encrypted
    month: { type: Number, min: 1, max: 12, required: true },
    year: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Apply encryption to all financial fields
payrollSchema.plugin(encryptionPlugin, {
  numericFields: ['basicSalary', 'allowance', 'bonus', 'deduction', 'tax', 'netSalary']
});

// Calculate net salary before encryption (runs before the plugin's pre-save)
payrollSchema.pre('save', function calculateNet(next) {
  // Convert to numbers for calculation (values may already be numbers from API input)
  const basic = Number(this.basicSalary) || 0;
  const allowance = Number(this.allowance) || 0;
  const bonus = Number(this.bonus) || 0;
  const deduction = Number(this.deduction) || 0;
  const tax = Number(this.tax) || 0;

  this.netSalary = String(basic + allowance + bonus - deduction - tax);
  next();
});

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Payroll', payrollSchema);
