import { PaperWallet } from "../models/PaperWallet.js";
import { PaperPosition } from "../models/PaperPosition.js";
import { PaperOrder } from "../models/PaperOrder.js";
import {
  getQuote,
  getQuotes,
  toCleanSymbol,
  toYahooSymbol,
} from "./marketService.js";
import { NIFTY_50_SYMBOLS } from "../config/marketUniverse.js";

const INITIAL_CAPITAL = 1000000; // ₹10,00,000

/**
 * Calculate realistic Indian statutory brokerage & charges (Zerodha / Groww style)
 * @param {string} transactionType - 'BUY' or 'SELL'
 * @param {string} productType - 'DELIVERY' or 'INTRADAY'
 * @param {number} price - Share price
 * @param {number} quantity - Number of shares
 */
export function calculateBrokerageCharges(
  transactionType,
  productType,
  price,
  quantity,
) {
  const turnover = price * quantity;

  // 1. Brokerage: ₹0 for delivery, flat ₹20 or 0.03% (whichever is lower) for intraday
  let brokerage = 0;
  if (productType === "INTRADAY") {
    brokerage = Math.min(20, Number((turnover * 0.0003).toFixed(2)));
  }

  // 2. STT (Securities Transaction Tax):
  // Delivery: 0.1% on buy & sell turnover
  // Intraday: 0.025% on sell turnover only
  let stt = 0;
  if (productType === "DELIVERY") {
    stt = Number((turnover * 0.001).toFixed(2));
  } else if (productType === "INTRADAY" && transactionType === "SELL") {
    stt = Number((turnover * 0.00025).toFixed(2));
  }

  // 3. Exchange Turnover Charge: 0.00345% on turnover
  const exchangeTurnover = Number((turnover * 0.0000345).toFixed(2));

  // 4. GST: 18% on (brokerage + exchange turnover charge)
  const gst = Number(((brokerage + exchangeTurnover) * 0.18).toFixed(2));

  // 5. Stamp Duty: 0.015% on buy turnover only
  let stampDuty = 0;
  if (transactionType === "BUY") {
    stampDuty = Number((turnover * 0.00015).toFixed(2));
  }

  const totalCharges = Number(
    (brokerage + stt + exchangeTurnover + gst + stampDuty).toFixed(2),
  );

  return {
    brokerage,
    stt,
    exchangeTurnover,
    gst,
    stampDuty,
    totalCharges,
    turnover: Number(turnover.toFixed(2)),
  };
}

/**
 * Get or initialize user's virtual paper wallet
 */
export async function getOrCreateWallet(userId) {
  let wallet = await PaperWallet.findOne({ userId });
  if (!wallet) {
    wallet = await PaperWallet.create({
      userId,
      cashBalance: INITIAL_CAPITAL,
      initialCapital: INITIAL_CAPITAL,
      realizedPnL: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
    });
  }
  return wallet;
}

/**
 * Get comprehensive paper trading summary with live market prices & P&L
 */
export async function getPaperTradingSummary(userId) {
  const wallet = await getOrCreateWallet(userId);

  // Fetch active positions
  const positions = await PaperPosition.find({ userId }).lean();

  let totalInvestedValue = 0;
  let totalCurrentValue = 0;
  let totalUnrealizedPnL = 0;
  let todayUnrealizedPnL = 0;

  let enrichedPositions = [];

  if (positions.length > 0) {
    const symbols = positions.map((p) => p.symbol);
    const quotesResult = await getQuotes(symbols);
    const quoteMap = new Map();
    (quotesResult.data || []).forEach((q) => {
      quoteMap.set(q.symbol, q);
    });

    enrichedPositions = positions.map((pos) => {
      const quote = quoteMap.get(pos.symbol);
      const currentPrice = quote?.price ?? pos.averageBuyPrice;
      const dayChange = quote?.change ?? 0;
      const dayChangePercent = quote?.changePercent ?? 0;

      const investedValue = Number(
        (pos.quantity * pos.averageBuyPrice).toFixed(2),
      );
      const currentValue = Number((pos.quantity * currentPrice).toFixed(2));
      const unrealizedPnL = Number((currentValue - investedValue).toFixed(2));
      const unrealizedPnLPercent =
        investedValue > 0
          ? Number(((unrealizedPnL / investedValue) * 100).toFixed(2))
          : 0;
      const dayPnL = Number((pos.quantity * dayChange).toFixed(2));

      totalInvestedValue += investedValue;
      totalCurrentValue += currentValue;
      totalUnrealizedPnL += unrealizedPnL;
      todayUnrealizedPnL += dayPnL;

      return {
        ...pos,
        currentPrice,
        investedValue,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent,
        dayPnL,
        dayChange,
        dayChangePercent,
        previousClose: quote?.previousClose ?? currentPrice,
      };
    });
  }

  const totalPortfolioValue = Number(
    (wallet.cashBalance + totalCurrentValue).toFixed(2),
  );
  const overallPnL = Number(
    (totalPortfolioValue - wallet.initialCapital).toFixed(2),
  );
  const overallPnLPercent = Number(
    ((overallPnL / wallet.initialCapital) * 100).toFixed(2),
  );
  const winRatePercent =
    wallet.totalTrades > 0
      ? Number(((wallet.winningTrades / wallet.totalTrades) * 100).toFixed(1))
      : 0;

  // Recent 5 executed/pending orders
  const recentOrders = await PaperOrder.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return {
    wallet: {
      cashBalance: Number(wallet.cashBalance.toFixed(2)),
      initialCapital: wallet.initialCapital,
      realizedPnL: Number(wallet.realizedPnL.toFixed(2)),
      totalTrades: wallet.totalTrades,
      winningTrades: wallet.winningTrades,
      losingTrades: wallet.losingTrades,
      resetCount: wallet.resetCount,
      lastResetAt: wallet.lastResetAt,
    },
    performance: {
      totalPortfolioValue,
      totalInvestedValue: Number(totalInvestedValue.toFixed(2)),
      totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
      totalUnrealizedPnL: Number(totalUnrealizedPnL.toFixed(2)),
      todayUnrealizedPnL: Number(todayUnrealizedPnL.toFixed(2)),
      overallPnL,
      overallPnLPercent,
      winRatePercent,
    },
    positions: enrichedPositions,
    recentOrders,
  };
}

