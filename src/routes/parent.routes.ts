import { Router } from 'express';
import * as parentController from '../controllers/parent.controller.js';
import { lookupRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

// PUBLIC — no auth required, but rate-limited to prevent student-ID enumeration.
router.post('/lookup', lookupRateLimiter, parentController.lookup);

export default router;
