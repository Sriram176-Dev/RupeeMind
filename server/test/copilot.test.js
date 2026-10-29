import { describe, it, expect } from 'vitest';
import * as copilotService from '../src/services/copilotService.js';

describe('AI Financial Copilot Service (RupeeBot)', () => {
  const dummyUserId = '64b1f2e8f1c2d3a4b5c6d7e8';

  it('gathers unified user financial context with fallback defaults', async () => {
    const context = await copilotService.getUserFinancialContext(dummyUserId);
    expect(context).toBeDefined();
    expect(context.profile).toBeDefined();
    expect(context.profile.riskTolerance).toBeDefined();
    expect(context.realPortfolio).toBeDefined();
    expect(context.realPortfolio.totalHoldingsCount).toBeGreaterThanOrEqual(0);
    expect(context.paperTrading).toBeDefined();
    expect(context.paperTrading.cashBalance).toBeGreaterThan(0);
  });

  it('answers risk and concentration queries with tailored recommendations', async () => {
    const response = await copilotService.chatWithCopilot(
      dummyUserId,
      'Audit my portfolio risk and concentration'
    );
    expect(response).toBeDefined();
    expect(response.role).toBe('assistant');
    expect(response.content).toContain('Portfolio Risk & Concentration Audit');
    expect(response.suggestions.length).toBeGreaterThan(0);
    expect(response.contextSummary).toBeDefined();
  });

  it('answers Indian capital gains and Section 80C tax queries accurately', async () => {
    const response = await copilotService.chatWithCopilot(
      dummyUserId,
      'How does tax on equity capital gains and ELSS 80C work?'
    );
    expect(response).toBeDefined();
    expect(response.content).toContain('LTCG');
    expect(response.content).toContain('12.5%');
    expect(response.content).toContain('80C');
    expect(response.suggestions.length).toBeGreaterThan(0);
  });

  it('reviews paper trading sandbox positions and performance', async () => {
    const response = await copilotService.chatWithCopilot(
      dummyUserId,
      'Review my paper trading positions and performance'
    );
    expect(response).toBeDefined();
    expect(response.content).toContain('Paper Trading');
    expect(response.suggestions.length).toBeGreaterThan(0);
  });

  it('initializes persistent chat session and clears it on demand', async () => {
    const session = await copilotService.getCopilotChatSession(dummyUserId);
    expect(session).toBeDefined();
    expect(session.messages.length).toBeGreaterThan(0);

    const clearResult = await copilotService.clearCopilotChatSession(dummyUserId);
    expect(clearResult.success).toBe(true);
  });
});
