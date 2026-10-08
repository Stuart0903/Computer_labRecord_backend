import { Router } from 'express';
import * as studentsController from "../controllers/student.controller.js"
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', studentsController.listStudents);
router.post('/create', studentsController.createStudent);
router.post('/upload', studentsController.uploadStudents);
router.patch('/:id', studentsController.updateStudent);
router.delete('/:id', studentsController.deleteStudent);

export default router;