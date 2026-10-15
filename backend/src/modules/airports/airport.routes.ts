import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { searchAirportsController } from './airport.controller.js';

/** Routes des aéroports / villes de référence (accessibles aux utilisateurs connectés). */
const router = Router();

router.get('/', authenticate, asyncHandler(searchAirportsController));

export default router;
