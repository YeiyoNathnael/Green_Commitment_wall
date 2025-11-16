import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';
import Challenge from '../models/Challenge';
import Organization from '../models/Organization';
import Flag from '../models/Flag';
import Commitment from '../models/Commitment';
import Comment from '../models/Comment';
import { AppError } from '../middleware/errorHandler';
import { notifyChallenge } from '../services/notification.service';

/**
 * Get user notifications
 */
export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { unreadOnly = 'false', limit = '50' } = req.query;
    const query: any = { userId: req.user._id };

    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    res.json({
      status: 'success',
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch notifications', 500);
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    res.json({
      status: 'success',
      data: { notification },
    });
  } catch (error) {
    throw new AppError('Failed to mark notification as read', 500);
  }
}

/**
 * Create a challenge
 */
export async function createChallenge(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { title, description, startDate, endDate, targetCarbonSavings, visibility } = req.body;

    const challenge = await Challenge.create({
      createdByUserId: req.user._id,
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      targetCarbonSavings,
      visibility: visibility || 'public',
      participantIds: [req.user._id],
    });

    res.status(201).json({
      status: 'success',
      data: { challenge },
    });
  } catch (error) {
    throw new AppError('Failed to create challenge', 500);
  }
}

/**
 * Join a challenge
 */
export async function joinChallenge(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      throw new AppError('Challenge not found', 404);
    }

    if (challenge.participantIds.includes(req.user._id)) {
      throw new AppError('Already joined this challenge', 400);
    }

    challenge.participantIds.push(req.user._id);
    await challenge.save();

    // Notify challenge creator
    if (challenge.createdByUserId) {
      await notifyChallenge(
        challenge.createdByUserId,
        `${req.user.name} joined your challenge: ${challenge.title}`,
        challenge._id.toString()
      );
    }

    res.json({
      status: 'success',
      data: { challenge },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to join challenge', 500);
  }
}

/**
 * Get challenge details
 */
export async function getChallenge(req: AuthRequest, res: Response): Promise<void> {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('createdByUserId', 'name email image')
      .populate('participantIds', 'name email image level');

    if (!challenge) {
      throw new AppError('Challenge not found', 404);
    }

    res.json({
      status: 'success',
      data: { challenge },
    });
  } catch (error) {
    throw new AppError('Failed to fetch challenge', 500);
  }
}

/**
 * Get all challenges
 */
export async function getChallenges(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status = 'active', limit = '20' } = req.query;
    const now = new Date();

    const query: any = { visibility: 'public' };

    if (status === 'active') {
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (status === 'upcoming') {
      query.startDate = { $gt: now };
    } else if (status === 'completed') {
      query.endDate = { $lt: now };
    }

    const challenges = await Challenge.find(query)
      .populate('createdByUserId', 'name image')
      .sort({ startDate: -1 })
      .limit(parseInt(limit as string));

    res.json({
      status: 'success',
      data: { challenges },
    });
  } catch (error) {
    throw new AppError('Failed to fetch challenges', 500);
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { metric = 'carbonSaved', period = 'all', limit = '50' } = req.query;

    let dateFilter = {};
    if (period !== 'all') {
      const now = new Date();
      const periodMap: { [key: string]: Date } = {
        today: new Date(now.setHours(0, 0, 0, 0)),
        week: new Date(now.setDate(now.getDate() - 7)),
        month: new Date(now.setMonth(now.getMonth() - 1)),
      };

      if (periodMap[period as string]) {
        dateFilter = { updatedAt: { $gte: periodMap[period as string] } };
      }
    }

    const User = require('../models/User').default;
    let sortField = {};

    if (metric === 'carbonSaved') {
      sortField = { totalCarbonSaved: -1 };
    } else if (metric === 'commitments') {
      sortField = { totalCommitments: -1 };
    } else if (metric === 'level') {
      sortField = { level: -1, totalCarbonSaved: -1 };
    }

    const leaders = await User.find(dateFilter)
      .select('name email image username level totalCarbonSaved totalCommitments badges')
      .sort(sortField)
      .limit(parseInt(limit as string));

    res.json({
      status: 'success',
      data: { leaders },
    });
  } catch (error) {
    throw new AppError('Failed to fetch leaderboard', 500);
  }
}

/**
 * Flag content (commitment or comment)
 */
export async function flagContent(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { contentType, contentId, reason } = req.body;

    const flag = await Flag.create({
      contentType,
      contentId,
      flaggedByUserId: req.user._id,
      reason,
      status: 'open',
    });

    res.status(201).json({
      status: 'success',
      data: { flag },
    });
  } catch (error) {
    throw new AppError('Failed to flag content', 500);
  }
}

/**
 * Get organization details
 */
export async function getOrganization(req: AuthRequest, res: Response): Promise<void> {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('adminUserIds', 'name email image')
      .populate('memberUserIds', 'name email image level totalCarbonSaved');

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    res.json({
      status: 'success',
      data: { organization },
    });
  } catch (error) {
    throw new AppError('Failed to fetch organization', 500);
  }
}

/**
 * Get CSR report for organization
 */
export async function getCSRReport(req: AuthRequest, res: Response): Promise<void> {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    // Aggregate commitment data for members
    const memberCommitments = await Commitment.aggregate([
      { $match: { userId: { $in: organization.memberUserIds } } },
      {
        $group: {
          _id: null,
          totalCarbonSaved: { $sum: '$actualCarbonSaved' },
          totalCommitments: { $sum: 1 },
          activeCommitments: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
        },
      },
    ]);

    // Category breakdown
    const categoryBreakdown = await Commitment.aggregate([
      { $match: { userId: { $in: organization.memberUserIds } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          carbonSaved: { $sum: '$actualCarbonSaved' },
        },
      },
    ]);

    const stats = memberCommitments[0] || {
      totalCarbonSaved: 0,
      totalCommitments: 0,
      activeCommitments: 0,
    };

    res.json({
      status: 'success',
      data: {
        organization,
        stats,
        categoryBreakdown,
        memberCount: organization.memberUserIds.length,
      },
    });
  } catch (error) {
    throw new AppError('Failed to generate CSR report', 500);
  }
}

/**
 * Admin: Get all flags
 */
export async function getFlags(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status = 'open' } = req.query;

    const flags = await Flag.find({ status })
      .populate('flaggedByUserId', 'name email')
      .populate('resolvedByUserId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: { flags },
    });
  } catch (error) {
    throw new AppError('Failed to fetch flags', 500);
  }
}

/**
 * Admin: Resolve flag
 */
export async function resolveFlag(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { action } = req.body; // 'resolve' or 'delete'
    const flag = await Flag.findById(req.params.id);

    if (!flag) {
      throw new AppError('Flag not found', 404);
    }

    flag.status = 'resolved';
    flag.resolvedByUserId = req.user._id;
    flag.resolvedAt = new Date();
    await flag.save();

    // If action is delete, remove the content
    if (action === 'delete') {
      if (flag.contentType === 'commitment') {
        await Commitment.findByIdAndDelete(flag.contentId);
      } else if (flag.contentType === 'comment') {
        await Comment.findByIdAndDelete(flag.contentId);
      }
    }

    res.json({
      status: 'success',
      data: { flag },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to resolve flag', 500);
  }
}
