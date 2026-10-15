import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { listMyPaiementsController } from './paiement.controller.js';

/** Routes des paiements (l'identité provient du jeton). */
const router = Router();

router.get('/me', authenticate, asyncHandler(listMyPaiementsController));

export default router;
