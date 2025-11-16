import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Commitment from '../models/Commitment';
import ProgressUpdate from '../models/ProgressUpdate';
import Milestone from '../models/Milestone';
import { updateUserStats } from '../services/gamification.service';
import { notifyMilestone } from '../services/notification.service';
import { AppError } from '../middleware/errorHandler';

/**
 * Add progress update to a commitment
 */
export async function addProgressUpdate(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { amount, note, deltaCarbonSaved } = req.body;
    const commitment = await Commitment.findById(req.params.id);

    if (!commitment) {
      throw new AppError('Commitment not found', 404);
    }

    if (commitment.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update this commitment', 403);
    }

    // Create progress update
    const progressUpdate = await ProgressUpdate.create({
      commitmentId: commitment._id,
      userId: req.user._id,
      amount,
      note,
      deltaCarbonSaved: deltaCarbonSaved || 0,
      date: new Date(),
    });

    // Update commitment actual carbon saved
    commitment.actualCarbonSaved += deltaCarbonSaved || 0;
    await commitment.save();

    // Update user stats
    await updateUserStats(req.user._id.toString(), {
      carbonDelta: deltaCarbonSaved || 0,
    });

    // Check and update milestones
    const milestones = await Milestone.find({
      commitmentId: commitment._id,
      status: { $in: ['pending', 'in_progress'] },
    });

    for (const milestone of milestones) {
      milestone.currentValue += 1; // Increment progress count

      if (milestone.currentValue >= milestone.targetValue && milestone.status !== 'completed') {
        milestone.status = 'completed';
        milestone.completedAt = new Date();

        // Update user completed milestones
        await updateUserStats(req.user._id.toString(), { milestonesDelta: 1 });

        // Notify user
        await notifyMilestone(
          req.user._id,
          milestone.title,
          commitment._id.toString()
        );
      } else if (milestone.currentValue > 0 && milestone.status === 'pending') {
        milestone.status = 'in_progress';
      }

      await milestone.save();
    }

    res.status(201).json({
      status: 'success',
      data: {
        progressUpdate,
        updatedMilestones: milestones,
        commitment: {
          actualCarbonSaved: commitment.actualCarbonSaved,
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to add progress update', 500);
  }
}

/**
 * Get progress updates for a commitment
 */
export async function getProgressUpdates(req: AuthRequest, res: Response): Promise<void> {
  try {
    const progressUpdates = await ProgressUpdate.find({
      commitmentId: req.params.id,
    })
      .sort({ date: -1 })
      .limit(50);

    res.json({
      status: 'success',
      data: { progressUpdates },
    });
  } catch (error) {
    throw new AppError('Failed to fetch progress updates', 500);
  }
}

/**
 * Get user dashboard with aggregated stats
 */
export async function getUserDashboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const userId = req.user._id;

    // Get user commitments
    const [
      activeCommitments,
      completedCommitments,
      totalMilestones,
      completedMilestones,
      recentProgress,
    ] = await Promise.all([
      Commitment.countDocuments({ userId, status: 'active' }),
      Commitment.countDocuments({ userId, status: 'completed' }),
      Milestone.countDocuments({
        commitmentId: { $in: await Commitment.find({ userId }).distinct('_id') },
      }),
      Milestone.countDocuments({
        commitmentId: { $in: await Commitment.find({ userId }).distinct('_id') },
        status: 'completed',
      }),
      ProgressUpdate.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('commitmentId', 'text category'),
    ]);

    // Carbon savings over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const carbonHistory = await ProgressUpdate.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          carbonSaved: { $sum: '$deltaCarbonSaved' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Category breakdown
    const categoryBreakdown = await Commitment.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          carbonSaved: { $sum: '$actualCarbonSaved' },
        },
      },
    ]);

    res.json({
      status: 'success',
      data: {
        stats: {
          totalCarbonSaved: req.user.totalCarbonSaved,
          level: req.user.level,
          badges: req.user.badges,
          activeCommitments,
          completedCommitments,
          totalMilestones,
          completedMilestones,
        },
        carbonHistory,
        categoryBreakdown,
        recentProgress,
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch dashboard data', 500);
  }
}

/**
 * Get milestones for a commitment
 */
export async function getMilestones(req: AuthRequest, res: Response): Promise<void> {
  try {
    const milestones = await Milestone.find({
      commitmentId: req.params.id,
    }).sort({ createdAt: 1 });

    res.json({
      status: 'success',
      data: { milestones },
    });
  } catch (error) {
    throw new AppError('Failed to fetch milestones', 500);
  }
}
