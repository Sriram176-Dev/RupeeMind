import {
  getPaperTradingSummary,
  placePaperOrder,
  cancelPaperOrder,
  getPaperOrders,
  resetPaperTradingWallet,
  calculateBrokerageCharges,
} from '../services/paperTradingService.js';
import { getQuote } from '../services/marketService.js';

export async function getSummary(req, res, next) {
  try {
    const summary = await getPaperTradingSummary(req.user.id);
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrders(req, res, next) {
  try {
    const { status, limit, skip } = req.query;
    const result = await getPaperOrders(req.user.id, { status, limit, skip });
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function submitOrder(req, res, next) {
  try {
    const result = await placePaperOrder(req.user.id, req.body);
    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to place order',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function cancelOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const result = await cancelPaperOrder(req.user.id, orderId);
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel order',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function resetWallet(req, res, next) {
  try {
    const result = await resetPaperTradingWallet(req.user.id);
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function estimateCharges(req, res, next) {
  try {
    const { symbol, transactionType, productType, quantity, price } = req.body;
    let sharePrice = price ? parseFloat(price) : 0;
    if (!sharePrice && symbol) {
      const q = await getQuote(symbol);
      sharePrice = q?.price || 0;
    }

    const charges = calculateBrokerageCharges(
      transactionType || 'BUY',
      productType || 'DELIVERY',
      sharePrice,
      parseInt(quantity, 10) || 1
    );

    res.json({
      success: true,
      data: {
        charges,
        price: sharePrice,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}
