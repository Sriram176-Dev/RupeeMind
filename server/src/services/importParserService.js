import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { Fund } from '../models/Fund.js';
import { Holding } from '../models/Holding.js';
import { Transaction } from '../models/Transaction.js';
import * as marketService from './marketService.js';

// Month names lookup for date parsing (e.g. 12-Jan-2023, 05/03/2024)
const MONTH_MAP = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parses a date string in DD-MMM-YYYY or DD/MM/YYYY or YYYY-MM-DD format
 */
export function parseFlexibleDate(dateStr) {
  if (!dateStr) return null;
  const str = dateStr.toString().trim();

  // Try ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // Format: DD-MMM-YYYY or DD-MM-YYYY or DD/MM/YYYY
  const parts = str.split(/[\-\/\s\.]+/);
  if (parts.length >= 3) {
    let day = parseInt(parts[0], 10);
    let monthPart = parts[1].toLowerCase();
    let year = parseInt(parts[2], 10);

    // If year is 2 digits
    if (year < 100) year += 2000;

    let month = -1;
    if (MONTH_MAP[monthPart.slice(0, 3)] !== undefined) {
      month = MONTH_MAP[monthPart.slice(0, 3)];
    } else {
      month = parseInt(monthPart, 10) - 1;
    }

    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1990 && year <= 2050) {
      return new Date(Date.UTC(year, month, day));
    }
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Cleans scheme or stock names for fuzzy comparison
 */
export function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/-(?:\s*direct|\s*regular)/gi, '')
    .replace(/\b(plan|growth|idcw|dividend|payout|reinvestment|option|direct|regular|fund|mutual)\b/gi, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Token Jaccard similarity between two strings
 */
export function calculateTokenSimilarity(s1, s2) {
  const tokens1 = new Set(normalizeName(s1).split(' ').filter((t) => t.length > 2));
  const tokens2 = new Set(normalizeName(s2).split(' ').filter((t) => t.length > 2));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) intersection++;
  }

  const union = new Set([...tokens1, ...tokens2]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Matches a raw scheme or stock name to the Fund collection or known universe
 */
export async function matchSchemeToCatalog(rawName, allFunds = null) {
  if (!rawName) {
    return { matched: false, schemeCode: '', matchedFundName: '', confidence: 0, candidates: [] };
  }

  const funds = allFunds || (await Fund.find({}, 'name code schemeCode category fundHouse nav').lean());

  const cleanRaw = normalizeName(rawName);

  let bestMatch = null;
  let highestScore = 0;
  const scoredCandidates = [];

  for (const fund of funds) {
    const cleanFundName = normalizeName(fund.name);

    let score = calculateTokenSimilarity(cleanRaw, cleanFundName);

    // Bonus if AMC / fundHouse matches
    if (fund.fundHouse && cleanRaw.includes(fund.fundHouse.toLowerCase())) {
      score = Math.min(1.0, score + 0.15);
    }

    // Exact substring containment bonus
    if (cleanFundName && (cleanRaw.includes(cleanFundName) || cleanFundName.includes(cleanRaw))) {
      score = Math.max(score, 0.85);
    }

    if (score > 0.3) {
      scoredCandidates.push({
        score,
        fundCode: fund.code || fund.schemeCode,
        schemeCode: fund.schemeCode || fund.code,
        name: fund.name,
        category: fund.category || 'Mutual Fund',
      });
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = fund;
    }
  }

  scoredCandidates.sort((a, b) => b.score - a.score);
  const candidates = scoredCandidates.slice(0, 3);

  if (highestScore >= 0.70 && bestMatch) {
    return {
      matched: true,
      schemeCode: bestMatch.code || bestMatch.schemeCode,
      matchedFundName: bestMatch.name,
      confidence: Number(highestScore.toFixed(2)),
      candidates,
    };
  }

  return {
    matched: false,
    schemeCode: '',
    matchedFundName: '',
    confidence: Number(highestScore.toFixed(2)),
    candidates,
  };
}

/**
 * Parses CAMS / KFintech Consolidated Account Statement (CAS) PDF in memory
 */
export async function parseCASPdf(buffer, password = '') {
  let doc;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      password: password ? String(password).trim() : undefined,
      useSystemFonts: true,
      disableFontFace: true,
    });
    doc = await loadingTask.promise;
  } catch (err) {
    if (err && (err.name === 'PasswordException' || err.code === 1 || err.code === 2)) {
      if (!password) {
        throw new Error('PASSWORD_REQUIRED: This CAS PDF is password-protected. Please enter the password (typically your PAN in uppercase or Date of Birth).');
      } else {
        throw new Error('INVALID_PASSWORD: The password entered is incorrect for this CAS PDF.');
      }
    }
    throw new Error(`Failed to read PDF document: ${err?.message || err}`);
  }

  const allLines = [];

  // Extract text from all pages
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items = content.items || [];

    // Group items by vertical position (Y) to reconstruct lines
    const lineMap = new Map();
    for (const item of items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push({ x: item.transform[4], str: item.str });
    }

    // Sort lines from top to bottom
    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
    for (const y of sortedY) {
      const lineItems = lineMap.get(y).sort((a, b) => a.x - b.x);
      const lineText = lineItems.map((it) => it.str).join(' ').trim();
      if (lineText) allLines.push(lineText);
    }
  }

  if (allLines.length === 0) {
    throw new Error('No readable text found in the PDF. The file may be a scanned image or empty.');
  }

  const allFunds = await Fund.find({}, 'name code schemeCode category fundHouse nav').lean();

  const transactions = [];
  let currentFolio = '';
  let currentSchemeName = '';
  let detectedType = 'CAS_CAMS';

  // Check if KFintech
  if (allLines.some((l) => /KFintech|Karvy/i.test(l))) {
    detectedType = 'CAS_KFINTECH';
  }

  // Regex patterns
  const folioRegex = /Folio\s*(?:No\.?|Number)?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)/i;
  // Transaction line pattern: Date (DD-MMM-YYYY or DD/MM/YYYY) followed by transaction details
  const txnDateRegex = /^(\d{1,2}[\-\/\s][A-Za-z]{3}[\-\/\s]\d{2,4}|\d{1,2}[\-\/\s]\d{1,2}[\-\/\s]\d{2,4})/;

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];

    // 1. Detect Folio
    const folioMatch = line.match(folioRegex);
    if (folioMatch && folioMatch[1]) {
      currentFolio = folioMatch[1].trim();
    }

    // 2. Detect Scheme Header (e.g. Parag Parikh, HDFC, Mirae, ICICI, etc. with Direct/Regular Plan/Growth)
    if (
      /(?:Direct|Regular|Growth|IDCW|Equity|Debt|Hybrid|Index|Tax)/i.test(line) &&
      !txnDateRegex.test(line) &&
      !/Total|Summary|Page\s*\d|Statement\s*Period/i.test(line)
    ) {
      // If it looks like a mutual fund scheme name
      if (line.length >= 10 && line.length <= 120 && !line.includes('₹') && !line.includes('INR')) {
        currentSchemeName = line.trim();
      }
    }

    // 3. Detect Transaction Line
    const dateMatch = line.match(txnDateRegex);
    if (dateMatch) {
      const rawDate = dateMatch[1];
      const parsedDate = parseFlexibleDate(rawDate);

      if (parsedDate) {
        // Extract numbers from line: Amount, Units, Price/NAV, Balance
        // Find numbers with optional commas and decimals
        const numbers = (line.match(/(?:₹|INR)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/g) || [])
          .map((n) => parseFloat(n.replace(/[^0-9.]/g, '')))
          .filter((n) => !isNaN(n) && n > 0);

        let type = 'PURCHASE';
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('sip') || lowerLine.includes('systematic')) {
          type = 'SIP';
        } else if (lowerLine.includes('redemption') || lowerLine.includes('switch out')) {
          type = 'REDEMPTION';
        } else if (lowerLine.includes('switch in')) {
          type = 'SWITCH_IN';
        } else if (lowerLine.includes('dividend') || lowerLine.includes('reinvest')) {
          type = 'DIVIDEND_REINVESTMENT';
        } else if (lowerLine.includes('purchase')) {
          type = 'PURCHASE';
        }

        // Standard CAS column sequence: Amount, Units, Price (NAV)
        let amount = 0;
        let units = 0;
        let price = 0;

        if (numbers.length >= 3) {
          amount = numbers[0];
          units = numbers[1];
          price = numbers[2];
        } else if (numbers.length === 2) {
          amount = numbers[0];
          units = numbers[1];
          price = units > 0 ? Number((amount / units).toFixed(4)) : 0;
        } else if (numbers.length === 1) {
          amount = numbers[0];
          units = 1;
          price = amount;
        }

        // If amount and units appear swapped (units > amount and price > 0)
        if (price > 0 && Math.abs(units * price - amount) > amount * 0.1) {
          if (Math.abs(amount * price - units) < units * 0.1) {
            const temp = amount;
            amount = units;
            units = temp;
          }
        }

        if (amount > 0 && units > 0) {
          const matchResult = await matchSchemeToCatalog(currentSchemeName || 'Mutual Fund Scheme', allFunds);

          transactions.push({
            folio: currentFolio,
            schemeName: currentSchemeName || matchResult.matchedFundName || 'Mutual Fund Scheme',
            schemeCode: matchResult.schemeCode,
            type,
            date: parsedDate.toISOString(),
            units: type === 'REDEMPTION' ? -Math.abs(units) : Math.abs(units),
            price: price > 0 ? price : Number((amount / units).toFixed(4)),
            amount: type === 'REDEMPTION' ? Math.abs(amount) : -Math.abs(amount),
            unmatched: !matchResult.matched,
            confidence: matchResult.confidence,
            candidates: matchResult.candidates,
            source: detectedType,
          });
        }
      }
    }
  }

  // If no structured transactions matched by regex, create sample structured preview from identified text
  if (transactions.length === 0) {
    throw new Error('Could not identify recognizable transactions in this statement. Please check that the PDF is an official CAMS or KFintech CAS.');
  }

  return {
    detectedType,
    totalFolios: new Set(transactions.map((t) => t.folio).filter(Boolean)).size,
    totalTransactions: transactions.length,
    matchedCount: transactions.filter((t) => !t.unmatched).length,
    unmatchedCount: transactions.filter((t) => t.unmatched).length,
    transactions,
  };
}

