import { z } from 'zod';
import { TrackedSIP } from '../models/TrackedSIP.js';
import { Fund } from '../models/Fund.js';
import { calculateXIRR } from '../services/xirrService.js';
import { parseMfDate } from '../services/fundService.js';

export const createSipSchema = z.object({
  fundCode: z.string().min(1).max(50),
  fundName: z.string().min(1).max(150).optional().default('Mutual Fund SIP'),
  amount: z.coerce.number().positive().max(10000000, 'SIP amount too high'),
  frequency: z.enum(['Monthly', 'Weekly', 'Quarterly']).optional().default('Monthly'),
  startDate: z.string().max(30).optional(),
});

/**
 * Compute installment dates from startDate up to endDate (default now), based on frequency.
 */
export function generateSchedule(startDate, frequency, endDate = new Date()) {
  const dates = [];
  const end = new Date(endDate);
  let current = new Date(startDate);

  while (current <= end) {
    dates.push(new Date(current));
    if (frequency === 'Monthly') {
      current.setMonth(current.getMonth() + 1);
    } else if (frequency === 'Weekly') {
      current.setDate(current.getDate() + 7);
    } else if (frequency === 'Quarterly') {
      current.setMonth(current.getMonth() + 3);
    }
  }
  return dates;
}

export const getInstallmentDates = generateSchedule;

/**
 * Find the next SIP date after today, given frequency.
 */
export function getNextSipDate(startDate, frequency) {
  const now = new Date();
  let current = new Date(startDate);

  while (current <= now) {
    if (frequency === 'Monthly') {
      current.setMonth(current.getMonth() + 1);
    } else if (frequency === 'Weekly') {
      current.setDate(current.getDate() + 7);
    } else if (frequency === 'Quarterly') {
      current.setMonth(current.getMonth() + 3);
    }
  }
  return current;
}

/**
 * Find the closest NAV entry for a given date from navHistory.
 * Returns null if no entry within tolerance is found.
 */
export function findNavForDate(navEntries, targetDate) {
  if (!navEntries || navEntries.length === 0) return null;

  const targetTime = targetDate instanceof Date ? targetDate.getTime() : new Date(targetDate).getTime();
  const toleranceMs = 31 * 24 * 60 * 60 * 1000; // 31 days max search tolerance

  let bestOnOrAfter = null;
  let minDiffAfter = Infinity;
  let bestPrior = null;
  let minDiffPrior = Infinity;

  for (const entry of navEntries) {
    let entryDate = entry.dateObj;
    if (!entryDate) {
      if (entry.date instanceof Date) entryDate = entry.date;
      else if (typeof entry.date === 'string' && entry.date.includes('-') && entry.date.split('-')[0].length === 2) {
        entryDate = parseMfDate(entry.date);
      } else {
        entryDate = new Date(entry.date);
      }
    }
    if (!entryDate || isNaN(entryDate.getTime())) continue;

    const timeDiff = entryDate.getTime() - targetTime;
    if (timeDiff >= 0 && timeDiff < minDiffAfter && timeDiff <= toleranceMs) {
      minDiffAfter = timeDiff;
      bestOnOrAfter = entry;
    } else if (timeDiff < 0 && Math.abs(timeDiff) < minDiffPrior && Math.abs(timeDiff) <= toleranceMs) {
      minDiffPrior = Math.abs(timeDiff);
      bestPrior = entry;
    }
  }

  return bestOnOrAfter || bestPrior || null;
}

/**
 * GET /api/sips
 * Return user's tracked SIPs with computed NAV-based values, XIRR
 */
