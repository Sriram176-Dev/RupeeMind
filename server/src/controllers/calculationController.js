import { z } from 'zod';
import { SavedCalculation } from '../models/SavedCalculation.js';

function isSafeObject(val, depth = 0) {
  if (depth > 3) return false;
  if (val === null || val === undefined) return true;
  if (typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean') return true;
  if (Array.isArray(val)) {
    if (val.length > 100) return false;
    return val.every((item) => isSafeObject(item, depth + 1));
  }
  if (typeof val === 'object') {
    const keys = Object.keys(val);
    if (keys.length > 50) return false;
    for (const key of keys) {
      if (key.startsWith('$') || key.includes('.')) return false;
      if (!isSafeObject(val[key], depth + 1)) return false;
    }
    return true;
  }
  return false;
}

export const saveCalculationSchema = z.object({
  type: z.string().min(1, 'Type is required').max(50).trim(),
  inputs: z.any().refine(isSafeObject, { message: 'Invalid or unsafe inputs object' }).optional(),
  result: z.any().refine(isSafeObject, { message: 'Invalid or unsafe result object' }).optional(),
});

export async function getCalculations(req, res, next) {
  try {
    const calculations = await SavedCalculation.find({ userId: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      calculations,
    });
  } catch (error) {
    next(error);
  }
}

export async function saveCalculation(req, res, next) {
  try {
    const { type, inputs, result } = req.body;

    const calculation = await SavedCalculation.create({
      userId: req.user.id,
      type,
      inputs: inputs || {},
      result: result || {},
    });

    return res.status(201).json({
      success: true,
      calculation,
    });
  } catch (error) {
    next(error);
  }
}
