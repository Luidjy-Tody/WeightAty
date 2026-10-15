import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  advanceEtapeController,
  confirmDeliveryController,
  createEvaluationController,
  getColisController,
  getRemunerationController,
  listMyColisController,
} from './colis.controller.js';

/**
 * Routes des colis. Toutes exigent un jeton : l'identité provient du jeton et
 * chaque action vérifie les droits (expéditeur / voyageur du colis).
 */
const router = Router();

router.get('/me', authenticate, asyncHandler(listMyColisController));
router.get('/:id', authenticate, asyncHandler(getColisController));
router.post('/:id/etapes', authenticate, asyncHandler(advanceEtapeController));
router.post('/:id/livraison', authenticate, asyncHandler(confirmDeliveryController));
router.get('/:id/remuneration', authenticate, asyncHandler(getRemunerationController));
router.post('/:id/evaluation', authenticate, asyncHandler(createEvaluationController));

export default router;
