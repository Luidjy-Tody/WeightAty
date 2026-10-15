import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  createTrajetController,
  getTrajetController,
  listMyTrajetsController,
} from './trajet.controller.js';

/** Routes des trajets (toutes authentifiées : l'identité vient du jeton). */
const router = Router();

router.post('/', authenticate, asyncHandler(createTrajetController));
router.get('/me', authenticate, asyncHandler(listMyTrajetsController));
router.get('/:id', authenticate, asyncHandler(getTrajetController));

export default router;
