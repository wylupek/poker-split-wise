import { Router } from 'express';
import { getSettings, updateSettings, clearAllData } from '../controllers/settingsController.js';

const router = Router();

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/clear', clearAllData); // Admin route

export default router;
