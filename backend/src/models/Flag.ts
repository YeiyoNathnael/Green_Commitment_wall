import mongoose, { Schema, Document } from 'mongoose';

export interface IFlag extends Document {
  contentType: 'commitment' | 'comment';
  contentId: mongoose.Types.ObjectId;
  flaggedByUserId: mongoose.Types.ObjectId;
  reason: string;
  status: 'open' | 'resolved';
  resolvedByUserId?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FlagSchema: Schema = new Schema(
  {
    contentType: {
      type: String,
      enum: ['commitment', 'comment'],
      required: true,
    },
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    flaggedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
      index: true,
    },
    resolvedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FlagSchema.index({ status: 1, createdAt: -1 });
FlagSchema.index({ contentType: 1, contentId: 1 });

export default mongoose.model<IFlag>('Flag', FlagSchema);
