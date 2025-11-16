import mongoose, { Schema, Document } from 'mongoose';

export interface ICommitment extends Document {
  userId: mongoose.Types.ObjectId;
  text: string;
  mediaType: 'text' | 'image' | 'video';
  mediaUrl?: string;
  category: 'transport' | 'energy' | 'food' | 'waste' | 'water' | 'consumption' | 'other';
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  duration?: string;
  visibility: 'public' | 'private' | 'group';
  estimatedCarbonSavings: {
    perPeriod: number;
    total: number;
    unit: string;
  };
  actualCarbonSaved: number;
  status: 'active' | 'completed' | 'archived';
  likeCount: number;
  commentCount: number;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CommitmentSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    mediaType: {
      type: String,
      enum: ['text', 'image', 'video'],
      default: 'text',
    },
    mediaUrl: {
      type: String,
    },
    category: {
      type: String,
      enum: ['transport', 'energy', 'food', 'waste', 'water', 'consumption', 'other'],
      required: true,
      index: true,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'once'],
      required: true,
    },
    duration: {
      type: String,
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'group'],
      default: 'public',
      index: true,
    },
    estimatedCarbonSavings: {
      perPeriod: {
        type: Number,
        required: true,
        min: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
      unit: {
        type: String,
        default: 'kg CO2',
      },
    },
    actualCarbonSaved: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for queries
CommitmentSchema.index({ userId: 1, status: 1 });
CommitmentSchema.index({ visibility: 1, createdAt: -1 });
CommitmentSchema.index({ category: 1, visibility: 1 });
CommitmentSchema.index({ 'estimatedCarbonSavings.total': -1 });
CommitmentSchema.index({ createdAt: -1 });

export default mongoose.model<ICommitment>('Commitment', CommitmentSchema);
