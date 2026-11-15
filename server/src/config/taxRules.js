/**
 * Indian Income Tax Rules & Constants for Capital Gains (Finance Act 2024 / Current Regimes)
 * 
 * NOTE TO ADMINISTRATOR / DEVELOPER:
 * Verify these tax rates, exemptions, and holding periods periodically against the latest
 * Indian Income Tax Act notifications, Union Budget revisions (e.g. Finance Act 2024 updates
 * effective July 23, 2024), and CBDT circulars.
 * 
 * Key provisions modeled:
 * - Section 111A: Short Term Capital Gains on Equity Shares and Equity Oriented Mutual Funds
 * - Section 112A: Long Term Capital Gains on Equity Shares and Equity Oriented Mutual Funds
 * - Section 50AA: Specified Mutual Funds (Debt funds where <= 35% in equity, acquired on/after 1-Apr-2023)
 * - Section 112: Non-equity assets (Gold, unlisted debt, hybrid funds)
 */

export const TAX_RULES = {
  // Effective date of Finance Act 2024 revisions
  REVISED_REGIME_EFFECTIVE_DATE: '2024-07-23',

  EQUITY: {
    // Holding period in months to qualify as Long-Term Capital Asset
    HOLDING_PERIOD_MONTHS: 12,
    
    // Short Term Capital Gains (Section 111A)
    // Post July 23, 2024: 20% (Prior: 15%)
    STCG_RATE: 0.20,
    STCG_RATE_LEGACY: 0.15,

    // Long Term Capital Gains (Section 112A)
    // Post July 23, 2024: 12.5% (Prior: 10%)
    LTCG_RATE: 0.125,
    LTCG_RATE_LEGACY: 0.10,

    // Annual LTCG Exemption under Section 112A per financial year
    // Post July 23, 2024: ₹1,25,000 (Prior: ₹1,00,000)
    LTCG_EXEMPTION_LIMIT: 125000,
    LTCG_EXEMPTION_LIMIT_LEGACY: 100000,
  },

  DEBT: {
    // For specified debt mutual funds acquired on or after 1 April 2023:
    // Taxed as deemed short term capital gain at applicable personal income slab rate
    DEFAULT_SLAB_RATE: 0.30, // Assumed benchmark highest slab for reporting (user can customize)
    HOLDING_PERIOD_MONTHS: 24, // Post July 23, 2024 general unlisted/other debt period
    LTCG_RATE: 0.125, // Unlisted debt/bonds without indexation
  },

  GOLD_AND_OTHER: {
    HOLDING_PERIOD_MONTHS: 24,
    STCG_RATE_SLAB: 0.30,
    LTCG_RATE: 0.125, // 12.5% without indexation post July 23, 2024
  },

  // Health and Education Cess applicable on total income tax
  CESS_RATE: 0.04,
};

/**
 * Classifies an asset into tax category
 * @param {'STOCK' | 'MUTUAL_FUND' | string} type 
 * @param {string} categoryOrSector 
 * @param {string} name 
 * @returns {'EQUITY' | 'DEBT' | 'GOLD' | 'HYBRID'}
 */
export function getTaxAssetClass(type, categoryOrSector = '', name = '') {
  const normType = (type || '').toUpperCase();
  const text = `${categoryOrSector} ${name}`.toLowerCase();

  if (normType === 'STOCK') {
    return 'EQUITY';
  }

  if (text.includes('gold') || text.includes('silver') || text.includes('precious metal')) {
    return 'GOLD';
  }

  if (
    text.includes('debt') ||
    text.includes('liquid') ||
    text.includes('money market') ||
    text.includes('overnight') ||
    text.includes('gilt') ||
    text.includes('corporate bond') ||
    text.includes('banking & psu') ||
    text.includes('short duration') ||
    text.includes('income fund')
  ) {
    return 'DEBT';
  }

  if (text.includes('hybrid') || text.includes('balanced') || text.includes('arbitrage')) {
    // If predominantly equity hybrid (>65% equity), treated as equity
    if (text.includes('equity savings') || text.includes('multi asset')) {
      return 'HYBRID';
    }
    return 'EQUITY';
  }

  // Default mutual funds are treated as Equity oriented
  return 'EQUITY';
}

/**
 * Calculates holding duration in days and months
 * @param {Date | string} buyDate 
 * @param {Date | string} sellDate 
 * @returns {{ days: number, months: number }}
 */
export function calculateHoldingPeriod(buyDate, sellDate = new Date()) {
  const start = new Date(buyDate);
  const end = new Date(sellDate);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const months = days / 30.4375;
  return { days, months };
}

/**
 * Returns financial year string for a given date, e.g. "FY 2024-25"
 * @param {Date | string} date 
 * @returns {string}
 */
export function getFinancialYear(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1 to 12
  // Indian FY runs April 1 to March 31
  if (month >= 4) {
    const nextYearShort = (year + 1).toString().slice(-2);
    return `FY ${year}-${nextYearShort}`;
  } else {
    const yearShort = year.toString().slice(-2);
    return `FY ${year - 1}-${yearShort}`;
  }
}
