import mongoose, { Schema, Document } from 'mongoose';

export interface IChallenge extends Document {
  createdByOrgId?: mongoose.Types.ObjectId;
  createdByUserId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  visibility: 'public' | 'group' | 'org';
  participantIds: mongoose.Types.ObjectId[];
  targetCarbonSavings: number;
  currentCarbonSavings: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema: Schema = new Schema(
  {
    createdByOrgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'group', 'org'],
      default: 'public',
      index: true,
    },
    participantIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    targetCarbonSavings: {
      type: Number,
      required: true,
      min: 0,
    },
    currentCarbonSavings: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ChallengeSchema.index({ visibility: 1, startDate: -1 });
ChallengeSchema.index({ endDate: 1 });

export default mongoose.model<IChallenge>('Challenge', ChallengeSchema);
