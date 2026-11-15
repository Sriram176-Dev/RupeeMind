import { z } from 'zod';
import { Holding } from '../models/Holding.js';
import { Transaction } from '../models/Transaction.js';
import * as marketService from '../services/marketService.js';
import { Fund } from '../models/Fund.js';
import { calculateXIRR } from '../services/xirrService.js';
import {
  parseCASPdf,
  parseBrokerCSV,
  commitTransactionsAndBuildHoldings,
} from '../services/importParserService.js';
import { getPortfolioBenchmarkComparison } from '../services/benchmarkService.js';

const SYMBOL_REGEX = /^[A-Z0-9&.\-^]{1,20}$/;

export const createHoldingSchema = z.object({
  type: z.enum(['stock', 'fund', 'STOCK', 'MUTUAL_FUND', 'Stock', 'Mutual Fund']),
  symbolOrCode: z
    .string()
    .min(1, 'Symbol or code is required')
    .max(20)
    .trim()
    .refine((s) => SYMBOL_REGEX.test(s.toUpperCase()), { message: 'Invalid symbol format' }),
  name: z.string().max(100).optional().default(''),
  quantity: z.number().positive('Quantity must be greater than 0').max(100000000),
  buyPrice: z.number().positive('Buy price must be greater than 0').max(100000000),
  currentPrice: z.number().positive().max(100000000).optional(),
  buyDate: z.string().max(20).optional(),
  categoryOrSector: z.string().max(100).optional(),
  folio: z.string().max(50).optional(),
});

export const confirmImportSchema = z.object({
  transactions: z
    .array(
      z.object({
        folio: z.string().optional().default(''),
        schemeName: z.string().min(1, 'Scheme name is required'),
        schemeCode: z.string().optional().default(''),
        type: z.enum(['PURCHASE', 'SIP', 'REDEMPTION', 'SWITCH_IN', 'SWITCH_OUT', 'DIVIDEND_REINVESTMENT']),
        date: z.string(),
        units: z.number(),
        price: z.number().min(0),
        amount: z.number(),
        source: z.enum(['CAS_CAMS', 'CAS_KFINTECH', 'BROKER_CSV', 'MANUAL']).optional().default('MANUAL'),
        unmatched: z.boolean().optional().default(false),
      })
    )
    .min(1, 'At least one transaction is required for confirmation'),
});

