import { z } from 'zod';
import { Holding } from '../models/Holding.js';
import * as marketService from '../services/marketService.js';
import { Fund } from '../models/Fund.js';

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
