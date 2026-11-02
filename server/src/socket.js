import { Server } from "socket.io";
import { ENV } from "./config/env.js";
import * as marketService from "./services/marketService.js";
import { getMarketStatus } from "./utils/marketHours.js";

let io = null;
let pollTimer = null;
const clientSubscriptions = new Map(); // socketId -> Set of symbols

function getAllSubscribedSymbols() {
  const allSymbols = new Set();
  for (const symSet of clientSubscriptions.values()) {
    for (const sym of symSet) {
      allSymbols.add(sym);
    }
  }
  return Array.from(allSymbols);
}

async function fetchAndBroadcastQuotes() {
  const symbols = getAllSubscribedSymbols();
  if (symbols.length === 0) {
    stopPolling();
    return;
  }

  const marketStatus = getMarketStatus();
  if (!marketStatus.isOpen) {
    // If market just closed, emit one last update and stop interval
    const result = await marketService.getQuotes(symbols);
    if (io && result.data?.length > 0) {
      io.emit("quotes", result.data);
    }
    stopPolling();
    return;
  }

  try {
    const result = await marketService.getQuotes(symbols);
    if (io && result.data?.length > 0) {
      io.emit("quotes", result.data);
    }
  } catch (err) {
    console.warn(
      "[Socket.io] Error during periodic quote push:",
      err?.message || err,
    );
  }
}

function startPollingIfNeeded() {
  const marketStatus = getMarketStatus();
  if (!marketStatus.isOpen) {
    return;
  }

  if (!pollTimer) {
    // Fetch quotes every 15 seconds during market hours (matches cache TTL)
    pollTimer = setInterval(fetchAndBroadcastQuotes, 15000);
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ENV.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.on("connection", (socket) => {
    clientSubscriptions.set(socket.id, new Set());

    // Subscribe to symbol quotes
    socket.on("subscribe", async (symbols) => {
      if (!Array.isArray(symbols)) return;
      const validSymbols = symbols
        .map(marketService.sanitizeSymbol)
        .filter(Boolean)
        .slice(0, 50);

      const currentSet = clientSubscriptions.get(socket.id) || new Set();
      validSymbols.forEach((s) => currentSet.add(s));
      clientSubscriptions.set(socket.id, currentSet);

      // Immediately send current quotes to this client on subscribe
      if (validSymbols.length > 0) {
        try {
          const result = await marketService.getQuotes(validSymbols);
          if (result.data?.length > 0) {
            socket.emit("quotes", result.data);
          }
        } catch (err) {
          console.warn(
            "[Socket.io] Initial subscribe quote fetch failed:",
            err?.message || err,
          );
        }
      }

      startPollingIfNeeded();
    });

    // Unsubscribe from symbol quotes
    socket.on("unsubscribe", (symbols) => {
      const currentSet = clientSubscriptions.get(socket.id);
      if (currentSet && Array.isArray(symbols)) {
        symbols.forEach((s) => {
          const clean = marketService.sanitizeSymbol(s);
          currentSet.delete(clean);
        });
      }

      if (getAllSubscribedSymbols().length === 0) {
        stopPolling();
      }
    });

    socket.on("disconnect", () => {
      clientSubscriptions.delete(socket.id);
      if (getAllSubscribedSymbols().length === 0) {
        stopPolling();
      }
    });
  });

  return io;
}

export function getIO() {
  return io;
}
