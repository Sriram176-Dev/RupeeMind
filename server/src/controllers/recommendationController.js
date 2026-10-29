import { z } from 'zod';
import * as recommendationService from '../services/recommendationService.js';

export const recommendationHistoryQuerySchema = z.object({
  status: z.enum(['active', 'archived', 'all']).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export async function generateRecommendationController(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await recommendationService.generateFundRecommendations(userId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getLatestRecommendationController(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await recommendationService.getLatestRecommendation(userId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecommendationHistoryController(req, res, next) {
  try {
    const userId = req.user.id;
    const { status, limit, page } = req.query;
    const result = await recommendationService.getRecommendationHistory(userId, {
      status,
      limit,
      page,
    });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecommendationByIdController(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await recommendationService.getRecommendationById(userId, id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function compareRecommendationsController(req, res, next) {
  try {
    const userId = req.user.id;
    const { id1, id2 } = req.params;
    const result = await recommendationService.compareRecommendations(userId, id1, id2);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function archiveRecommendationController(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await recommendationService.archiveRecommendation(userId, id);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Recommendation archived successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteRecommendationController(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await recommendationService.deleteRecommendation(userId, id);
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Recommendation deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
