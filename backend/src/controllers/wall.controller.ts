import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Commitment from '../models/Commitment';
import { AppError } from '../middleware/errorHandler';

/**
 * Get wall feed with filtering and sorting
 */
export async function getWallFeed(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      sort = 'recent',
      category,
      dateRange,
      carbonRange,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    // Build query
    const query: any = { visibility: 'public', status: 'active' };

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Date range filter
    if (dateRange) {
      const now = new Date();
      const ranges: { [key: string]: Date } = {
        today: new Date(now.setHours(0, 0, 0, 0)),
        week: new Date(now.setDate(now.getDate() - 7)),
        month: new Date(now.setMonth(now.getMonth() - 1)),
        year: new Date(now.setFullYear(now.getFullYear() - 1)),
      };

      if (ranges[dateRange as string]) {
        query.createdAt = { $gte: ranges[dateRange as string] };
      }
    }

    // Carbon range filter
    if (carbonRange) {
      const [min, max] = (carbonRange as string).split('-').map(Number);
      query['estimatedCarbonSavings.total'] = { $gte: min, $lte: max || Number.MAX_VALUE };
    }

    // Search filter
    if (search) {
      query.text = { $regex: search as string, $options: 'i' };
    }

    // Sorting
    let sortOptions: any = {};
    switch (sort) {
      case 'impact':
        sortOptions = { 'estimatedCarbonSavings.total': -1 };
        break;
      case 'popular':
        sortOptions = { likeCount: -1 };
        break;
      case 'recent':
      default:
        sortOptions = { createdAt: -1 };
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [commitments, total] = await Promise.all([
      Commitment.find(query)
        .populate('userId', 'name email image username level badges')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Commitment.countDocuments(query),
    ]);

    // Check if user has liked each commitment
    if (req.user) {
      commitments.forEach((commitment: any) => {
        commitment._doc.isLiked = commitment.likes.some(
          (id: any) => id.toString() === req.user!._id.toString()
        );
      });
    }

    res.json({
      status: 'success',
      data: {
        commitments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch wall feed', 500);
  }
}

/**
 * Get trending commitments
 */
export async function getTrendingCommitments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { limit = '10' } = req.query;

    // Get commitments from last 7 days, sorted by engagement
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const commitments = await Commitment.find({
      visibility: 'public',
      status: 'active',
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate('userId', 'name email image username level')
      .sort({ likeCount: -1, commentCount: -1 })
      .limit(parseInt(limit as string));

    res.json({
      status: 'success',
      data: { commitments },
    });
  } catch (error) {
    throw new AppError('Failed to fetch trending commitments', 500);
  }
}

/**
 * Get top contributors (users with most carbon saved)
 */
export async function getTopContributors(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { limit = '10' } = req.query;

    const topCommitments = await Commitment.aggregate([
      { $match: { visibility: 'public', status: 'active' } },
      {
        $group: {
          _id: '$userId',
          totalCarbonSaved: { $sum: '$actualCarbonSaved' },
          commitmentCount: { $sum: 1 },
        },
      },
      { $sort: { totalCarbonSaved: -1 } },
      { $limit: parseInt(limit as string) },
    ]);

    // Populate user details
    const userIds = topCommitments.map((c) => c._id);
    const User = require('../models/User').default;
    const users = await User.find({ _id: { $in: userIds } })
      .select('name email image username level badges totalCarbonSaved');

    const contributors = topCommitments.map((tc) => {
      const user = users.find((u: any) => u._id.toString() === tc._id.toString());
      return {
        user,
        totalCarbonSaved: tc.totalCarbonSaved,
        commitmentCount: tc.commitmentCount,
      };
    });

    res.json({
      status: 'success',
      data: { contributors },
    });
  } catch (error) {
    throw new AppError('Failed to fetch top contributors', 500);
  }
}

/**
 * Get wall statistics
 */
export async function getWallStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [
      totalCommitments,
      totalCarbonSaved,
      activeUsers,
      categoryBreakdown,
    ] = await Promise.all([
      Commitment.countDocuments({ visibility: 'public', status: 'active' }),
      Commitment.aggregate([
        { $match: { visibility: 'public' } },
        { $group: { _id: null, total: { $sum: '$actualCarbonSaved' } } },
      ]),
      Commitment.distinct('userId', { visibility: 'public', status: 'active' }),
      Commitment.aggregate([
        { $match: { visibility: 'public', status: 'active' } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            carbonSaved: { $sum: '$actualCarbonSaved' },
          },
        },
      ]),
    ]);

    res.json({
      status: 'success',
      data: {
        totalCommitments,
        totalCarbonSaved: totalCarbonSaved[0]?.total || 0,
        activeUsers: activeUsers.length,
        categoryBreakdown,
      },
    });
  } catch (error) {
    throw new AppError('Failed to fetch wall statistics', 500);
  }
}
