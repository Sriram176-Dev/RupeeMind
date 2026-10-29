import { describe, it, expect } from 'vitest';
import { normalizeCategory, getIndicativeRisk } from '../src/config/fundConfig.js';

describe('Fund Categories & Risk Normalization', () => {
  it('maps "DSP World Gold Mining Overseas Equity Omni FoF" correctly', () => {
    const rawCategory = 'Other Scheme - FoF Overseas';
    const name = 'DSP World Gold Mining Overseas Equity Omni FoF - Direct Plan - Growth';
    const category = normalizeCategory(rawCategory, name);
    expect(['Gold & Silver', 'International / Overseas']).toContain(category);
    expect(getIndicativeRisk(category, name)).toMatch(/Very High|Moderately High/);
  });

  it('maps "UTI Gold Exchange Traded Fund" correctly', () => {
    const rawCategory = 'Other Scheme - Other ETFs';
    const name = 'UTI Gold Exchange Traded Fund';
    const category = normalizeCategory(rawCategory, name);
    expect(category).toBe('Gold & Silver');
    expect(getIndicativeRisk(category, name)).toBe('Moderately High');
  });

  it('maps "Quantum Diversified Equity All Cap Active FOF" correctly', () => {
    const rawCategory = 'Other Scheme - FoF Domestic';
    const name = 'Quantum Diversified Equity All Cap Active FOF - Direct Plan - Growth Option';
    const category = normalizeCategory(rawCategory, name);
    expect(category).toBe('Flexi Cap');
    expect(getIndicativeRisk(category, name)).toBe('Very High');
  });

  it('maps standard categories accurately', () => {
    expect(normalizeCategory('Equity Scheme - Large Cap Fund')).toBe('Large Cap Index');
    expect(normalizeCategory('Equity Scheme - Mid Cap Fund')).toBe('Mid Cap');
    expect(normalizeCategory('Equity Scheme - Small Cap Fund')).toBe('Small Cap');
    expect(normalizeCategory('Equity Scheme - ELSS')).toBe('ELSS');
    expect(normalizeCategory('Equity Scheme - Sectoral / Thematic')).toBe('Sectoral / Thematic');
    expect(normalizeCategory('Debt Scheme - Liquid Fund')).toBe('Liquid');
    expect(normalizeCategory('Debt Scheme - Corporate Bond Fund')).toBe('Corporate Bond');
    expect(normalizeCategory('Hybrid Scheme - Balanced Advantage Fund')).toBe('Balanced Advantage');
  });

  it('maps unmapped categories to "Other" without fallback to Flexi Cap', () => {
    expect(normalizeCategory('Random Unknown Category XYZ')).toBe('Other');
    expect(normalizeCategory('')).toBe('Other');
    expect(getIndicativeRisk('Other')).toBe('Moderate');
  });
});
