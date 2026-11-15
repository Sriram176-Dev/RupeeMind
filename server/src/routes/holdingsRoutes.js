import { Router } from 'express';
import multer from 'multer';
import {
  getHoldings,
  addHolding,
  deleteHolding,
  createHoldingSchema,
  parseImportFile,
  confirmImport,
  confirmImportSchema,
  getTransactions,
  deleteTransaction,
  getPerformanceWithXirr,
  getBenchmarkComparison,
} from '../controllers/holdingsController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB file size limit
});

router.use(protect);

router.get('/', getHoldings);
router.post('/', validate(createHoldingSchema), addHolding);
router.delete('/:id', deleteHolding);

// Portfolio Import & Transaction Management
router.post('/import/parse', upload.single('file'), parseImportFile);
router.post('/import/confirm', validate(confirmImportSchema), confirmImport);
router.get('/transactions', getTransactions);
router.delete('/transactions/:id', deleteTransaction);

// Performance (XIRR, CAGR, Absolute Return) & Benchmark Comparison
router.get('/performance', getPerformanceWithXirr);
router.get('/benchmark', getBenchmarkComparison);

export default router;