/**
 * Execute or place a paper trade order
 */
export async function placePaperOrder(userId, payload) {
  const {
    symbol: rawSymbol,
    transactionType, // 'BUY' | 'SELL'
    orderType = "MARKET", // 'MARKET' | 'LIMIT'
    productType = "DELIVERY", // 'DELIVERY' | 'INTRADAY'
    quantity: rawQty,
    limitPrice: rawLimitPrice,
  } = payload;

  const quantity = parseInt(rawQty, 10);
  if (!quantity || quantity <= 0) {
    throw new Error("Quantity must be a positive integer");
  }

  const symbol = toCleanSymbol(rawSymbol);
  if (!symbol) {
    throw new Error("Invalid stock symbol provided");
  }

  // Fetch live market quote
  const liveQuote = await getQuote(symbol);
  if (!liveQuote || !liveQuote.price || liveQuote.price <= 0) {
    throw new Error(`Unable to obtain market quote for ${symbol}`);
  }

  const marketPrice = liveQuote.price;
  const companyName = liveQuote.companyName || symbol;
  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const wallet = await getOrCreateWallet(userId);

  // Determine fill conditions
  let status = "EXECUTED";
  let executedPrice = null;
  const requestedPrice =
    orderType === "LIMIT" ? Number(parseFloat(rawLimitPrice).toFixed(2)) : null;

  if (orderType === "LIMIT") {
    if (!requestedPrice || requestedPrice <= 0) {
      throw new Error("Valid limit price is required for LIMIT orders");
    }

    // Limit order execution logic:
    // BUY: executes if marketPrice <= limitPrice
    // SELL: executes if marketPrice >= limitPrice
    const canFill =
      (transactionType === "BUY" && marketPrice <= requestedPrice) ||
      (transactionType === "SELL" && marketPrice >= requestedPrice);

    if (canFill) {
      executedPrice = requestedPrice;
      status = "EXECUTED";
    } else {
      status = "PENDING";
    }
  } else {
    // MARKET order fills with minor realistic micro-slippage (±0.02%)
    const slippageFactor = 1 + (Math.random() * 0.0004 - 0.0002);
    executedPrice = Number((marketPrice * slippageFactor).toFixed(2));
    status = "EXECUTED";
  }

  // Calculate regulatory statutory charges
  const charges = calculateBrokerageCharges(
    transactionType,
    productType,
    status === "EXECUTED" ? executedPrice : requestedPrice || marketPrice,
    quantity,
  );

  // If order is executing immediately:
  if (status === "EXECUTED") {
    if (transactionType === "BUY") {
      const requiredCash = Number(
        (quantity * executedPrice + charges.totalCharges).toFixed(2),
      );
      if (wallet.cashBalance < requiredCash) {
        throw new Error(
          `Insufficient virtual cash. Required: ₹${requiredCash.toLocaleString("en-IN")}, Available: ₹${wallet.cashBalance.toLocaleString("en-IN")}`,
        );
      }

      // Deduct cash from wallet
      wallet.cashBalance = Number(
        (wallet.cashBalance - requiredCash).toFixed(2),
      );
      await wallet.save();

      // Upsert position
      const existingPos = await PaperPosition.findOne({
        userId,
        symbol,
        productType,
      });
      if (existingPos) {
        const totalOldCost = existingPos.quantity * existingPos.averageBuyPrice;
        const totalNewCost = quantity * executedPrice;
        const newTotalQty = existingPos.quantity + quantity;
        existingPos.averageBuyPrice = Number(
          ((totalOldCost + totalNewCost) / newTotalQty).toFixed(2),
        );
        existingPos.quantity = newTotalQty;
        await existingPos.save();
      } else {
        await PaperPosition.create({
          userId,
          symbol,
          yahooSymbol: toYahooSymbol(symbol),
          companyName,
          quantity,
          averageBuyPrice: executedPrice,
          productType,
        });
      }
    } else if (transactionType === "SELL") {
      // Check existing holding
      const existingPos = await PaperPosition.findOne({
        userId,
        symbol,
        productType,
      });
      if (!existingPos || existingPos.quantity < quantity) {
        const available = existingPos ? existingPos.quantity : 0;
        throw new Error(
          `Insufficient shares to sell. Available: ${available}, Requested: ${quantity}`,
        );
      }

      const grossProceeds = quantity * executedPrice;
      const netProceeds = Number(
        (grossProceeds - charges.totalCharges).toFixed(2),
      );

      // Realized profit calculation
      const costBasis = quantity * existingPos.averageBuyPrice;
      const realizedPnL = Number(
        (grossProceeds - costBasis - charges.totalCharges).toFixed(2),
      );

      // Credit wallet
      wallet.cashBalance = Number(
        (wallet.cashBalance + netProceeds).toFixed(2),
      );
      wallet.realizedPnL = Number(
        (wallet.realizedPnL + realizedPnL).toFixed(2),
      );
      wallet.totalTrades += 1;
      if (realizedPnL > 0) wallet.winningTrades += 1;
      else if (realizedPnL < 0) wallet.losingTrades += 1;
      await wallet.save();

      // Update position
      if (existingPos.quantity === quantity) {
        await PaperPosition.deleteOne({ _id: existingPos._id });
      } else {
        existingPos.quantity -= quantity;
        await existingPos.save();
      }

      // Record realized PnL on order
      payload.realizedPnL = realizedPnL;
    }
  }

  // Create order log
  const order = await PaperOrder.create({
    userId,
    orderId,
    symbol,
    companyName,
    transactionType,
    orderType,
    productType,
    quantity,
    requestedPrice,
    executedPrice,
    status,
    charges,
    realizedPnL: payload.realizedPnL ?? null,
    executedAt: status === "EXECUTED" ? new Date() : null,
  });

  return {
    success: true,
    order,
    status,
    message:
      status === "EXECUTED"
        ? `Order ${orderId} filled at ₹${executedPrice}`
        : `Limit order ${orderId} placed (Pending execution)`,
  };
}

