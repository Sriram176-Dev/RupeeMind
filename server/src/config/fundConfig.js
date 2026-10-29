/**
 * Configuration and mappings for Mutual Funds
 */

export const MFAPI_BASE_URL = process.env.MFAPI_BASE_URL || 'http://api.mfapi.in';

export const RISK_FREE_RATE = parseFloat(process.env.RISK_FREE_RATE || '0.065'); // 6.5% standard Indian 10Y G-Sec rate

export const FUND_SYNC_MAX = parseInt(process.env.FUND_SYNC_MAX || '300', 10);

// Major AMCs prioritized for retail investor relevance
export const PRIORITY_AMCS = [
  'HDFC Mutual Fund',
  'ICICI Prudential Mutual Fund',
  'SBI Mutual Fund',
  'Parag Parikh Mutual Fund',
  'PPFAS Mutual Fund',
  'Mirae Asset Mutual Fund',
  'Nippon India Mutual Fund',
  'Kotak Mahindra Mutual Fund',
  'Axis Mutual Fund',
  'UTI Mutual Fund',
  'Tata Mutual Fund',
  'Motilal Oswal Mutual Fund',
  'DSP Mutual Fund',
  'Bandhan Mutual Fund',
  'Quant Mutual Fund',
  'Aditya Birla Sun Life Mutual Fund',
  'Edelweiss Mutual Fund',
  'Franklin Templeton Mutual Fund',
  'Invesco Mutual Fund',
  'Canara Robeco Mutual Fund',
  'Sundaram Mutual Fund',
  'HSBC Mutual Fund',
];

// Clean category normalization map
export function normalizeCategory(rawCategory = '', schemeName = '') {
  const raw = (rawCategory || '').toLowerCase();
  const name = (schemeName || '').toLowerCase();
  const combined = `${raw} ${name}`;

  // 1. Gold & Silver ETFs and FoFs
  if (combined.includes('gold') || combined.includes('silver') || combined.includes('precious metal')) {
    return 'Gold & Silver';
  }

  // 2. International / Overseas FoFs & Equities
  if (
    raw.includes('fof overseas') ||
    raw.includes('overseas') ||
    raw.includes('international') ||
    raw.includes('global') ||
    name.includes('overseas') ||
    name.includes('global') ||
    name.includes('world') ||
    name.includes('us equity') ||
    name.includes('nasdaq') ||
    name.includes('greater china') ||
    name.includes('emerging markets')
  ) {
    return 'International / Overseas';
  }

  // 3. Sectoral / Thematic
  if (
    raw.includes('sectoral') ||
    raw.includes('thematic') ||
    raw.includes('sector') ||
    raw.includes('pharma') ||
    raw.includes('healthcare') ||
    raw.includes('technology') ||
    raw.includes('tech') ||
    raw.includes('banking') ||
    raw.includes('infrastructure') ||
    raw.includes('infra') ||
    raw.includes('consumption') ||
    raw.includes('energy') ||
    raw.includes('manufacturing') ||
    raw.includes('auto')
  ) {
    return 'Sectoral / Thematic';
  }

  // 4. ELSS / Tax Saver
  if (raw.includes('elss') || raw.includes('tax') || name.includes('elss') || name.includes('tax saver')) {
    return 'ELSS';
  }

  // 5. Flexi Cap / Multi Cap / Value / Contra / Focused / Domestic Active Equity FoF
  if (
    raw.includes('flexi cap') ||
    raw.includes('multi cap') ||
    raw.includes('value fund') ||
    raw.includes('contra fund') ||
    raw.includes('focused fund') ||
    raw.includes('dividend yield') ||
    name.includes('value fund') ||
    name.includes('contra fund') ||
    name.includes('focused fund') ||
    (raw.includes('fof domestic') && (combined.includes('equity') || combined.includes('diversified') || combined.includes('all cap')))
  ) {
    return 'Flexi Cap';
  }

  // 6. Large & Mid Cap
  if (raw.includes('large & mid') || raw.includes('large and mid') || name.includes('large & mid') || name.includes('large and mid')) {
    return 'Large & Mid Cap';
  }

  // 7. Large Cap & Index Funds
  if (
    raw.includes('large cap') ||
    raw.includes('index fund') ||
    raw.includes('other etfs') ||
    (raw.includes('index') && !raw.includes('mid') && !raw.includes('small')) ||
    name.includes('nifty') ||
    name.includes('sensex') ||
    name.includes('index fund') ||
    name.includes('index-')
  ) {
    return 'Large Cap Index';
  }

  // 8. Mid Cap
  if (raw.includes('mid cap') || raw.includes('midcap') || name.includes('mid cap') || name.includes('midcap')) {
    return 'Mid Cap';
  }

  // 9. Small Cap
  if (raw.includes('small cap') || raw.includes('smallcap') || name.includes('small cap') || name.includes('smallcap')) {
    return 'Small Cap';
  }

  // 10. Hybrid / Balanced Advantage / Multi Asset
  if (
    raw.includes('balanced advantage') ||
    raw.includes('dynamic asset') ||
    raw.includes('aggressive hybrid') ||
    raw.includes('multi asset') ||
    raw.includes('equity savings') ||
    raw.includes('conservative hybrid') ||
    raw.includes('balanced hybrid') ||
    name.includes('multi asset') ||
    name.includes('balanced advantage')
  ) {
    return 'Balanced Advantage';
  }

  // 11. Liquid / Overnight / Money Market / Arbitrage
  if (
    raw.includes('liquid') ||
    raw.includes('overnight') ||
    raw.includes('money market') ||
    raw.includes('arbitrage')
  ) {
    return 'Liquid';
  }

  // 12. Short Duration / Low Duration / Ultra Short / Floater / Banking PSU
  if (
    raw.includes('short duration') ||
    raw.includes('low duration') ||
    raw.includes('ultra short') ||
    raw.includes('floater') ||
    raw.includes('banking and psu') ||
    raw.includes('banking & psu')
  ) {
    return 'Short Duration Debt';
  }

  // 13. Corporate Bond / Gilt / Medium / Long Duration / Credit Risk
  if (
    raw.includes('corporate bond') ||
    raw.includes('credit risk') ||
    raw.includes('gilt') ||
    raw.includes('dynamic bond') ||
    raw.includes('medium duration') ||
    raw.includes('long duration') ||
    raw.includes('debt')
  ) {
    return 'Corporate Bond';
  }

  // Explicit unmapped fallback: NEVER default to Flexi Cap
  return 'Other';
}

// Indicative risk level mapped strictly from category
export const CATEGORY_RISK_MAP = {
  'Liquid': 'Low',
  'Short Duration Debt': 'Moderately Low',
  'Corporate Bond': 'Moderate',
  'Balanced Advantage': 'Moderately High',
  'Large Cap Index': 'Moderately High',
  'Gold & Silver': 'Moderately High',
  'Flexi Cap': 'Very High',
  'Large & Mid Cap': 'Very High',
  'Mid Cap': 'Very High',
  'Small Cap': 'Very High',
  'ELSS': 'Very High',
  'Sectoral / Thematic': 'Very High',
  'International / Overseas': 'Very High',
  'Other': 'Moderate',
};

export function getIndicativeRisk(category, schemeName = '') {
  const norm = normalizeCategory(category, schemeName);
  return CATEGORY_RISK_MAP[norm] || 'Moderate';
}

