import { apiClient } from '../lib/apiClient';
import type { UserGoal, GoalSkipSimulationResponse } from '../types';

/**
 * Fetches all goals with projections
 */
export async function getGoalsApi(): Promise<UserGoal[]> {
  const response = await apiClient.get<{ success: boolean; data: UserGoal[] }>('/goals');
  return response.data.data;
}

/**
 * Creates a new financial goal
 */
export async function createGoalApi(goalData: Partial<UserGoal>): Promise<UserGoal> {
  const response = await apiClient.post<{ success: boolean; data: UserGoal }>('/goals', goalData);
  return response.data.data;
}

/**
 * Updates an existing financial goal
 */
export async function updateGoalApi(goalId: string, goalData: Partial<UserGoal>): Promise<UserGoal> {
  const response = await apiClient.put<{ success: boolean; data: UserGoal }>(`/goals/${goalId}`, goalData);
  return response.data.data;
}

/**
 * Deletes a financial goal
 */
export async function deleteGoalApi(goalId: string): Promise<void> {
  await apiClient.delete(`/goals/${goalId}`);
}

/**
 * Simulates skipping N monthly SIP installments for a specific goal
 */
export async function simulateGoalSkipApi(
  goalId: string,
  skipCount: number
): Promise<GoalSkipSimulationResponse> {
  const response = await apiClient.post<{ success: boolean; data: GoalSkipSimulationResponse }>(
    `/goals/${goalId}/simulate-skip`,
    { skipCount }
  );
  return response.data.data;
}
