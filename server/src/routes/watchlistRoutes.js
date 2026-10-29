import { Router } from 'express';
import { getWatchlist, toggleWatchlist } from '../controllers/watchlistController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getWatchlist);
router.post('/:symbol', toggleWatchlist);

export default router;
