import { describe, it, expect } from 'vitest';
import { calculateXIRR } from '../src/services/xirrService.js';
import { generateSchedule, findNavForDate } from '../src/controllers/sipController.js';

describe('XIRR and SIP Schedule calculations', () => {
  const sampleNavHistory = [
    { date: new Date('2023-01-01'), nav: 100 },
    { date: new Date('2023-02-01'), nav: 105 },
    { date: new Date('2023-03-01'), nav: 110 },
    { date: new Date('2023-04-01'), nav: 115 },
    { date: new Date('2023-05-01'), nav: 120 },
    { date: new Date('2023-06-01'), nav: 125 },
  ];

  it('correctly finds exact or next available NAV date', () => {
    const navEntry1 = findNavForDate(sampleNavHistory, new Date('2023-01-01'));
    expect(navEntry1?.nav).toBe(100);

    // Weekend date finds next available
    const navWeekend = findNavForDate(sampleNavHistory, new Date('2023-01-15'));
    expect(navWeekend?.nav).toBe(105); // Nearest on or after 2023-01-15 is 2023-02-01
  });

  it('generates monthly installment schedule correctly', () => {
    const start = new Date('2023-01-01');
    const end = new Date('2023-06-01');
    const schedule = generateSchedule(start, 'Monthly', end);

    expect(schedule.length).toBe(6);
    expect(schedule[0].toISOString().slice(0, 10)).toBe('2023-01-01');
    expect(schedule[5].toISOString().slice(0, 10)).toBe('2023-06-01');
  });

  it('computes accurate units accumulated from NAV series', () => {
    const amount = 1000;
    const navs = [100, 105, 110, 115, 120, 125];
    let totalUnits = 0;
    for (const nav of navs) {
      totalUnits += amount / nav;
    }

    const latestNav = 125;
    const currentValue = totalUnits * latestNav;
    const invested = amount * navs.length;

    expect(invested).toBe(6000);
    expect(currentValue).toBeGreaterThan(invested);
    expect(totalUnits).toBeCloseTo(53.648, 2);
  });

  it('computes positive XIRR for appreciating SIP', () => {
    const cashFlows = [
      { amount: -5000, date: new Date('2023-01-01') },
      { amount: -5000, date: new Date('2023-02-01') },
      { amount: -5000, date: new Date('2023-03-01') },
      { amount: -5000, date: new Date('2023-04-01') },
      { amount: -5000, date: new Date('2023-05-01') },
      { amount: -5000, date: new Date('2023-06-01') },
      { amount: 33000, date: new Date('2023-06-01') }, // 30k invested -> 33k value
    ];

    const xirr = calculateXIRR(cashFlows);
    expect(xirr).not.toBeNull();
    expect(xirr).toBeGreaterThan(0);
    expect(xirr).toBeGreaterThan(20); // 10% gain over ~3.5 months annualized is >20%
  });

  it('handles negative return XIRR correctly', () => {
    const cashFlows = [
      { amount: -10000, date: new Date('2023-01-01') },
      { amount: 8000, date: new Date('2024-01-01') },
    ];

    const xirr = calculateXIRR(cashFlows);
    expect(xirr).not.toBeNull();
    expect(xirr).toBeCloseTo(-20, 0);
  });
});
