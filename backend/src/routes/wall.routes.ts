import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import {
  getWallFeed,
  getTrendingCommitments,
  getTopContributors,
  getWallStats,
} from '../controllers/wall.controller';

const router = Router();

// Wall feed with optional auth (to show liked status)
router.get('/', optionalAuth, getWallFeed);
router.get('/trending', getTrendingCommitments);
router.get('/contributors', getTopContributors);
router.get('/stats', getWallStats);

export default router;
