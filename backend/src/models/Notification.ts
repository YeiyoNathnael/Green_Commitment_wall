import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'like' | 'comment' | 'milestone' | 'reminder' | 'admin' | 'challenge';
  message: string;
  data: {
    commitmentId?: string;
    commentId?: string;
    challengeId?: string;
    [key: string]: any;
  };
  read: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['like', 'comment', 'milestone', 'reminder', 'admin', 'challenge'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
