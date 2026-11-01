import * as copilotService from "../services/copilotService.js";

export async function chatController(req, res, next) {
  try {
    const userId = req.user.id;
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: "Message text is required." },
      });
    }

    const result = await copilotService.chatWithCopilot(
      userId,
      message.trim(),
      history,
    );
    return res.status(200).json({
      success: true,
      data: {
        reply: result.content,
        suggestions: result.suggestions,
        contextSummary: result.contextSummary,
        timestamp: result.timestamp,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSessionController(req, res, next) {
  try {
    const userId = req.user.id;
    const session = await copilotService.getCopilotChatSession(userId);
    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (err) {
    next(err);
  }
}

export async function clearSessionController(req, res, next) {
  try {
    const userId = req.user.id;
    await copilotService.clearCopilotChatSession(userId);
    return res.status(200).json({
      success: true,
      message: "Chat history cleared successfully.",
    });
  } catch (err) {
    next(err);
  }
}

export async function getContextSummaryController(req, res, next) {
  try {
    const userId = req.user.id;
    const context = await copilotService.getUserFinancialContext(userId);
    return res.status(200).json({
      success: true,
      data: context,
    });
  } catch (err) {
    next(err);
  }
}