/**
 * Cancel a pending limit order
 */
export async function cancelPaperOrder(userId, orderId) {
  let order = await PaperOrder.findOne({ userId, orderId, status: "PENDING" });
  if (!order && /^[a-f\d]{24}$/i.test(orderId)) {
    order = await PaperOrder.findOne({
      userId,
      _id: orderId,
      status: "PENDING",
    });
  }
  if (!order) {
    throw new Error("Order not found or cannot be cancelled");
  }

  order.status = "CANCELLED";
  await order.save();

  return { success: true, orderId, status: "CANCELLED" };
}

/**
 * Get paginated order book history
 */
export async function getPaperOrders(
  userId,
  { status, limit = 20, skip = 0 } = {},
) {
  const query = { userId };
  if (status && status !== "ALL") {
    query.status = status;
  }

  const [orders, total] = await Promise.all([
    PaperOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean(),
    PaperOrder.countDocuments(query),
  ]);

  return { orders, total, limit: Number(limit), skip: Number(skip) };
}

/**
 * Reset paper trading sandbox wallet to initial ₹10,00,000 state
 */
export async function resetPaperTradingWallet(userId) {
  const wallet = await getOrCreateWallet(userId);

  wallet.cashBalance = INITIAL_CAPITAL;
  wallet.initialCapital = INITIAL_CAPITAL;
  wallet.realizedPnL = 0;
  wallet.totalTrades = 0;
  wallet.winningTrades = 0;
  wallet.losingTrades = 0;
  wallet.resetCount += 1;
  wallet.lastResetAt = new Date();

  await Promise.all([
    wallet.save(),
    PaperPosition.deleteMany({ userId }),
    PaperOrder.deleteMany({ userId }),
  ]);

  return {
    success: true,
    message: "Paper trading wallet and positions reset to ₹10,00,000.",
    wallet,
  };
}
