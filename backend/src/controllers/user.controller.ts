import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';

/**
 * Get user profile
 */
export async function getUserProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.params.id).select('-__v');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch user profile', 500);
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    res.json({
      status: 'success',
      data: { user: req.user },
    });
  } catch (error) {
    throw new AppError('Failed to fetch current user', 500);
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { username, bio, location, sustainabilityFocusAreas } = req.body;
    const updates: any = {};

    if (username !== undefined) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (sustainabilityFocusAreas !== undefined) updates.sustainabilityFocusAreas = sustainabilityFocusAreas;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    throw new AppError('Failed to update user profile', 500);
  }
}
