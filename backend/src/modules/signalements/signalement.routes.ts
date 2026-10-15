import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { createSignalementController } from './signalement.controller.js';

/** Routes des signalements (l'auteur provient du jeton). */
const router = Router();

router.post('/', authenticate, asyncHandler(createSignalementController));

export default router;
