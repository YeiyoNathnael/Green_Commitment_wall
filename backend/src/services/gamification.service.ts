import User, { IUser } from '../models/User';
import Notification from '../models/Notification';

/**
 * Calculate user level based on total carbon saved
 */
export function calculateLevel(totalCarbonSaved: number): number {
  // Level thresholds in kg CO2
  const levelThresholds = [0, 10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (totalCarbonSaved >= levelThresholds[i]) {
      return i + 1;
    }
  }
  
  return 1;
}

/**
 * Award badges to user based on achievements
 */
export async function awardBadges(userId: string, event: string, data?: any): Promise<string[]> {
  const user = await User.findById(userId);
  if (!user) return [];

  const newBadges: string[] = [];
  const existingBadges = user.badges || [];

  // Check for new badges
  const badgeChecks = [
    {
      badge: 'first_commitment',
      condition: event === 'commitment_created' && user.totalCommitments === 1,
      title: 'First Step',
    },
    {
      badge: 'commitment_5',
      condition: user.totalCommitments >= 5 && !existingBadges.includes('commitment_5'),
      title: '5 Commitments',
    },
    {
      badge: 'commitment_10',
      condition: user.totalCommitments >= 10 && !existingBadges.includes('commitment_10'),
      title: '10 Commitments',
    },
    {
      badge: 'first_milestone',
      condition: event === 'milestone_completed' && user.completedMilestones === 1,
      title: 'First Milestone',
    },
    {
      badge: 'carbon_10kg',
      condition: user.totalCarbonSaved >= 10 && !existingBadges.includes('carbon_10kg'),
      title: '10kg CO2 Saved',
    },
    {
      badge: 'carbon_100kg',
      condition: user.totalCarbonSaved >= 100 && !existingBadges.includes('carbon_100kg'),
      title: '100kg CO2 Saved',
    },
    {
      badge: 'carbon_1000kg',
      condition: user.totalCarbonSaved >= 1000 && !existingBadges.includes('carbon_1000kg'),
      title: '1 Ton CO2 Saved',
    },
    {
      badge: '7_day_streak',
      condition: event === 'streak' && data?.days === 7,
      title: '7 Day Streak',
    },
    {
      badge: '30_day_streak',
      condition: event === 'streak' && data?.days === 30,
      title: '30 Day Streak',
    },
  ];

  for (const check of badgeChecks) {
    if (check.condition && !existingBadges.includes(check.badge)) {
      newBadges.push(check.badge);
      existingBadges.push(check.badge);

      // Create notification for new badge
      await Notification.create({
        userId: user._id,
        type: 'milestone',
        message: `You've earned the "${check.title}" badge! 🎉`,
        data: { badge: check.badge },
        read: false,
      });
    }
  }

  if (newBadges.length > 0) {
    user.badges = existingBadges;
    await user.save();
  }

  return newBadges;
}

/**
 * Update user stats after commitment or progress update
 */
export async function updateUserStats(
  userId: string,
  updates: {
    carbonDelta?: number;
    commitmentsDelta?: number;
    milestonesDelta?: number;
  }
): Promise<IUser> {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (updates.carbonDelta) {
    user.totalCarbonSaved += updates.carbonDelta;
  }

  if (updates.commitmentsDelta) {
    user.totalCommitments += updates.commitmentsDelta;
  }

  if (updates.milestonesDelta) {
    user.completedMilestones += updates.milestonesDelta;
  }

  // Recalculate level
  user.level = calculateLevel(user.totalCarbonSaved);

  await user.save();

  // Check for new badges
  if (updates.carbonDelta && updates.carbonDelta > 0) {
    await awardBadges(userId, 'progress_update', updates);
  }

  return user;
}
