/**
 * SIP Reminder Job (Job A)
 * Sends notifications to users whose SIPs have installments due in the next 2 days.
 */
import { TrackedSIP } from '../models/TrackedSIP.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';

export async function runSipRemindersJob() {
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  // Find all active SIPs
  const allSips = await TrackedSIP.find({}).lean();
  let notificationsCreated = 0;

  for (const sip of allSips) {
    const startDate = new Date(sip.startDate);
    if (isNaN(startDate.getTime())) continue;

    // Calculate next installment date
    let current = new Date(startDate);
    const freq = sip.frequency || 'Monthly';

    while (current <= now) {
      if (freq === 'Monthly') current.setMonth(current.getMonth() + 1);
      else if (freq === 'Weekly') current.setDate(current.getDate() + 7);
      else if (freq === 'Quarterly') current.setMonth(current.getMonth() + 3);
    }

    // Check if next installment is within 2 days
    if (current <= twoDaysFromNow) {
      // Check user preferences
      const user = await User.findById(sip.userId).lean();
      if (!user) continue;
      if (user.preferences?.sipReminders === false) continue;

      const dateStr = current.toISOString().split('T')[0];
      const dedupeKey = `sip_reminder_${sip._id}_${dateStr}`;

      try {
        await Notification.create({
          userId: sip.userId,
          type: 'sip_reminder',
          title: `SIP Due: ${sip.fundName}`,
          body: `Your ₹${sip.amount.toLocaleString('en-IN')} ${freq.toLowerCase()} SIP installment for ${sip.fundName} is scheduled for ${dateStr}.`,
          meta: {
            route: '/portfolio',
          },
          dedupeKey,
        });
        notificationsCreated++;
      } catch (err) {
        // Duplicate key error (11000) means already sent — skip
        if (err.code !== 11000) {
          console.error(`[SipReminders] Error creating notification for SIP ${sip._id}:`, err.message);
        }
      }
    }
  }

  console.log(`[SipReminders] Created ${notificationsCreated} notifications.`);
  return { notificationsCreated };
}
