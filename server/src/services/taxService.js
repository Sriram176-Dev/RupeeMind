import { Holding } from '../models/Holding.js';
import { Transaction } from '../models/Transaction.js';
import {
  TAX_RULES,
  getTaxAssetClass,
  calculateHoldingPeriod,
  getFinancialYear,
} from '../config/taxRules.js';

/**
 * Computes FIFO tax lots, realized STCG/LTCG per financial year,
 * unrealized gains, and tax harvesting opportunities.
 *
 * @param {string} userId
 * @param {string} [filterFY] Optional FY filter e.g. "FY 2024-25"
 */
export async function calculateTaxReport(userId, filterFY = null) {
  // 1. Fetch user's holdings and transactions
  const [holdings, transactions] = await Promise.all([
    Holding.find({ userId }),
    Transaction.find({ userId }).sort({ date: 1 }),
  ]);

  // Group transactions by holding or scheme
  const txByHolding = new Map();
  for (const tx of transactions) {
    const key = tx.holdingId ? tx.holdingId.toString() : (tx.schemeCode || tx.schemeName);
    if (!txByHolding.has(key)) {
      txByHolding.set(key, []);
    }
    txByHolding.get(key).push(tx);
  }

  const realizedLots = [];
  const unrealizedLots = [];

  // Map holdings by ID and key
  const holdingMap = new Map();
  for (const h of holdings) {
    holdingMap.set(h._id.toString(), h);
    if (h.symbolOrCode) {
      holdingMap.set(h.symbolOrCode, h);
    }
  }

  // Set of keys processed
  const processedKeys = new Set();

  // 2. Process transactions using FIFO lot matching
  for (const [key, txList] of txByHolding.entries()) {
    processedKeys.add(key);
    const holding = holdingMap.get(key);
    const assetClass = getTaxAssetClass(
      holding?.type || 'MUTUAL_FUND',
      holding?.categoryOrSector || '',
      holding?.name || txList[0]?.schemeName || ''
    );
    const currentPrice = holding?.currentPrice || (txList.length > 0 ? txList[txList.length - 1].price : 0);

    // Queue of buy lots: { date, units, price, originalUnits, txId }
    const buyQueue = [];

    for (const tx of txList) {
      const isBuy = ['PURCHASE', 'SIP', 'SWITCH_IN', 'DIVIDEND_REINVESTMENT'].includes(tx.type);
      const isSell = ['REDEMPTION', 'SWITCH_OUT'].includes(tx.type);

      if (isBuy) {
        buyQueue.push({
          date: new Date(tx.date),
          units: tx.units,
          originalUnits: tx.units,
          price: tx.price,
          txId: tx._id,
        });
      } else if (isSell) {
        let unitsToSell = Math.abs(tx.units);
        const sellDate = new Date(tx.date);
        const sellPrice = tx.price;
        const fy = getFinancialYear(sellDate);

        while (unitsToSell > 0.0001 && buyQueue.length > 0) {
          const earliestBuy = buyQueue[0];
          const matchedUnits = Math.min(unitsToSell, earliestBuy.units);
          const { days, months } = calculateHoldingPeriod(earliestBuy.date, sellDate);

          const isLtcg =
            assetClass === 'EQUITY'
              ? months >= TAX_RULES.EQUITY.HOLDING_PERIOD_MONTHS
              : months >= TAX_RULES.DEBT.HOLDING_PERIOD_MONTHS;

          const buyCost = matchedUnits * earliestBuy.price;
          const sellProceeds = matchedUnits * sellPrice;
          const gain = sellProceeds - buyCost;

          let taxRate = 0;
          if (assetClass === 'EQUITY') {
            taxRate = isLtcg ? TAX_RULES.EQUITY.LTCG_RATE : TAX_RULES.EQUITY.STCG_RATE;
          } else {
            taxRate = isLtcg ? TAX_RULES.DEBT.LTCG_RATE : TAX_RULES.DEBT.DEFAULT_SLAB_RATE;
          }

          realizedLots.push({
            holdingId: holding?._id || null,
            name: holding?.name || tx.schemeName || 'Unknown Security',
            symbolOrCode: holding?.symbolOrCode || tx.schemeCode || '',
            assetClass,
            buyDate: earliestBuy.date,
            sellDate,
            financialYear: fy,
            units: matchedUnits,
            buyPrice: earliestBuy.price,
            sellPrice,
            buyCost,
            sellProceeds,
            gain,
            holdingDays: days,
            gainType: isLtcg ? 'LTCG' : 'STCG',
            estimatedTaxRate: taxRate,
            estimatedTax: gain > 0 ? gain * taxRate * (1 + TAX_RULES.CESS_RATE) : 0,
          });

          earliestBuy.units -= matchedUnits;
          unitsToSell -= matchedUnits;

          if (earliestBuy.units <= 0.0001) {
            buyQueue.shift();
          }
        }
      }
    }

    // Remaining lots in buyQueue are unrealized
    for (const lot of buyQueue) {
      if (lot.units > 0.0001) {
        const { days, months } = calculateHoldingPeriod(lot.date, new Date());
        const isLtcg =
          assetClass === 'EQUITY'
            ? months >= TAX_RULES.EQUITY.HOLDING_PERIOD_MONTHS
            : months >= TAX_RULES.DEBT.HOLDING_PERIOD_MONTHS;

        const buyCost = lot.units * lot.price;
        const currentVal = lot.units * currentPrice;
        const gain = currentVal - buyCost;

        unrealizedLots.push({
          holdingId: holding?._id || null,
          name: holding?.name || 'Security Lot',
          symbolOrCode: holding?.symbolOrCode || '',
          assetClass,
          buyDate: lot.date,
          units: lot.units,
          buyPrice: lot.price,
          currentPrice,
          buyCost,
          currentValue: currentVal,
          gain,
          holdingDays: days,
          gainType: isLtcg ? 'LTCG' : 'STCG',
          isEligibleForHarvesting: isLtcg && assetClass === 'EQUITY' && gain > 0,
        });
      }
    }
  }

  // 3. For active holdings with NO discrete transactions, synthesize a holding lot
  for (const h of holdings) {
    if (!processedKeys.has(h._id.toString()) && !processedKeys.has(h.symbolOrCode)) {
      const assetClass = getTaxAssetClass(h.type, h.categoryOrSector, h.name);
      const { days, months } = calculateHoldingPeriod(h.buyDate || new Date(), new Date());
      const isLtcg =
        assetClass === 'EQUITY'
          ? months >= TAX_RULES.EQUITY.HOLDING_PERIOD_MONTHS
          : months >= TAX_RULES.DEBT.HOLDING_PERIOD_MONTHS;

      const buyCost = h.quantity * h.buyPrice;
      const currentVal = h.quantity * (h.currentPrice || h.buyPrice);
      const gain = currentVal - buyCost;

      unrealizedLots.push({
        holdingId: h._id,
        name: h.name || h.symbolOrCode,
        symbolOrCode: h.symbolOrCode,
        assetClass,
        buyDate: h.buyDate || new Date(),
        units: h.quantity,
        buyPrice: h.buyPrice,
        currentPrice: h.currentPrice || h.buyPrice,
        buyCost,
        currentValue: currentVal,
        gain,
        holdingDays: days,
        gainType: isLtcg ? 'LTCG' : 'STCG',
        isEligibleForHarvesting: isLtcg && assetClass === 'EQUITY' && gain > 0,
      });
    }
  }

  // 4. Group Realized Gains by Financial Year
  const currentFY = getFinancialYear(new Date());
  const fyMap = new Map();

  for (const lot of realizedLots) {
    const fy = lot.financialYear;
    if (!fyMap.has(fy)) {
      fyMap.set(fy, {
        financialYear: fy,
        equityStcg: 0,
        equityLtcg: 0,
        debtGains: 0,
        totalGains: 0,
        totalEstimatedTax: 0,
        lots: [],
      });
    }
    const fyData = fyMap.get(fy);
    fyData.lots.push(lot);
    fyData.totalGains += lot.gain;
    fyData.totalEstimatedTax += lot.estimatedTax;

    if (lot.assetClass === 'EQUITY') {
      if (lot.gainType === 'LTCG') {
        fyData.equityLtcg += lot.gain;
      } else {
        fyData.equityStcg += lot.gain;
      }
    } else {
      fyData.debtGains += lot.gain;
    }
  }

  // Apply ₹1.25L Section 112A annual exemption to Equity LTCG for each FY
  for (const fyData of fyMap.values()) {
    const exemptionLimit = TAX_RULES.EQUITY.LTCG_EXEMPTION_LIMIT;
    const exemptLtcg = Math.min(Math.max(0, fyData.equityLtcg), exemptionLimit);
    fyData.equityLtcgExemptionUsed = exemptLtcg;
    fyData.equityLtcgTaxable = Math.max(0, fyData.equityLtcg - exemptLtcg);
    fyData.remainingLtcgExemption = Math.max(0, exemptionLimit - exemptLtcg);
  }

  // Current FY summary
  const currentFyData = fyMap.get(currentFY) || {
    financialYear: currentFY,
    equityStcg: 0,
    equityLtcg: 0,
    debtGains: 0,
    totalGains: 0,
    totalEstimatedTax: 0,
    equityLtcgExemptionUsed: 0,
    equityLtcgTaxable: 0,
    remainingLtcgExemption: TAX_RULES.EQUITY.LTCG_EXEMPTION_LIMIT,
    lots: [],
  };

  // 5. Tax Harvesting Suggestions for Current FY
  // Suggest selling long-term equity units to consume remaining LTCG exemption
  const remainingExemption = currentFyData.remainingLtcgExemption;
  const harvestingOpportunities = [];
  let potentialHarvestGain = 0;

  const harvestableLots = unrealizedLots
    .filter((l) => l.isEligibleForHarvesting)
    .sort((a, b) => b.gain - a.gain); // Prioritize highest gain lots

  for (const lot of harvestableLots) {
    if (potentialHarvestGain >= remainingExemption) break;

    const neededGain = remainingExemption - potentialHarvestGain;
    const gainPerUnit = lot.gain / lot.units;

    if (gainPerUnit <= 0) continue;

    // How many units to sell to realize needed gain
    const unitsToHarvest = Math.min(lot.units, Math.ceil((neededGain / gainPerUnit) * 100) / 100);
    const realizedHarvestGain = Math.min(lot.gain, unitsToHarvest * gainPerUnit);
    const saleProceeds = unitsToHarvest * lot.currentPrice;
    const taxSaved = realizedHarvestGain * TAX_RULES.EQUITY.LTCG_RATE * (1 + TAX_RULES.CESS_RATE);

    harvestingOpportunities.push({
      holdingId: lot.holdingId,
      name: lot.name,
      symbolOrCode: lot.symbolOrCode,
      currentPrice: lot.currentPrice,
      unitsToSell: unitsToHarvest,
      saleValue: saleProceeds,
      gainHarvested: realizedHarvestGain,
      estimatedTaxSaved: taxSaved,
      rationale: `Sell ${unitsToHarvest.toFixed(2)} units to harvest ₹${Math.round(realizedHarvestGain).toLocaleString('en-IN')} tax-free under Section 112A ₹1.25L exemption, then repurchase to step up acquisition cost.`,
    });

    potentialHarvestGain += realizedHarvestGain;
  }

  // Total unrealized stats
  const unrealizedSummary = {
    equityStcg: unrealizedLots
      .filter((l) => l.assetClass === 'EQUITY' && l.gainType === 'STCG')
      .reduce((s, l) => s + l.gain, 0),
    equityLtcg: unrealizedLots
      .filter((l) => l.assetClass === 'EQUITY' && l.gainType === 'LTCG')
      .reduce((s, l) => s + l.gain, 0),
    debtGains: unrealizedLots
      .filter((l) => l.assetClass !== 'EQUITY')
      .reduce((s, l) => s + l.gain, 0),
    totalUnrealizedGains: unrealizedLots.reduce((s, l) => s + l.gain, 0),
  };

  const allFYs = Array.from(fyMap.keys()).sort().reverse();
  const activeFY = filterFY || currentFY;
  const selectedFyData = fyMap.get(activeFY) || {
    financialYear: activeFY,
    equityStcg: 0,
    equityLtcg: 0,
    debtGains: 0,
    totalGains: 0,
    totalEstimatedTax: 0,
    equityLtcgExemptionUsed: 0,
    equityLtcgTaxable: 0,
    remainingLtcgExemption: TAX_RULES.EQUITY.LTCG_EXEMPTION_LIMIT,
    lots: [],
  };

  return {
    currentFinancialYear: currentFY,
    selectedFinancialYear: activeFY,
    availableFinancialYears: allFYs.length > 0 ? allFYs : [currentFY],
    selectedFySummary: selectedFyData,
    unrealizedSummary,
    harvestingSuggestions: {
      annualExemptionLimit: TAX_RULES.EQUITY.LTCG_EXEMPTION_LIMIT,
      exemptionUsedSoFar: currentFyData.equityLtcgExemptionUsed,
      remainingExemption,
      totalTaxSavable: harvestingOpportunities.reduce((s, o) => s + o.estimatedTaxSaved, 0),
      opportunities: harvestingOpportunities,
    },
    realizedLots: selectedFyData.lots,
    unrealizedLots,
  };
}

