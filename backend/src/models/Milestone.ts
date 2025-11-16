import mongoose, { Schema, Document } from 'mongoose';

export interface IMilestone extends Document {
  commitmentId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  status: 'pending' | 'in_progress' | 'completed';
  estimatedCarbonSavings: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema: Schema = new Schema(
  {
    commitmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Commitment',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    targetValue: {
      type: Number,
      required: true,
      min: 0,
    },
    currentValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      index: true,
    },
    estimatedCarbonSavings: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MilestoneSchema.index({ commitmentId: 1, status: 1 });
MilestoneSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IMilestone>('Milestone', MilestoneSchema);
