import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { IndexData, StockQuote } from '../types';
import { getIndices, getQuotes, getMarketStatusApi } from '../services/api';
import { getMarketStatus as getLocalMarketStatus } from '../lib/utils';

interface MarketContextType {
  indices: IndexData[];
  quotes: StockQuote[];
  lastUpdated: Date;
  marketStatus: { isOpen: boolean; text: string; subtext: string };
  priceChanges: Record<string, 'up' | 'down' | null>; // symbol -> change direction
  isLiveSocket: boolean;
  isStale: boolean;
  loading: boolean;
  refreshData: () => Promise<void>;
  subscribeSymbols: (symbols: string[]) => void;
  unsubscribeSymbols: (symbols: string[]) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [marketStatus, setMarketStatus] = useState(getLocalMarketStatus());
  const [priceChanges, setPriceChanges] = useState<Record<string, 'up' | 'down' | null>>({});
  const [isLiveSocket, setIsLiveSocket] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());
  const quotesRef = useRef<StockQuote[]>([]);
  quotesRef.current = quotes;

  // Load initial data via REST
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [idxData, quotesData, serverStatus] = await Promise.all([
        getIndices(),
        getQuotes(),
        getMarketStatusApi(),
      ]);

      setIndices(idxData);
      setQuotes(quotesData);
      setLastUpdated(new Date());
      setIsStale(false);

      if (serverStatus) {
        setMarketStatus({
          isOpen: serverStatus.isOpen,
          text: serverStatus.isOpen ? 'MARKET OPEN' : 'MARKET CLOSED',
          subtext: serverStatus.isOpen ? 'NSE/BSE Live' : 'Opens 09:15 AM IST',
        });
      }
    } catch (e) {
      console.error('Failed to load initial market data', e);
      setIsStale(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Subscribe / Unsubscribe helpers
  const subscribeSymbols = useCallback((symbols: string[]) => {
    if (!Array.isArray(symbols) || symbols.length === 0) return;
    symbols.forEach((s) => subscribedSymbolsRef.current.add(s));

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('subscribe', Array.from(subscribedSymbolsRef.current));
    }
  }, []);

  const unsubscribeSymbols = useCallback((symbols: string[]) => {
    if (!Array.isArray(symbols) || symbols.length === 0) return;
    symbols.forEach((s) => subscribedSymbolsRef.current.delete(s));

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('unsubscribe', symbols);
    }
  }, []);

  // Real Socket.io Live Push Integration
  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = io({
        path: '/socket.io',
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setIsLiveSocket(true);
        setIsStale(false);
        // Subscribe to initial default symbols
        const defaultSymbols = quotesRef.current.map((q) => q.symbol);
        defaultSymbols.forEach((s) => subscribedSymbolsRef.current.add(s));
        socket?.emit('subscribe', Array.from(subscribedSymbolsRef.current));
      });

      socket.on('disconnect', () => {
        setIsLiveSocket(false);
      });

      socket.on('quotes', (updatedQuotes: StockQuote[]) => {
        if (!Array.isArray(updatedQuotes) || updatedQuotes.length === 0) return;

        setLastUpdated(new Date());
        setIsStale(false);

        setQuotes((prev) => {
          const map = new Map(prev.map((q) => [q.symbol, q]));
          const newChanges: Record<string, 'up' | 'down' | null> = {};

          updatedQuotes.forEach((newQ) => {
            const oldQ = map.get(newQ.symbol);
            if (oldQ) {
              const diff = newQ.price - oldQ.price;
              if (Math.abs(diff) > 0.01) {
                newChanges[newQ.symbol] = diff > 0 ? 'up' : 'down';
              }
            }
            map.set(newQ.symbol, { ...(oldQ || {}), ...newQ });
          });

          if (Object.keys(newChanges).length > 0) {
            setPriceChanges(newChanges);
            setTimeout(() => setPriceChanges({}), 1800);
          }

          return Array.from(map.values());
        });
      });
    } catch (err) {
      console.warn('Socket connection error:', err);
      setIsLiveSocket(false);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Fallback REST polling (every 15s if socket is disconnected)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isLiveSocket) {
        try {
          const [idxData, quotesData, status] = await Promise.all([
            getIndices(),
            getQuotes(),
            getMarketStatusApi(),
          ]);
          setIndices(idxData);
          setQuotes(quotesData);
          setLastUpdated(new Date());
          if (status) {
            setMarketStatus({
              isOpen: status.isOpen,
              text: status.isOpen ? 'MARKET OPEN' : 'MARKET CLOSED',
              subtext: status.isOpen ? 'NSE/BSE Live' : 'Opens 09:15 AM IST',
            });
          }
        } catch {
          setIsStale(true);
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isLiveSocket]);

  return (
    <MarketContext.Provider
      value={{
        indices,
        quotes,
        lastUpdated,
        marketStatus,
        priceChanges,
        isLiveSocket,
        isStale,
        loading,
        refreshData: loadInitialData,
        subscribeSymbols,
        unsubscribeSymbols,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export function useMarket(): MarketContextType {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}
