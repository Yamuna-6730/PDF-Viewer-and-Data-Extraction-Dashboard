import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser {
  _id?: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    currency: string;
    timezone: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserPreferencesSchema = new Schema({
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  language: {
    type: String,
    default: 'en'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  timezone: {
    type: String,
    default: 'UTC'
  }
}, { _id: false });

const UserSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  preferences: {
    type: UserPreferencesSchema,
    default: () => ({})
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString()
  },
  updatedAt: {
    type: String
  }
}, {
  timestamps: false,
  collection: 'users'
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

// Hash password before saving
UserSchema.pre('save', async function(this: IUserDocument, next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    
    // Update timestamp
    if (this.isModified() && !this.isNew) {
      this.updatedAt = new Date().toISOString();
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Update timestamp on pre-save
UserSchema.pre('save', function(this: IUserDocument, next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date().toISOString();
  }
  next();
});

// Instance method to check password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static methods
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model<IUserDocument>('User', UserSchema);
export default User;
