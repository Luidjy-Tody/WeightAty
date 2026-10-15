import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  createConversationController,
  getConversationController,
  listConversationsController,
  listMessagesController,
  sendMessageController,
} from './message.controller.js';

/** Routes de la messagerie (l'identité provient du jeton). */
const router = Router();

router.get('/', authenticate, asyncHandler(listConversationsController));
router.post('/', authenticate, asyncHandler(createConversationController));
router.get('/:id', authenticate, asyncHandler(getConversationController));
router.get('/:id/messages', authenticate, asyncHandler(listMessagesController));
router.post('/:id/messages', authenticate, asyncHandler(sendMessageController));

export default router;