async function enrichHolding(doc) {
  let currentPrice = doc.currentPrice || doc.buyPrice;
  const isStock = doc.type.toUpperCase() === 'STOCK';

  if (isStock) {
    try {
      const sym = doc.symbolOrCode.endsWith('.NS') || doc.symbolOrCode.endsWith('.BO')
        ? doc.symbolOrCode
        : `${doc.symbolOrCode}.NS`;
      const q = await marketService.getQuote(sym);
      if (q && q.price) currentPrice = q.price;
    } catch {
      // Keep existing
    }
  } else {
    try {
      const fund = await Fund.findOne({
        $or: [{ code: doc.symbolOrCode }, { schemeCode: doc.symbolOrCode }],
      }).lean();
      if (fund && fund.nav) currentPrice = fund.nav;
    } catch {
      // Keep existing
    }
  }

  const invested = (doc.quantity || 0) * (doc.buyPrice || 0);
  const currentValue = (doc.quantity || 0) * (currentPrice || 0);
  const absoluteReturn = invested > 0 ? Number((((currentValue - invested) / invested) * 100).toFixed(2)) : 0;

  const buyDateObj = doc.buyDate ? new Date(doc.buyDate) : new Date(doc.createdAt);
  const years = Math.max(0.01, (Date.now() - buyDateObj.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const cagr = invested > 0 && currentValue > 0 && years > 0.08
    ? Number(((Math.pow(currentValue / invested, 1 / years) - 1) * 100).toFixed(2))
    : absoluteReturn;

  const xirr = doc.xirr !== null && doc.xirr !== undefined ? doc.xirr : cagr;

  return {
    id: doc._id.toString(),
    type: isStock ? 'STOCK' : 'MUTUAL_FUND',
    symbolOrCode: doc.symbolOrCode,
    name: doc.name || doc.symbolOrCode,
    quantity: doc.quantity,
    buyPrice: doc.buyPrice,
    currentPrice,
    buyDate: doc.buyDate || new Date(doc.createdAt).toISOString().split('T')[0],
    categoryOrSector: doc.categoryOrSector || '',
    folio: doc.folio || '',
    invested: Number(invested.toFixed(2)),
    currentValue: Number(currentValue.toFixed(2)),
    gain: Number((currentValue - invested).toFixed(2)),
    absoluteReturn,
    cagr,
    xirr,
  };
}

export async function getHoldings(req, res, next) {
  try {
    const docs = await Holding.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const holdings = await Promise.all(docs.map(enrichHolding));

    return res.status(200).json({
      success: true,
      holdings,
    });
  } catch (error) {
    next(error);
  }
}

export async function addHolding(req, res, next) {
  try {
    const data = req.body;

    const normalizedType = (data.type.toUpperCase() === 'FUND' || data.type.toUpperCase() === 'MUTUAL_FUND')
      ? 'MUTUAL_FUND'
      : 'STOCK';

    let initialPrice = Number(data.buyPrice);
    if (normalizedType === 'STOCK') {
      try {
        const sym = data.symbolOrCode.endsWith('.NS') || data.symbolOrCode.endsWith('.BO')
          ? data.symbolOrCode
          : `${data.symbolOrCode}.NS`;
        const q = await marketService.getQuote(sym);
        if (q && q.price) initialPrice = q.price;
      } catch {}
    } else {
      try {
        const fund = await Fund.findOne({
          $or: [{ code: data.symbolOrCode }, { schemeCode: data.symbolOrCode }],
        }).lean();
        if (fund && fund.nav) initialPrice = fund.nav;
      } catch {}
    }

    await Holding.create({
      userId: req.user.id,
      type: normalizedType,
      symbolOrCode: data.symbolOrCode.toUpperCase().trim(),
      name: data.name || data.symbolOrCode,
      quantity: Number(data.quantity),
      buyPrice: Number(data.buyPrice),
      currentPrice: initialPrice,
      buyDate: data.buyDate || new Date().toISOString().split('T')[0],
      categoryOrSector: data.categoryOrSector || '',
    });

    const docs = await Holding.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const holdings = await Promise.all(docs.map(enrichHolding));

    return res.status(201).json({
      success: true,
      holdings,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteHolding(req, res, next) {
  try {
    const { id } = req.params;

    await Holding.findOneAndDelete({ _id: id, userId: req.user.id });

    const docs = await Holding.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const holdings = await Promise.all(docs.map(enrichHolding));

    return res.status(200).json({
      success: true,
      holdings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/holdings/import/parse
 * Accepts multipart CAS PDF or Broker CSV and returns preview
 */
export async function parseImportFile(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a CAMS/KFintech CAS PDF or a Broker CSV.',
      });
    }

    const { password } = req.body;
    const originalName = (req.file.originalname || '').toLowerCase();
    const isPdf = originalName.endsWith('.pdf') || req.file.mimetype === 'application/pdf';

    let preview;
    if (isPdf) {
      preview = await parseCASPdf(req.file.buffer, password);
    } else {
      const csvText = req.file.buffer.toString('utf-8');
      preview = await parseBrokerCSV(csvText);
    }

    return res.status(200).json({
      success: true,
      preview,
    });
  } catch (error) {
    // If password is required or invalid, return friendly 400
    if (error.message.includes('PASSWORD_REQUIRED') || error.message.includes('INVALID_PASSWORD')) {
      return res.status(400).json({
        success: false,
        code: error.message.includes('PASSWORD_REQUIRED') ? 'PASSWORD_REQUIRED' : 'INVALID_PASSWORD',
        message: error.message,
      });
    }
    next(error);
  }
}

/**
 * POST /api/holdings/import/confirm
 * Commits confirmed transactions and recalculates Holdings
 */
export async function confirmImport(req, res, next) {
  try {
    const { transactions } = req.body;
    const result = await commitTransactionsAndBuildHoldings(req.user.id, transactions);

    const docs = await Holding.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const holdings = await Promise.all(docs.map(enrichHolding));

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${result.importedCount} transactions across ${result.holdingsCount} holdings.`,
      result,
      holdings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/holdings/transactions
 * Returns user transaction history with filtering
 */
export async function getTransactions(req, res, next) {
  try {
    const { holdingId, type, limit = 100 } = req.query;
    const filter = { userId: req.user.id };

    if (holdingId) filter.holdingId = holdingId;
    if (type) filter.type = type.toUpperCase();

    const txns = await Transaction.find(filter)
      .sort({ date: -1 })
      .limit(Math.min(500, parseInt(limit, 10)))
      .lean();

    return res.status(200).json({
      success: true,
      transactions: txns.map((t) => ({
        id: t._id.toString(),
        holdingId: t.holdingId ? t.holdingId.toString() : null,
        folio: t.folio || '',
        schemeName: t.schemeName,
        schemeCode: t.schemeCode,
        type: t.type,
        date: new Date(t.date).toISOString().split('T')[0],
        units: t.units,
        price: t.price,
        amount: t.amount,
        source: t.source,
        unmatched: t.unmatched,
      })),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/holdings/transactions/:id
 * Deletes a single transaction and recalculates the linked holding
 */
export async function deleteTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const txn = await Transaction.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!txn) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // If linked to a holding, recalculate holding units
    if (txn.holdingId) {
      const remainingTxns = await Transaction.find({ holdingId: txn.holdingId, userId: req.user.id });
      let netUnits = 0;
      let totalCost = 0;
      for (const t of remainingTxns) {
        if (t.units > 0) {
          netUnits += t.units;
          totalCost += Math.abs(t.amount);
        } else {
          netUnits = Math.max(0, netUnits - Math.abs(t.units));
        }
      }

      if (netUnits > 0) {
        await Holding.updateOne(
          { _id: txn.holdingId, userId: req.user.id },
          { quantity: Number(netUnits.toFixed(4)), buyPrice: netUnits > 0 ? Number((totalCost / netUnits).toFixed(4)) : 0 }
        );
      } else {
        await Holding.deleteOne({ _id: txn.holdingId, userId: req.user.id });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/holdings/performance
 * Returns portfolio holdings with side-by-side Absolute Return, CAGR, and XIRR
 */
export async function getPerformanceWithXirr(req, res, next) {
  try {
    const [docs, allTxns] = await Promise.all([
      Holding.find({ userId: req.user.id }).sort({ createdAt: -1 }),
      Transaction.find({ userId: req.user.id }).sort({ date: 1 }).lean(),
    ]);

    const holdings = await Promise.all(
      docs.map(async (doc) => {
        const enriched = await enrichHolding(doc);

        // Compute individual holding XIRR from transactions if available
        const holdingTxns = allTxns.filter(
          (t) => (t.holdingId && t.holdingId.toString() === doc._id.toString()) ||
                 (t.schemeCode && t.schemeCode.toUpperCase() === doc.symbolOrCode.toUpperCase())
        );

        let holdingXirr = null;
        if (holdingTxns.length > 0) {
          const cashFlows = holdingTxns.map((t) => ({
            amount: t.amount,
            date: new Date(t.date),
          }));
          // Add terminal current valuation
          if (enriched.currentValue > 0) {
            cashFlows.push({
              amount: enriched.currentValue,
              date: new Date(),
            });
          }
          holdingXirr = calculateXIRR(cashFlows);
        }

        if (holdingXirr === null) {
          holdingXirr = enriched.xirr;
        }

        return {
          ...enriched,
          xirr: holdingXirr,
        };
      })
    );

    // Compute portfolio-wide summary
    let totalInvested = 0;
    let totalCurrentValue = 0;
    const portfolioCashFlows = [];

    for (const h of holdings) {
      totalInvested += h.invested;
      totalCurrentValue += h.currentValue;
    }

    if (allTxns.length > 0) {
      for (const t of allTxns) {
        portfolioCashFlows.push({
          amount: t.amount,
          date: new Date(t.date),
        });
      }
      if (totalCurrentValue > 0) {
        portfolioCashFlows.push({
          amount: totalCurrentValue,
          date: new Date(),
        });
      }
    } else {
      for (const h of holdings) {
        if (h.invested > 0) {
          portfolioCashFlows.push({
            amount: -h.invested,
            date: new Date(h.buyDate),
          });
        }
      }
      if (totalCurrentValue > 0) {
        portfolioCashFlows.push({
          amount: totalCurrentValue,
          date: new Date(),
        });
      }
    }

    const portfolioXirr = calculateXIRR(portfolioCashFlows);
    const totalGain = Number((totalCurrentValue - totalInvested).toFixed(2));
    const totalAbsoluteReturn = totalInvested > 0 ? Number(((totalGain / totalInvested) * 100).toFixed(2)) : 0;

    // Approximate portfolio CAGR from first investment date
    let portfolioCagr = totalAbsoluteReturn;
    if (portfolioCashFlows.length > 1) {
      const firstDate = new Date(portfolioCashFlows[0].date);
      const totalYears = (Date.now() - firstDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (totalInvested > 0 && totalCurrentValue > 0 && totalYears > 0.08) {
        portfolioCagr = Number(((Math.pow(totalCurrentValue / totalInvested, 1 / totalYears) - 1) * 100).toFixed(2));
      }
    }

    return res.status(200).json({
      success: true,
      summary: {
        totalInvested: Number(totalInvested.toFixed(2)),
        totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
        totalGain,
        absoluteReturn: totalAbsoluteReturn,
        cagr: portfolioCagr,
        xirr: portfolioXirr,
      },
      holdings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/holdings/benchmark
 * Compares user's cash-flow performance against NIFTY 50
 */
export async function getBenchmarkComparison(req, res, next) {
  try {
    const comparison = await getPortfolioBenchmarkComparison(req.user.id);
    return res.status(200).json({
      success: true,
      benchmark: comparison,
    });
  } catch (error) {
    next(error);
  }
}
