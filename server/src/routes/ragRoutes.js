import { Router } from 'express';
import {
  getRagSources,
  triggerRagIngest,
  searchRagChunks,
} from '../controllers/ragController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/sources', getRagSources);
router.post('/ingest', triggerRagIngest);
router.get('/search', searchRagChunks);

export default router;
