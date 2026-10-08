import { Router } from 'express';
import { protectApiRoutes } from '../middleware/protectApi.js';
import authRoutes from './auth.routes.js';
import studentsRoutes from "./student.routes.js"
import sessionsRoutes from "./session.routes.js"
import recordsRoutes from "./record.routes.js"
import statsRoutes from "./stat.routes.js"
import parentRoutes from "./parent.routes.js"

const router = Router();

router.use(protectApiRoutes);

router.use('/auth', authRoutes);
router.use('/students', studentsRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/records', recordsRoutes);
router.use('/stats', statsRoutes);
router.use('/parent', parentRoutes);

export default router;