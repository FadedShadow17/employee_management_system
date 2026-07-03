import mongoose from 'mongoose';
import { encryptionPlugin } from '../utils/encryptionPlugin.js';

const emergencyContactSchema = new mongoose.Schema(
  { name: String, relationship: String, phone: String },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String }, // Encrypted at rest
    address: { type: String }, // Encrypted at rest
    profileImage: String,
    dateOfBirth: { type: String }, // Stored as encrypted string
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'], default: 'Prefer not to say' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    jobTitle: { type: String, required: true },
    employmentType: { type: String, enum: ['Full Time', 'Part Time', 'Contract', 'Intern'], default: 'Full Time' },
    joiningDate: { type: Date, default: Date.now },
    salary: { type: String, default: '0' }, // Encrypted numeric field stored as string
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    skills: [String],
    emergencyContact: emergencyContactSchema,
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Apply field-level encryption to sensitive fields
employeeSchema.plugin(encryptionPlugin, {
  fields: ['phone', 'address', 'dateOfBirth'],
  numericFields: ['salary']
});

employeeSchema.index({ fullName: 'text', email: 'text', jobTitle: 'text' });

employeeSchema.pre('save', async function generateEmployeeId(next) {
  if (this.employeeId) return next();
  const count = await mongoose.model('Employee').countDocuments();
  this.employeeId = `EMP-${String(count + 1).padStart(5, '0')}`;
  next();
});

export default mongoose.model('Employee', employeeSchema);
