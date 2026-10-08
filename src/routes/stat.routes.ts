import { Router } from 'express';
import * as statsController from "../controllers/stat.controller.js";
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', statsController.getStats);
router.get('/recent-sessions', statsController.getRecentSessions);

export default router;