import { z } from "zod";
import * as marketService from "../services/marketService.js";
import * as signalService from "../services/signalService.js";
import { getMarketStatus } from "../utils/marketHours.js";

const SYMBOL_REGEX = /^[A-Z0-9&.\-^]{1,20}$/;

export const quotesQuerySchema = z.object({
  symbols: z.string().max(1000).optional(),
});

export const historyQuerySchema = z.object({
  range: z
    .enum([
      "1D",
      "1W",
      "1M",
      "1Y",
      "5Y",
      "1d",
      "1w",
      "1m",
      "1y",
      "5y",
      "1MO",
      "1mo",
    ])
    .optional()
    .default("1M"),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").max(50),
});

export async function getMarketStatusController(req, res) {
  const status = getMarketStatus();
  return res.status(200).json({
    success: true,
    data: status,
    lastUpdated: new Date().toISOString(),
  });
}

export async function getIndicesController(req, res, next) {
  try {
    const result = await marketService.getIndices();
    return res.status(200).json({
      success: true,
      data: result.data,
      stale: result.stale,
      delayed: result.delayed,
      lastUpdated: result.lastUpdated,
    });
  } catch (error) {
    next(error);
  }
}

export async function getQuotesController(req, res, next) {
  try {
    const rawSymbols = req.query.symbols
      ? req.query.symbols
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter((s) => SYMBOL_REGEX.test(s))
          .slice(0, 50)
      : [];

    const result = await marketService.getQuotes(rawSymbols);
    return res.status(200).json({
      success: true,
      data: result.data,
      stale: result.stale,
      delayed: result.delayed,
      lastUpdated: result.lastUpdated,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSingleQuoteController(req, res, next) {
  try {
    const symbol = (req.params.symbol || "").toUpperCase().trim();
    if (!SYMBOL_REGEX.test(symbol)) {
      return res.status(400).json({
        success: false,
        message: "Invalid symbol format",
      });
    }

    const result = await marketService.getQuotes([symbol]);
    const quote = result.data?.[0] || null;

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: `Quote not found for symbol: ${symbol}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: quote,
      stale: result.stale,
      delayed: result.delayed,
      lastUpdated: result.lastUpdated,
    });
  } catch (error) {
    next(error);
  }
}

export async function getHistoryController(req, res, next) {
  try {
    const symbol = (req.params.symbol || "").toUpperCase().trim();
    if (!SYMBOL_REGEX.test(symbol)) {
      return res.status(400).json({
        success: false,
        message: "Invalid symbol format",
      });
    }

    const rawRange = (req.query.range || req.query.interval || "1M")
      .toString()
      .trim()
      .toUpperCase();
    const normalizedRange =
      rawRange === "1MO" || rawRange === "1MONTH" ? "1M" : rawRange;
    const validRanges = ["1D", "1W", "1M", "1Y", "5Y"];
    const sanitizedRange = validRanges.includes(normalizedRange)
      ? normalizedRange
      : "1M";

    const result = await marketService.getHistory(symbol, sanitizedRange);
    return res.status(200).json({
      success: true,
      data: result.data,
      symbol: result.symbol,
      range: result.range,
      stale: result.stale,
      delayed: result.delayed,
      lastUpdated: result.lastUpdated,
    });
  } catch (error) {
    next(error);
  }
}

export async function searchSymbolsController(req, res, next) {
  try {
    const query = (req.query.q || "").slice(0, 50);
    const result = await marketService.searchSymbols(query);
    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSignalController(req, res, next) {
  try {
    const symbol = (req.params.symbol || "").toUpperCase().trim();
    if (!SYMBOL_REGEX.test(symbol)) {
      return res.status(400).json({
        success: false,
        message: "Invalid symbol format",
      });
    }

    const data = await signalService.computeStockSignal(symbol);
    const responseData = {
      ...data,
      quantScore: data?.score ?? data?.quantScore ?? 0,
      score: data?.score ?? data?.quantScore ?? 0,
    };
    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBatchSignalsController(req, res, next) {
  try {
    const symbols = req.query.symbols
      ? req.query.symbols
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter((s) => SYMBOL_REGEX.test(s))
          .slice(0, 50)
      : [];

    const signals = await Promise.allSettled(
      symbols.map((sym) => signalService.computeStockSignal(sym)),
    );

    const data = {};
    signals.forEach((s, idx) => {
      if (s.status === "fulfilled") {
        data[symbols[idx]] = s.value;
      }
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
