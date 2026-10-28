import { Router } from 'express';
import * as sessionsController from "../controllers/session.controller.js"
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// IMPORTANT: declare /with-stats BEFORE /:id, otherwise "with-stats"
// would be captured as the :id parameter.
router.get('/with-stats', sessionsController.listSessionsWithStats);

router.get('/', sessionsController.listSessions);
router.post('/', sessionsController.createSession);
router.get('/:id', sessionsController.getSession);
router.patch('/:id', sessionsController.updateSession);
router.delete('/:id', sessionsController.deleteSession);

export default router;
