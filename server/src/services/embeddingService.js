import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { KnowledgeChunk } from '../models/KnowledgeChunk.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

/**
 * Computes standard mathematical cosine similarity between two numeric vectors
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Deterministic pseudo-embedding for fallback/offline environments (dim: 64)
 */
export function generateDeterministicEmbedding(text, dim = 64) {
  const clean = (text || '').toLowerCase();
  const vec = new Array(dim).fill(0);

  // Hash-based n-gram frequency projection
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const pos = (code * 31 + i) % dim;
    vec[pos] += 1;
    if (i > 1) {
      const biPos = (clean.charCodeAt(i - 1) * 37 + code) % dim;
      vec[biPos] += 0.5;
    }
  }

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  const mag = Math.sqrt(norm) || 1;
  return vec.map((v) => Number((v / mag).toFixed(6)));
}

/**
 * Generate embedding vector using Gemini API or fallback
 */
export async function getEmbedding(text) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
      });

      if (res?.embedding?.values && res.embedding.values.length > 0) {
        return res.embedding.values;
      }
    } catch (err) {
      console.warn('[EmbeddingService] Gemini embedContent failed, using fallback:', err.message);
    }
  }

  // Fallback
  return generateDeterministicEmbedding(text);
}

/**
 * Retrieves top-K most relevant chunks using cosine similarity
 * @param {string} queryText User prompt or financial query
 * @param {number} k Maximum top results (default: 3)
 * @param {number} minScore Minimum cosine similarity threshold (default: 0.35)
 */
export async function retrieveTopKChunks(queryText, k = 3, minScore = 0.35) {
  if (!queryText || typeof queryText !== 'string') return [];

  const queryVec = await getEmbedding(queryText);

  // 1. Attempt retrieval from MongoDB
  let chunks = [];
  try {
    chunks = await KnowledgeChunk.find({}).lean();
  } catch {
    chunks = [];
  }

  // 2. Fallback to bundled JSON config if database is unpopulated or offline
  if (!chunks || chunks.length === 0) {
    try {
      const sourcesPath = path.resolve(__dirname, '../config/ragSources.json');
      if (fs.existsSync(sourcesPath)) {
        const raw = fs.readFileSync(sourcesPath, 'utf-8');
        const sources = JSON.parse(raw);
        chunks = sources.map((s, idx) => ({
          sourceId: s.id,
          title: s.title,
          url: s.url,
          category: s.category,
          chunkIndex: 0,
          content: `${s.title}\n${s.summary}\n${s.content}`,
          embedding: generateDeterministicEmbedding(`${s.title} ${s.summary} ${s.content}`, queryVec.length),
        }));
      }
    } catch (err) {
      console.warn('[EmbeddingService] Failed to load local ragSources.json:', err.message);
    }
  }

  if (chunks.length === 0) return [];

  // 3. Compute cosine similarity against query vector
  const scored = chunks.map((c) => {
    let emb = c.embedding;
    if (!emb || emb.length === 0 || emb.length !== queryVec.length) {
      emb = generateDeterministicEmbedding(c.content, queryVec.length);
    }
    const score = cosineSimilarity(queryVec, emb);
    return {
      chunk: {
        sourceId: c.sourceId,
        title: c.title,
        url: c.url,
        category: c.category,
        content: c.content,
      },
      score: Number(score.toFixed(4)),
    };
  });

  // 4. Sort and filter
  const filtered = scored
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return filtered;
}
