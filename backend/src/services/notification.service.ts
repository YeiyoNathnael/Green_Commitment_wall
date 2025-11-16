import Notification from '../models/Notification';
import mongoose from 'mongoose';

export interface NotificationData {
  userId: string | mongoose.Types.ObjectId;
  type: 'like' | 'comment' | 'milestone' | 'reminder' | 'admin' | 'challenge';
  message: string;
  data?: {
    commitmentId?: string;
    commentId?: string;
    challengeId?: string;
    [key: string]: any;
  };
}

/**
 * Create a notification for a user
 */
export async function createNotification(notificationData: NotificationData): Promise<void> {
  try {
    await Notification.create({
      userId: notificationData.userId,
      type: notificationData.type,
      message: notificationData.message,
      data: notificationData.data || {},
      read: false,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Create notifications for commitment likes
 */
export async function notifyLike(
  commitmentOwnerId: string | mongoose.Types.ObjectId,
  likerName: string,
  commitmentId: string
): Promise<void> {
  await createNotification({
    userId: commitmentOwnerId,
    type: 'like',
    message: `${likerName} liked your commitment`,
    data: { commitmentId },
  });
}

/**
 * Create notifications for commitment comments
 */
export async function notifyComment(
  commitmentOwnerId: string | mongoose.Types.ObjectId,
  commenterName: string,
  commitmentId: string,
  commentId: string
): Promise<void> {
  await createNotification({
    userId: commitmentOwnerId,
    type: 'comment',
    message: `${commenterName} commented on your commitment`,
    data: { commitmentId, commentId },
  });
}

/**
 * Create notifications for milestone completion
 */
export async function notifyMilestone(
  userId: string | mongoose.Types.ObjectId,
  milestoneTitle: string,
  commitmentId: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'milestone',
    message: `Congratulations! You've completed the milestone: ${milestoneTitle}`,
    data: { commitmentId },
  });
}

/**
 * Create reminder notifications
 */
export async function notifyReminder(
  userId: string | mongoose.Types.ObjectId,
  message: string,
  commitmentId: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'reminder',
    message,
    data: { commitmentId },
  });
}

/**
 * Create challenge notifications
 */
export async function notifyChallenge(
  userId: string | mongoose.Types.ObjectId,
  message: string,
  challengeId: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'challenge',
    message,
    data: { challengeId },
  });
}
