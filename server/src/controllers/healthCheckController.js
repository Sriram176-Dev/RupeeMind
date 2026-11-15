import { z } from 'zod';
import {
  evaluateInsuranceAndEmergency,
  updateInsuranceParameters,
} from '../services/insuranceHealthService.js';

export const updateInsuranceSchema = z.object({
  emergencyFundAmount: z.number().min(0).optional(),
  emergencyFundMonthsTarget: z.number().min(1).max(24).optional(),
  hasLifeInsurance: z.boolean().optional(),
  termInsuranceCover: z.number().min(0).optional(),
  hasHealthInsurance: z.boolean().optional(),
  healthInsuranceCover: z.number().min(0).optional(),
});

/**
 * GET /api/health-check/insurance-emergency
 * Evaluates emergency fund adequacy, term life cover, and health insurance shortfall
 */
export async function getInsuranceAndEmergencyAudit(req, res, next) {
  try {
    const audit = await evaluateInsuranceAndEmergency(req.user.id);
    return res.json({
      success: true,
      data: audit,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/health-check/insurance-emergency
 * Updates profile insurance and emergency buffer settings
 */
export async function updateInsuranceAuditSettings(req, res, next) {
  try {
    const validated = updateInsuranceSchema.parse(req.body);
    await updateInsuranceParameters(req.user.id, validated);
    const updatedAudit = await evaluateInsuranceAndEmergency(req.user.id);

    return res.json({
      success: true,
      data: updatedAudit,
      message: 'Insurance and emergency parameters updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}
