import { Router } from 'express';
import * as parentController from '../controllers/parent.controller.js';

const router = Router();

// PUBLIC — no auth required
router.post('/lookup', parentController.lookup);

export default router;