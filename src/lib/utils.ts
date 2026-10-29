import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number, showDecimals: boolean = true): string {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? (amount % 1 !== 0 ? 2 : 0) : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactINR(amount: number): string {
  if (isNaN(amount) || amount === 0) return '₹0';
  const absVal = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absVal >= 1_00_00_000) {
    // 1 Crore = 10,000,000
    const cr = absVal / 1_00_00_000;
    return `${sign}₹${cr.toFixed(cr >= 10 ? 1 : 2)} Cr`;
  } else if (absVal >= 1_00_000) {
    // 1 Lakh = 100,000
    const l = absVal / 1_00_000;
    return `${sign}₹${l.toFixed(l >= 10 ? 1 : 2)} L`;
  } else if (absVal >= 1_000) {
    const k = absVal / 1_000;
    return `${sign}₹${k.toFixed(1)}k`;
  }
  return formatINR(amount, false);
}

export function formatNumber(num: number, maximumFractionDigits: number = 2): string {
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits,
  }).format(num);
}

export function formatPercent(value: number, includeSign: boolean = true): string {
  if (isNaN(value)) return '0.00%';
  const prefix = includeSign && value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function getISTDate(): Date {
  const now = new Date();
  // IST is UTC + 5:30
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 5.5));
}

export function isIndianMarketOpen(): boolean {
  const ist = getISTDate();
  const day = ist.getDay(); // 0 = Sun, 6 = Sat
  if (day === 0 || day === 6) return false;

  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const openTime = 9 * 60 + 15; // 09:15 IST
  const closeTime = 15 * 60 + 30; // 15:30 IST

  return timeInMinutes >= openTime && timeInMinutes <= closeTime;
}

export function getMarketStatus(): { isOpen: boolean; text: string; subtext: string } {
  const isOpen = isIndianMarketOpen();
  const ist = getISTDate();
  const timeStr = ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  if (isOpen) {
    return {
      isOpen: true,
      text: 'Market Open',
      subtext: `NSE & BSE Live • IST ${timeStr}`,
    };
  } else {
    const day = ist.getDay();
    const isWeekend = day === 0 || day === 6;
    return {
      isOpen: false,
      text: 'Market Closed',
      subtext: isWeekend ? 'Opens Monday 9:15 AM IST' : 'Opens tomorrow 9:15 AM IST',
    };
  }
}
