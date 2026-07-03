import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['Admin', 'HR Manager', 'Employee'], default: 'Employee' },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    avatar: String,
    isActive: { type: Boolean, default: true },

    // MFA fields
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorBackupCodes: [{ type: String, select: false }],

    // Password policy fields
    passwordHistory: [{ type: String, select: false }], // Stores last 5 hashed passwords
    passwordChangedAt: { type: Date, default: Date.now },
    passwordExpiresAt: { type: Date }, // Set to 90 days from last change
    mustChangePassword: { type: Boolean, default: false } // Force password change on next login
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  // Store current password in history before hashing the new one
  if (this.password && !this.isNew) {
    // Only add to history if there's an existing hashed password (not on create)
    const existingHash = this.$__.saveOptions?._previousPassword;
    if (existingHash) {
      if (!this.passwordHistory) this.passwordHistory = [];
      this.passwordHistory.unshift(existingHash);
      // Keep only last 5 passwords
      if (this.passwordHistory.length > 5) {
        this.passwordHistory = this.passwordHistory.slice(0, 5);
      }
    }
  }

  this.password = await bcrypt.hash(this.password, 12);

  // Update password timestamps
  this.passwordChangedAt = new Date();
  this.passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Check if password was used before (reuse prevention)
userSchema.methods.isPasswordReused = async function isPasswordReused(candidate) {
  if (!this.passwordHistory || this.passwordHistory.length === 0) return false;
  for (const oldHash of this.passwordHistory) {
    const match = await bcrypt.compare(candidate, oldHash);
    if (match) return true;
  }
  return false;
};

// Check if password has expired
userSchema.methods.isPasswordExpired = function isPasswordExpired() {
  if (!this.passwordExpiresAt) return false;
  return Date.now() > this.passwordExpiresAt.getTime();
};

export default mongoose.model('User', userSchema);