/**
 * Parses a Broker CSV file (Zerodha Coin/Kite, Groww, Upstox, generic tradebook)
 */
export async function parseBrokerCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    throw new Error('CSV text content is empty or invalid.');
  }

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one data row.');
  }

  // Parse header
  const rawHeaders = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

  // Find column indexes
  const colIndex = {
    date: rawHeaders.findIndex((h) => /date|trade_date|order_date|timestamp/i.test(h)),
    symbolOrScheme: rawHeaders.findIndex((h) => /symbol|scheme|instrument|scrip|particulars|name/i.test(h)),
    type: rawHeaders.findIndex((h) => /type|side|action|trade_type|buy_sell/i.test(h)),
    units: rawHeaders.findIndex((h) => /units|quantity|qty|volume/i.test(h)),
    price: rawHeaders.findIndex((h) => /price|nav|rate|avg_price|trade_price/i.test(h)),
    amount: rawHeaders.findIndex((h) => /amount|value|total|net_amount|turnover/i.test(h)),
    folio: rawHeaders.findIndex((h) => /folio/i.test(h)),
  };

  if (colIndex.symbolOrScheme === -1) {
    throw new Error('CSV is missing a Scheme / Symbol column (e.g. Symbol, Scheme Name, Instrument).');
  }

  const allFunds = await Fund.find({}, 'name code schemeCode category fundHouse nav').lean();

  const transactions = [];

  for (let i = 1; i < lines.length; i++) {
    // Parse CSV line taking quotes into account
    const row = [];
    let insideQuote = false;
    let entry = '';

    for (let charIdx = 0; charIdx < lines[i].length; charIdx++) {
      const char = lines[i][charIdx];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());

    const cleanRow = row.map((c) => c.replace(/^["']|["']$/g, '').trim());

    const rawSchemeName = colIndex.symbolOrScheme !== -1 ? cleanRow[colIndex.symbolOrScheme] : '';
    if (!rawSchemeName) continue;

    const rawDate = colIndex.date !== -1 ? cleanRow[colIndex.date] : '';
    const parsedDate = parseFlexibleDate(rawDate) || new Date();

    const rawType = colIndex.type !== -1 ? cleanRow[colIndex.type].toUpperCase() : 'BUY';
    let type = 'PURCHASE';
    if (rawType.includes('SELL') || rawType.includes('REDEMPTION') || rawType === 'S') {
      type = 'REDEMPTION';
    } else if (rawType.includes('SIP')) {
      type = 'SIP';
    }

    const units = colIndex.units !== -1 ? Math.abs(parseFloat(cleanRow[colIndex.units]) || 0) : 0;
    let price = colIndex.price !== -1 ? Math.abs(parseFloat(cleanRow[colIndex.price]) || 0) : 0;
    let amount = colIndex.amount !== -1 ? Math.abs(parseFloat(cleanRow[colIndex.amount]) || 0) : 0;

    if (amount === 0 && units > 0 && price > 0) {
      amount = Number((units * price).toFixed(2));
    }
    if (price === 0 && units > 0 && amount > 0) {
      price = Number((amount / units).toFixed(4));
    }

    if (units <= 0 && amount <= 0) continue;

    const folio = colIndex.folio !== -1 ? cleanRow[colIndex.folio] : '';

    const matchResult = await matchSchemeToCatalog(rawSchemeName, allFunds);

    transactions.push({
      folio,
      schemeName: rawSchemeName,
      schemeCode: matchResult.schemeCode || rawSchemeName.toUpperCase(),
      type,
      date: parsedDate.toISOString(),
      units: type === 'REDEMPTION' ? -units : units,
      price,
      amount: type === 'REDEMPTION' ? amount : -amount,
      unmatched: !matchResult.matched,
      confidence: matchResult.confidence,
      candidates: matchResult.candidates,
      source: 'BROKER_CSV',
    });
  }

  if (transactions.length === 0) {
    throw new Error('No valid trade transactions could be extracted from this CSV file.');
  }

  return {
    detectedType: 'BROKER_CSV',
    totalFolios: new Set(transactions.map((t) => t.folio).filter(Boolean)).size,
    totalTransactions: transactions.length,
    matchedCount: transactions.filter((t) => !t.unmatched).length,
    unmatchedCount: transactions.filter((t) => t.unmatched).length,
    transactions,
  };
}

/**
 * Commits confirmed transactions to DB and builds/updates Holdings
 */
export async function commitTransactionsAndBuildHoldings(userId, transactionItems) {
  if (!Array.isArray(transactionItems) || transactionItems.length === 0) {
    throw new Error('No transactions provided for confirmation.');
  }

  const createdTransactions = [];

  for (const item of transactionItems) {
    const txn = await Transaction.create({
      userId,
      folio: item.folio || '',
      schemeName: item.schemeName,
      schemeCode: (item.schemeCode || '').toUpperCase().trim(),
      type: item.type,
      date: item.date ? new Date(item.date) : new Date(),
      units: Number(item.units),
      price: Number(item.price),
      amount: Number(item.amount),
      source: item.source || 'BROKER_CSV',
      unmatched: Boolean(item.unmatched),
    });
    createdTransactions.push(txn);
  }

  // Aggregate user transactions to build/update Holdings
  const allUserTxns = await Transaction.find({ userId }).sort({ date: 1 });

  // Group by identifier: schemeCode or schemeName
  const grouped = new Map();
  for (const t of allUserTxns) {
    const key = (t.schemeCode || t.schemeName).toUpperCase().trim();
    if (!grouped.has(key)) {
      grouped.set(key, {
        symbolOrCode: key,
        name: t.schemeName,
        folio: t.folio || '',
        transactions: [],
      });
    }
    grouped.get(key).transactions.push(t);
  }

  const allFunds = await Fund.find({}, 'code schemeCode name nav category').lean();
  const fundMap = new Map();
  allFunds.forEach((f) => {
    if (f.code) fundMap.set(f.code.toUpperCase(), f);
    if (f.schemeCode) fundMap.set(f.schemeCode.toUpperCase(), f);
  });

  for (const [key, group] of grouped.entries()) {
    let netUnits = 0;
    let totalInvestedCost = 0;
    let firstBuyDate = null;

    for (const txn of group.transactions) {
      if (txn.units > 0) {
        netUnits += txn.units;
        totalInvestedCost += Math.abs(txn.amount);
        if (!firstBuyDate || new Date(txn.date) < firstBuyDate) {
          firstBuyDate = new Date(txn.date);
        }
      } else if (txn.units < 0) {
        // Redemption reduces units and proportionate cost basis
        const fractionRedeemed = netUnits > 0 ? Math.min(1, Math.abs(txn.units) / netUnits) : 1;
        totalInvestedCost = Math.max(0, totalInvestedCost * (1 - fractionRedeemed));
        netUnits = Math.max(0, netUnits - Math.abs(txn.units));
      }
    }

    if (netUnits > 0.001) {
      const avgBuyPrice = netUnits > 0 ? Number((totalInvestedCost / netUnits).toFixed(4)) : 0;

      // Determine current price
      let currentPrice = avgBuyPrice;
      let categoryOrSector = 'Mutual Fund';
      let isStock = false;

      const matchedFund = fundMap.get(key);
      if (matchedFund && matchedFund.nav) {
        currentPrice = matchedFund.nav;
        categoryOrSector = matchedFund.category || 'Mutual Fund';
      } else {
        // Try stock quote
        try {
          const sym = key.endsWith('.NS') || key.endsWith('.BO') ? key : `${key}.NS`;
          const quote = await marketService.getQuote(sym);
          if (quote && quote.price) {
            currentPrice = quote.price;
            categoryOrSector = quote.sector || 'Stock';
            isStock = true;
          }
        } catch {
          // Keep avgBuyPrice
        }
      }

      // Find or create Holding
      let holding = await Holding.findOne({
        userId,
        symbolOrCode: key,
      });

      if (holding) {
        holding.quantity = Number(netUnits.toFixed(4));
        holding.buyPrice = avgBuyPrice;
        holding.currentPrice = currentPrice;
        holding.folio = group.folio || holding.folio;
        holding.categoryOrSector = categoryOrSector;
        await holding.save();
      } else {
        holding = await Holding.create({
          userId,
          type: isStock ? 'STOCK' : 'MUTUAL_FUND',
          symbolOrCode: key,
          name: group.name,
          quantity: Number(netUnits.toFixed(4)),
          buyPrice: avgBuyPrice,
          currentPrice,
          buyDate: firstBuyDate || new Date(),
          folio: group.folio,
          categoryOrSector,
        });
      }

      // Link transactions to holdingId
      await Transaction.updateMany(
        { userId, _id: { $in: group.transactions.map((t) => t._id) } },
        { holdingId: holding._id }
      );
    }
  }

  return {
    importedCount: createdTransactions.length,
    holdingsCount: grouped.size,
  };
}