/**
 * Generates CSV string for capital gains export
 * @param {Array} lots 
 * @param {string} fy 
 * @returns {string}
 */
export function generateCapitalGainsCsv(reportData) {
  const headers = [
    'Security Name',
    'Symbol / Code',
    'Asset Class',
    'Gain Type',
    'Buy Date',
    'Sell Date',
    'Units',
    'Buy Price (INR)',
    'Sell Price (INR)',
    'Total Cost (INR)',
    'Total Proceeds (INR)',
    'Net Capital Gain (INR)',
    'Estimated Tax (INR)',
  ];

  const rows = reportData.realizedLots.map((lot) => [
    `"${(lot.name || '').replace(/"/g, '""')}"`,
    `"${lot.symbolOrCode || ''}"`,
    lot.assetClass,
    lot.gainType,
    lot.buyDate ? new Date(lot.buyDate).toISOString().split('T')[0] : '',
    lot.sellDate ? new Date(lot.sellDate).toISOString().split('T')[0] : '',
    lot.units.toFixed(3),
    lot.buyPrice.toFixed(2),
    lot.sellPrice.toFixed(2),
    lot.buyCost.toFixed(2),
    lot.sellProceeds.toFixed(2),
    lot.gain.toFixed(2),
    lot.estimatedTax.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}
