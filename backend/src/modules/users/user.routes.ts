import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { sensitiveActionRateLimiter } from '../../middlewares/rate-limit.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  changePasswordController,
  deleteAccountController,
  deletePhoto,
  getMe,
  getMyReviews,
  getPreferencesController,
  getUserReviews,
  updateMe,
  updatePreferencesController,
  uploadPhoto,
} from './user.controller.js';

/**
 * Routes du profil utilisateur.
 * Toutes les routes exigent un jeton valide : l'identité provient du jeton.
 */
const router = Router();

router.get('/me', authenticate, asyncHandler(getMe));
router.put('/me', authenticate, asyncHandler(updateMe));
router.delete('/me', authenticate, sensitiveActionRateLimiter, asyncHandler(deleteAccountController));

router.get('/me/reviews', authenticate, asyncHandler(getMyReviews));

router.get('/me/preferences', authenticate, asyncHandler(getPreferencesController));
router.put('/me/preferences', authenticate, asyncHandler(updatePreferencesController));

router.put('/me/password', authenticate, sensitiveActionRateLimiter, asyncHandler(changePasswordController));

router.post('/me/photo', authenticate, asyncHandler(uploadPhoto));
router.delete('/me/photo', authenticate, asyncHandler(deletePhoto));

// Avis publics d'un utilisateur (voyageur).
router.get('/:id/reviews', authenticate, asyncHandler(getUserReviews));

export default router;
