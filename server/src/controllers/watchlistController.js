import { Watchlist } from "../models/Watchlist.js";

const SYMBOL_REGEX = /^[A-Z0-9&.\-^]{1,20}$/;

export async function getWatchlist(req, res, next) {
  try {
    let wl = await Watchlist.findOne({ userId: req.user.id });
    if (!wl) {
      wl = await Watchlist.create({ userId: req.user.id, items: [] });
    }

    const symbols = wl.items.map((i) => i.symbol);

    return res.status(200).json({
      success: true,
      watchlist: symbols,
      symbols,
      items: wl.items,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleWatchlist(req, res, next) {
  try {
    const symbol = req.params.symbol?.toUpperCase().trim();
    if (!symbol || !SYMBOL_REGEX.test(symbol)) {
      return res.status(400).json({
        success: false,
        message:
          "Valid ticker symbol is required (up to 20 alphanumeric characters)",
      });
    }

    let wl = await Watchlist.findOne({ userId: req.user.id });
    if (!wl) {
      wl = new Watchlist({ userId: req.user.id, items: [] });
    }

    const index = wl.items.findIndex((i) => i.symbol === symbol);
    let inWatchlist = false;

    if (index > -1) {
      wl.items.splice(index, 1);
      inWatchlist = false;
    } else {
      if (wl.items.length >= 50) {
        return res.status(400).json({
          success: false,
          message: "Watchlist limit reached. Maximum 50 items allowed.",
        });
      }
      wl.items.push({ symbol, addedAt: new Date() });
      inWatchlist = true;
    }

    await wl.save();
    const symbols = wl.items.map((i) => i.symbol);

    return res.status(200).json({
      success: true,
      symbol,
      inWatchlist,
      watchlist: symbols,
      symbols,
    });
  } catch (error) {
    next(error);
  }
}
