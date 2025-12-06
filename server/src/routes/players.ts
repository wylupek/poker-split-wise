import { Router } from 'express';
import { getAllPlayers, createPlayer, updatePlayer, deletePlayer } from '../controllers/playerController.js';

const router = Router();

router.get('/', getAllPlayers);
router.post('/', createPlayer);
router.put('/:id', updatePlayer);
router.delete('/:id', deletePlayer);

export default router;
