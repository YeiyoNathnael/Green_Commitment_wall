import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Commitment from '../models/Commitment';
import Comment from '../models/Comment';
import { interpretCommitment, estimateCarbonSavings, suggestMilestones } from '../services/gemini.service';
import { updateUserStats, awardBadges } from '../services/gamification.service';
import { notifyLike, notifyComment } from '../services/notification.service';
import { AppError } from '../middleware/errorHandler';
import Milestone from '../models/Milestone';

/**
 * Create a new commitment with AI interpretation
 */
export async function createCommitment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { text, mediaUrl, mediaType, duration, visibility } = req.body;

    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    // AI interpretation
    const interpretation = await interpretCommitment(text);
    const carbonEstimate = await estimateCarbonSavings(interpretation, duration || '1 month');

    // Create commitment
    const commitment = await Commitment.create({
      userId: req.user._id,
      text,
      mediaUrl,
      mediaType: mediaType || 'text',
      category: interpretation.category,
      frequency: interpretation.frequency,
      duration: duration || '1 month',
      visibility: visibility || 'public',
      estimatedCarbonSavings: {
        perPeriod: carbonEstimate.perPeriod,
        total: carbonEstimate.total,
        unit: carbonEstimate.unit,
      },
      status: 'active',
    });

    // Update user stats
    await updateUserStats(req.user._id.toString(), { commitmentsDelta: 1 });

    // Award badges
    await awardBadges(req.user._id.toString(), 'commitment_created');

    // Generate milestones
    const milestoneSuggestions = await suggestMilestones(text, interpretation);
    const milestones = await Promise.all(
      milestoneSuggestions.map((ms) =>
        Milestone.create({
          commitmentId: commitment._id,
          title: ms.title,
          description: ms.description,
          targetValue: ms.targetValue,
          estimatedCarbonSavings: ms.estimatedCarbonSavings,
          status: 'pending',
        })
      )
    );

    res.status(201).json({
      status: 'success',
      data: {
        commitment,
        interpretation,
        carbonEstimate,
        milestones,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create commitment', 500);
  }
}

/**
 * Get commitment by ID
 */
export async function getCommitment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const commitment = await Commitment.findById(req.params.id)
      .populate('userId', 'name email image username');

    if (!commitment) {
      throw new AppError('Commitment not found', 404);
    }

    // Check if private and user has access
    if (commitment.visibility === 'private' && 
        (!req.user || commitment.userId._id.toString() !== req.user._id.toString())) {
      throw new AppError('Not authorized to view this commitment', 403);
    }

    // Get milestones
    const milestones = await Milestone.find({ commitmentId: commitment._id });

    res.json({
      status: 'success',
      data: {
        commitment,
        milestones,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch commitment', 500);
  }
}

/**
 * Update commitment
 */
export async function updateCommitment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const commitment = await Commitment.findById(req.params.id);

    if (!commitment) {
      throw new AppError('Commitment not found', 404);
    }

    if (!req.user || commitment.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update this commitment', 403);
    }

    const updates = req.body;
    Object.assign(commitment, updates);
    await commitment.save();

    res.json({
      status: 'success',
      data: { commitment },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update commitment', 500);
  }
}

/**
 * Delete commitment
 */
export async function deleteCommitment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const commitment = await Commitment.findById(req.params.id);

    if (!commitment) {
      throw new AppError('Commitment not found', 404);
    }

    if (!req.user || commitment.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to delete this commitment', 403);
    }

    await commitment.deleteOne();

    res.json({
      status: 'success',
      message: 'Commitment deleted',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete commitment', 500);
  }
}

/**
 * Like a commitment
 */
export async function likeCommitment(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const commitment = await Commitment.findById(req.params.id).populate('userId', 'name');

    if (!commitment) {
      throw new AppError('Commitment not found', 404);
    }

    const userId = req.user._id;
    const isLiked = commitment.likes.includes(userId);

    if (isLiked) {
      // Unlike
      commitment.likes = commitment.likes.filter(id => id.toString() !== userId.toString());
      commitment.likeCount = Math.max(0, commitment.likeCount - 1);
    } else {
      // Like
      commitment.likes.push(userId);
      commitment.likeCount += 1;

      // Notify commitment owner
      if (commitment.userId._id.toString() !== userId.toString()) {
        await notifyLike(
          commitment.userId._id,
          req.user.name,
          commitment._id.toString()
        );
      }
    }

    await commitment.save();

    res.json({
      status: 'success',
      data: {
        liked: !isLiked,
        likeCount: commitment.likeCount,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to like commitment', 500);
  }
}

/**
 * Add comment to commitment
 */
export async function addComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { text } = req.body;
    const commitment = await Commitment.findById(req.params.id).populate('userId', 'name');

    if (!commitment) {
      throw new AppError('Commitment not found', 404);
    }

    const comment = await Comment.create({
      commitmentId: commitment._id,
      userId: req.user._id,
      text,
    });

    commitment.commentCount += 1;
    await commitment.save();

    // Notify commitment owner
    if (commitment.userId._id.toString() !== req.user._id.toString()) {
      await notifyComment(
        commitment.userId._id,
        req.user.name,
        commitment._id.toString(),
        comment._id.toString()
      );
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name email image username');

    res.status(201).json({
      status: 'success',
      data: { comment: populatedComment },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to add comment', 500);
  }
}

/**
 * Get comments for commitment
 */
export async function getComments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const comments = await Comment.find({ commitmentId: req.params.id })
      .populate('userId', 'name email image username')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: { comments },
    });
  } catch (error) {
    throw new AppError('Failed to fetch comments', 500);
  }
}

/**
 * Get user's commitments
 */
export async function getUserCommitments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    // If not own profile, only show public
    if (!req.user || req.user._id.toString() !== userId) {
      query.visibility = 'public';
    }

    const commitments = await Commitment.find(query)
      .populate('userId', 'name email image username')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: { commitments },
    });
  } catch (error) {
    throw new AppError('Failed to fetch user commitments', 500);
  }
}
