// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  cosineSimilarity,
  generateDeterministicEmbedding,
} from '../../server/src/services/embeddingService.js';
import { computeExplainabilityFactors } from '../../server/src/services/recommendationService.js';
import { analyzeSentiment } from '../../server/src/services/newsService.js';
import ragSources from '../../server/src/config/ragSources.json';

describe('Phase 5: RAG Vector Search & Cosine Similarity Math', () => {
  it('correctly calculates cosine similarity for identical, orthogonal, and opposite vectors', () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const vecC = [0, 1, 0];
    const vecD = [-1, 0, 0];

    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 4);
    expect(cosineSimilarity(vecA, vecC)).toBeCloseTo(0.0, 4);
    expect(cosineSimilarity(vecA, vecD)).toBeCloseTo(-1.0, 4);
  });

  it('generates normalized unit-length embeddings with deterministic reproduction', () => {
    const text = 'SEBI Master Circular for Mutual Funds';
    const emb1 = generateDeterministicEmbedding(text, 64);
    const emb2 = generateDeterministicEmbedding(text, 64);

    expect(emb1.length).toBe(64);
    expect(emb1).toEqual(emb2);

    // Magnitude should equal 1.0 (L2 unit vector)
    const mag = Math.sqrt(emb1.reduce((sum, v) => sum + v * v, 0));
    expect(mag).toBeCloseTo(1.0, 2);
  });

  it('validates that curated ragSources.json contains statutory and tax circular references', () => {
    expect(Array.isArray(ragSources)).toBe(true);
    expect(ragSources.length).toBeGreaterThanOrEqual(4);

    const categories = ragSources.map((s) => s.category);
    expect(categories).toContain('SEBI');
    expect(categories).toContain('TAX');
    expect(categories).toContain('AMC_FACTSHEET');

    for (const src of ragSources) {
      expect(src).toHaveProperty('title');
      expect(src).toHaveProperty('url');
      expect(src.url).toMatch(/^https?:\/\//);
      expect(src).toHaveProperty('content');
    }
  });
});

describe('Phase 5: Recommendation Explainability Factor Calculations', () => {
  it('computes complete multi-factor explainability breakdown for a recommended fund', () => {
    const fund = {
      name: 'Parag Parikh Flexi Cap Fund',
      category: 'Flexi Cap',
      riskLevel: 'Very High',
      cagr3Y: 21.4,
      cagr5Y: 19.8,
      sharpeRatio: 1.35,
      expenseRatio: 0.72,
      maxDrawdown: -14.5,
    };

    const exp = computeExplainabilityFactors(fund, 'Aggressive');

    expect(exp).toHaveProperty('categoryFit');
    expect(exp.categoryFit.fitScore).toBeGreaterThanOrEqual(90);
    expect(exp).toHaveProperty('cagrComparison');
    expect(exp.cagrComparison.fund3YCagr).toBe(21.4);
    expect(exp.cagrComparison.outperformancePercent).toBeGreaterThan(0); // 21.4 - 17.2 = 4.2%

    expect(exp).toHaveProperty('sharpeRatio');
    expect(exp.sharpeRatio.fundSharpe).toBe(1.35);

    expect(exp).toHaveProperty('expenseRatio');
    expect(exp.expenseRatio.fundExpenseRatio).toBe(0.72);

    expect(exp).toHaveProperty('maxDrawdown');
    expect(exp.maxDrawdown.fundDrawdown).toBe(-14.5);

    expect(typeof exp.oneLineSummary).toBe('string');
    expect(exp.oneLineSummary.length).toBeGreaterThan(20);
  });
});

describe('Phase 5: Financial News Sentiment & Portfolio Matcher', () => {
  it('correctly tags bullish financial news headlines', () => {
    const headline = 'Nifty 50 surges to all-time high as corporate profits beat analyst expectations';
    const result = analyzeSentiment(headline);
    expect(result.sentiment).toBe('BULLISH');
    expect(result.score).toBeGreaterThan(0);
  });

  it('correctly tags bearish financial news headlines', () => {
    const headline = 'Markets crash as rising inflation and foreign capital outflows trigger steep decline';
    const result = analyzeSentiment(headline);
    expect(result.sentiment).toBe('BEARISH');
    expect(result.score).toBeLessThan(0);
  });

  it('correctly tags neutral macro informational headlines', () => {
    const headline = 'Ministry of Finance schedules annual economic survey release date';
    const result = analyzeSentiment(headline);
    expect(result.sentiment).toBe('NEUTRAL');
    expect(result.score).toBe(0);
  });
});
