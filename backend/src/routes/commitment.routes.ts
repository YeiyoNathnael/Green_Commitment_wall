import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import {
  createCommitment,
  getCommitment,
  updateCommitment,
  deleteCommitment,
  likeCommitment,
  addComment,
  getComments,
  getUserCommitments,
} from '../controllers/commitment.controller';

const router = Router();

// Validation rules
const createCommitmentValidation = [
  body('text').trim().isLength({ min: 10, max: 2000 }).withMessage('Text must be 10-2000 characters'),
  body('mediaType').optional().isIn(['text', 'image', 'video']),
  body('duration').optional().isString(),
  body('visibility').optional().isIn(['public', 'private', 'group']),
];

const commentValidation = [
  body('text').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters'),
];

// Routes
router.post('/', authenticate, validate(createCommitmentValidation), createCommitment);
router.get('/:id', getCommitment);
router.patch('/:id', authenticate, updateCommitment);
router.delete('/:id', authenticate, deleteCommitment);

// Social interactions
router.post('/:id/like', authenticate, likeCommitment);
router.post('/:id/comments', authenticate, validate(commentValidation), addComment);
router.get('/:id/comments', getComments);

// User commitments
router.get('/user/:userId', getUserCommitments);

export default router;
