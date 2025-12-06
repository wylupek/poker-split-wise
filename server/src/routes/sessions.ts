import { Router } from 'express';
import { getAllSessions, createSession, deleteSession } from '../controllers/sessionController.js';

const router = Router();

router.get('/', getAllSessions);
router.post('/', createSession);
router.delete('/:id', deleteSession);

export default router;