export async function getTrackedSIPs(req, res, next) {
  try {
    const sips = await TrackedSIP.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();

    const enriched = await Promise.all(
      sips.map(async (sip) => {
        const startDate = new Date(sip.startDate);
        const installmentDates = getInstallmentDates(startDate, sip.frequency);
        const installmentsCompleted = installmentDates.length;

        // Try to get real NAV data from Fund model
        const fund = await Fund.findOne({
          $or: [{ code: sip.fundCode }, { schemeCode: sip.fundCode }],
        }).lean();

        const investedValue = sip.amount * installmentsCompleted;
        let currentValue = investedValue;
        let totalUnits = 0;
        let partialHistory = false;
        let xirr = null;
        let latestNav = fund?.nav || null;

        if (fund && fund.navHistory && fund.navHistory.length > 0) {
          // Parse navHistory once
          const parsedNav = fund.navHistory.map((entry) => ({
            ...entry,
            dateObj: parseMfDate(entry.date),
            navVal: parseFloat(entry.nav),
          })).filter((e) => e.dateObj && !isNaN(e.navVal) && e.navVal > 0);

          // Calculate units purchased at each installment date
          let matchedInstallments = 0;
          const cashFlows = [];

          for (const instDate of installmentDates) {
            const navEntry = findNavForDate(parsedNav, instDate);
            if (navEntry) {
              const units = sip.amount / navEntry.navVal;
              totalUnits += units;
              matchedInstallments++;
              cashFlows.push({ amount: -sip.amount, date: instDate });
            } else {
              // No NAV data for this date — use latest NAV as fallback
              if (latestNav && latestNav > 0) {
                totalUnits += sip.amount / latestNav;
                matchedInstallments++;
                cashFlows.push({ amount: -sip.amount, date: instDate });
              }
            }
          }

          partialHistory = matchedInstallments < installmentsCompleted;

          // Current value = totalUnits × latestNav
          if (latestNav && latestNav > 0 && totalUnits > 0) {
            currentValue = Math.round(totalUnits * latestNav);
          }

          // XIRR calculation
          if (cashFlows.length >= 1 && currentValue > 0) {
            cashFlows.push({ amount: currentValue, date: new Date() });
            xirr = calculateXIRR(cashFlows);
          }
        } else {
          // No NAV history available - estimate from CAGR
          if (fund && fund.cagr3Y) {
            const annualRate = fund.cagr3Y / 100;
            const months = installmentsCompleted;
            const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
            if (monthlyRate > 0) {
              currentValue = Math.round(
                sip.amount * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate))
              );
            }
          }
          partialHistory = true;
        }

        const gain = currentValue - investedValue;
        const gainPercent = investedValue > 0 ? Number(((gain / investedValue) * 100).toFixed(2)) : 0;
        const nextDate = getNextSipDate(startDate, sip.frequency);

        return {
          id: sip._id.toString(),
          fundCode: sip.fundCode,
          fundName: sip.fundName,
          amount: sip.amount,
          frequency: sip.frequency,
          startDate: sip.startDate,
          installmentsCompleted,
          investedValue,
          currentValue: Math.max(investedValue * 0.5, currentValue), // Floor at 50% to avoid nonsense
          gain,
          gainPercent,
          totalUnits: Number(totalUnits.toFixed(4)),
          xirr,
          nextDate: nextDate.toISOString(),
          partialHistory,
          latestNav,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/sips
 * Add a new tracked SIP
 */
export async function addTrackedSIP(req, res, next) {
  try {
    const { fundCode, fundName, amount, frequency, startDate } = req.body;

    const parsedStart = startDate ? new Date(startDate) : new Date();
    if (isNaN(parsedStart.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start date' });
    }

    const sip = await TrackedSIP.create({
      userId: req.user.id,
      fundCode,
      fundName: fundName || 'Mutual Fund SIP',
      amount: parseFloat(amount) || 5000,
      frequency: frequency || 'Monthly',
      startDate: parsedStart,
    });

    return res.status(201).json({
      success: true,
      data: sip,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/sips/:id
 */
export async function deleteTrackedSIP(req, res, next) {
  try {
    const { id } = req.params;
    await TrackedSIP.findOneAndDelete({ _id: id, userId: req.user.id });
    return res.status(200).json({
      success: true,
      message: 'Tracked SIP removed successfully',
    });
  } catch (err) {
    next(err);
  }
}
