import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validator';
import {
  getNotifications,
  markNotificationRead,
  createChallenge,
  joinChallenge,
  getChallenge,
  getChallenges,
  getLeaderboard,
  flagContent,
  getOrganization,
  getCSRReport,
  getFlags,
  resolveFlag,
} from '../controllers/social.controller';

const router = Router();

// Notifications
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markNotificationRead);

// Challenges
const challengeValidation = [
  body('title').trim().isLength({ min: 5, max: 200 }),
  body('description').trim().isLength({ min: 10, max: 2000 }),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('targetCarbonSavings').isFloat({ min: 0 }),
];

router.post('/challenges', authenticate, validate(challengeValidation), createChallenge);
router.post('/challenges/:id/join', authenticate, joinChallenge);
router.get('/challenges/:id', getChallenge);
router.get('/challenges', getChallenges);

// Leaderboard
router.get('/leaderboard', getLeaderboard);

// Flag content
const flagValidation = [
  body('contentType').isIn(['commitment', 'comment']),
  body('contentId').isMongoId(),
  body('reason').trim().isLength({ min: 10, max: 1000 }),
];

router.post('/flag', authenticate, validate(flagValidation), flagContent);

// Organizations
router.get('/organizations/:id', getOrganization);
router.get('/organizations/:id/csr-report', getCSRReport);

// Admin routes
router.get('/admin/flags', authenticate, requireRole('admin'), getFlags);
router.patch('/admin/flags/:id', authenticate, requireRole('admin'), resolveFlag);

export default router;
