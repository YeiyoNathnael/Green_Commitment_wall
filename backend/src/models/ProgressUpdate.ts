import mongoose, { Schema, Document } from 'mongoose';

export interface IProgressUpdate extends Document {
  commitmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: string;
  date: Date;
  deltaCarbonSaved: number;
  note?: string;
  createdAt: Date;
}

const ProgressUpdateSchema: Schema = new Schema(
  {
    commitmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Commitment',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deltaCarbonSaved: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for queries
ProgressUpdateSchema.index({ commitmentId: 1, date: -1 });
ProgressUpdateSchema.index({ userId: 1, date: -1 });

export default mongoose.model<IProgressUpdate>('ProgressUpdate', ProgressUpdateSchema);
