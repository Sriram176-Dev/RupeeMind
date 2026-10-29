import { apiClient } from '../lib/apiClient';
import type {
  CopilotChatResponse,
  CopilotSession,
  CopilotMessage,
} from '../types';

export async function sendCopilotMessageApi(
  message: string,
  history: CopilotMessage[] = []
): Promise<CopilotChatResponse> {
  const res = await apiClient.post<{ success: boolean; data: CopilotChatResponse }>(
    '/copilot/chat',
    { message, history }
  );
  return res.data.data;
}

export async function getCopilotSessionApi(): Promise<CopilotSession> {
  const res = await apiClient.get<{ success: boolean; data: CopilotSession }>(
    '/copilot/session'
  );
  return res.data.data;
}

export async function clearCopilotSessionApi(): Promise<void> {
  await apiClient.delete('/copilot/session');
}

export const copilotService = {
  sendMessage: sendCopilotMessageApi,
  getSession: getCopilotSessionApi,
  clearSession: clearCopilotSessionApi,
};

export default copilotService;
