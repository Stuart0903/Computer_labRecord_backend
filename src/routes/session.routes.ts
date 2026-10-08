import { Router } from 'express';
import * as sessionsController from "../controllers/session.controller.js"
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', sessionsController.listSessions);
router.post('/', sessionsController.createSession);
router.get('/:id', sessionsController.getSession);
router.delete('/:id', sessionsController.deleteSession);

export default router;