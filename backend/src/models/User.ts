import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  image?: string;
  username?: string;
  bio?: string;
  location?: string;
  sustainabilityFocusAreas: string[];
  role: 'user' | 'org_admin' | 'admin';
  totalCarbonSaved: number;
  totalCommitments: number;
  completedMilestones: number;
  level: number;
  badges: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    location: {
      type: String,
    },
    sustainabilityFocusAreas: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      enum: ['user', 'org_admin', 'admin'],
      default: 'user',
    },
    totalCarbonSaved: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCommitments: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedMilestones: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    badges: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ totalCarbonSaved: -1 });
UserSchema.index({ level: -1 });

export default mongoose.model<IUser>('User', UserSchema);
