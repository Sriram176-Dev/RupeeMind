/**
 * Indian Stock Market (NSE/BSE) Hours Utility
 * Market operates Mon-Fri 09:15 AM - 03:30 PM IST (UTC+5:30)
 */

export function getMarketStatus() {
  const now = new Date();

  // Convert current UTC time to IST (UTC + 5 hours 30 mins)
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffsetMs);

  const dayOfWeek = istTime.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const currentMinuteOfDay = hours * 60 + minutes;

  const marketOpenMinute = 9 * 60 + 15; // 09:15 IST
  const marketCloseMinute = 15 * 60 + 30; // 15:30 IST

  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isDuringTradingHours = currentMinuteOfDay >= marketOpenMinute && currentMinuteOfDay < marketCloseMinute;
  const isOpen = isWeekday && isDuringTradingHours;

  // Calculate Next Open
  let nextOpenIst = new Date(istTime);
  if (isWeekday && currentMinuteOfDay < marketOpenMinute) {
    // Opens today at 09:15
    nextOpenIst.setUTCHours(9, 15, 0, 0);
  } else {
    // Next market day
    let daysToAdd = 1;
    if (dayOfWeek === 5 && currentMinuteOfDay >= marketCloseMinute) {
      daysToAdd = 3; // Friday evening -> Monday
    } else if (dayOfWeek === 6) {
      daysToAdd = 2; // Saturday -> Monday
    } else if (dayOfWeek === 0) {
      daysToAdd = 1; // Sunday -> Monday
    }
    nextOpenIst.setUTCDate(nextOpenIst.getUTCDate() + daysToAdd);
    nextOpenIst.setUTCHours(9, 15, 0, 0);
  }

  // Convert IST back to UTC Date object
  const nextOpenUtc = new Date(nextOpenIst.getTime() - istOffsetMs);

  // Next Close
  let nextCloseIst = new Date(istTime);
  if (isOpen) {
    nextCloseIst.setUTCHours(15, 30, 0, 0);
  } else {
    nextCloseIst = new Date(nextOpenIst);
    nextCloseIst.setUTCHours(15, 30, 0, 0);
  }
  const nextCloseUtc = new Date(nextCloseIst.getTime() - istOffsetMs);

  return {
    isOpen,
    status: isOpen ? 'OPEN' : 'CLOSED',
    session: isOpen ? 'Regular Trading' : isWeekday && currentMinuteOfDay < marketOpenMinute ? 'Pre-Market' : 'Market Closed',
    serverTime: now.toISOString(),
    istTimeString: istTime.toISOString().replace('Z', '+05:30'),
    nextOpen: nextOpenUtc.toISOString(),
    nextClose: nextCloseUtc.toISOString(),
    timezone: 'Asia/Kolkata',
  };
}
