import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { KnowledgeChunk } from '../models/KnowledgeChunk.js';
import { getEmbedding } from '../services/embeddingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Splits text into readable chunks with slight overlap
 */
function chunkText(text, maxChars = 800, overlap = 100) {
  if (!text || text.length <= maxChars) return [text];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + maxChars, text.length);
    chunks.push(text.slice(i, end));
    i += maxChars - overlap;
  }
  return chunks;
}

/**
 * Ingests all sources declared in ragSources.json into KnowledgeChunk collection
 */
export async function ingestRagSources(dryRun = false) {
  console.log('[RAG Ingest] Loading sources from ragSources.json...');
  const sourcesPath = path.resolve(__dirname, '../config/ragSources.json');
  if (!fs.existsSync(sourcesPath)) {
    throw new Error(`Sources file not found at: ${sourcesPath}`);
  }

  const raw = fs.readFileSync(sourcesPath, 'utf-8');
  const sources = JSON.parse(raw);
  console.log(`[RAG Ingest] Found ${sources.length} document sources.`);

  const chunksToSave = [];

  for (const src of sources) {
    const combinedText = `${src.title}\n\nSummary: ${src.summary}\n\nContent: ${src.content}`;
    const textPieces = chunkText(combinedText);

    for (let idx = 0; idx < textPieces.length; idx++) {
      const piece = textPieces[idx];
      console.log(`[RAG Ingest] Generating embedding for ${src.id} [chunk ${idx}]...`);
      const emb = await getEmbedding(piece);

      chunksToSave.push({
        sourceId: src.id,
        title: src.title,
        url: src.url,
        category: src.category || 'GENERAL',
        chunkIndex: idx,
        content: piece,
        embedding: emb,
        metadata: {
          charLength: piece.length,
          ingestedAt: new Date().toISOString(),
        },
      });
    }
  }

  if (dryRun) {
    console.log(`[RAG Ingest] Dry run: Prepared ${chunksToSave.length} chunks.`);
    return { count: chunksToSave.length, dryRun: true };
  }

  if (mongoose.connection.readyState === 1) {
    for (const chunk of chunksToSave) {
      await KnowledgeChunk.findOneAndUpdate(
        { sourceId: chunk.sourceId, chunkIndex: chunk.chunkIndex },
        chunk,
        { upsert: true, new: true }
      );
    }
    console.log(`[RAG Ingest] Successfully upserted ${chunksToSave.length} knowledge chunks to MongoDB.`);
  } else {
    console.warn('[RAG Ingest] MongoDB not connected; returning processed chunks in-memory.');
  }

  return { count: chunksToSave.length, sourcesCount: sources.length };
}

// Standalone CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rupeemind';
  mongoose
    .connect(mongoUri)
    .then(async () => {
      console.log('[RAG Ingest] Connected to MongoDB.');
      await ingestRagSources();
      await mongoose.disconnect();
      console.log('[RAG Ingest] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[RAG Ingest Error]:', err.message);
      process.exit(1);
    });
}
