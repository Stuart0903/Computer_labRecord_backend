import { Router } from 'express';
// import { protectApiRoutes } from '../middleware/protectApi.js';
import authRoutes from './auth.routes.js';
import studentsRoutes from "./student.routes.js"
import sessionsRoutes from "./session.routes.js"
import recordsRoutes from "./record.routes.js"
import statsRoutes from "./stat.routes.js"
import parentRoutes from "./parent.routes.js"
import { requireAuth } from '../middleware/auth.js';

const router = Router();



router.use('/auth', authRoutes);
router.use('/students', requireAuth, studentsRoutes);
router.use('/sessions', requireAuth, sessionsRoutes);
router.use('/records', requireAuth, recordsRoutes);
router.use('/stats', requireAuth, statsRoutes);
router.use('/parent', parentRoutes);

export default router;