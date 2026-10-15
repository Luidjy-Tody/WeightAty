import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { loginRateLimiter } from '../../middlewares/rate-limit.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  demoAccountsController,
  demoLoginController,
  loginController,
  logoutController,
  meController,
  registerController,
} from './auth.controller.js';

/** Routes d'authentification. */
const router = Router();

router.post('/register', asyncHandler(registerController));
router.post('/login', loginRateLimiter, asyncHandler(loginController));
router.post('/logout', authenticate, asyncHandler(logoutController));
router.get('/me', authenticate, asyncHandler(meController));

// Accès démonstration (désactivé par défaut en production, cf. DEMO_MODE).
router.get('/demo-accounts', asyncHandler(demoAccountsController));
router.post('/demo-login', loginRateLimiter, asyncHandler(demoLoginController));

export default router;
