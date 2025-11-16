import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  commitmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
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
    text: {
      type: String,
      required: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CommentSchema.index({ commitmentId: 1, createdAt: -1 });

export default mongoose.model<IComment>('Comment', CommentSchema);
