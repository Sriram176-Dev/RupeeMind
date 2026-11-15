import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ingestRagSources } from '../scripts/ingestRagDocuments.js';
import { retrieveTopKChunks } from '../services/embeddingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * GET /api/rag/sources
 * Lists all configured public documents available for RAG grounding
 */
export async function getRagSources(req, res, next) {
  try {
    const sourcesPath = path.resolve(__dirname, '../config/ragSources.json');
    if (!fs.existsSync(sourcesPath)) {
      return res.status(404).json({ success: false, error: 'RAG sources not found' });
    }
    const raw = fs.readFileSync(sourcesPath, 'utf-8');
    const sources = JSON.parse(raw);
    return res.json({ success: true, data: sources });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/rag/ingest
 * Admin trigger to re-ingest and embed document sources
 */
export async function triggerRagIngest(req, res, next) {
  try {
    const result = await ingestRagSources(false);
    return res.json({
      success: true,
      message: `Ingested ${result.count} knowledge chunks from ${result.sourcesCount || 0} sources`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/rag/search?q=...
 * Test vector similarity search directly
 */
export async function searchRagChunks(req, res, next) {
  try {
    const { q, k = 3 } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter q is required' });
    }
    const results = await retrieveTopKChunks(q, Number(k));
    return res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
}
