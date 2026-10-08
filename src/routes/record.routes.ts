import { Router } from 'express';
import * as recordsController from "../controllers/record.controller.js";
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', recordsController.listRecords);
router.patch('/:id', recordsController.updateRecord);
router.put('/', recordsController.bulkUpdateByIds);
router.post('/bulk', recordsController.bulkUpdateBySession);

export default router;