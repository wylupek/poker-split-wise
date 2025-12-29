import { Router } from 'express';
import {
  getAllPresets,
  createPreset,
  updatePreset,
  deletePreset,
  setDefaultPreset
} from '../controllers/presetsController.js';

const router = Router();

router.get('/', getAllPresets);
router.post('/', createPreset);
router.put('/:id', updatePreset);
router.delete('/:id', deletePreset);
router.put('/:id/set-default', setDefaultPreset);

export default router;
