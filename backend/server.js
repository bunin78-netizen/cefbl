import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";
import express from "express";

dotenv.config({ path: ".env.local" });

const app = express();
const port = Number(process.env.PORT) || 3001;

const BINANCE_TESTNET = process.env.BINANCE_TESTNET === "true";
const BINANCE_BASE_URL = BINANCE_TESTNET ? "https://testnet.binancefuture.com" : "https://fapi.binance.com";

const exchangeRegistry = [
  { id: "binance", name: "Binance Futures", supportsTrading: true },
  { id: "bybit", name: "Bybit", supportsTrading: true },
  { id: "bitget", name: "Bitget", supportsTrading: true },
  { id: "okx", name: "OKX", supportsTrading: true },
];

const takerFeesPercent = {
  binance: 0.04,
  bybit: 0.055,
  bitget: 0.06,
  okx: 0.05,
};

const TOP_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT",
  "DOGEUSDT", "ADAUSDT", "AVAXUSDT", "LINKUSDT", "DOTUSDT",
];

const DEFAULT_SCANNER_PARAMS = {
  symbol: process.env.SCANNER_DEFAULT_SYMBOL || "BTCUSDT",
  notionalUsdt: Number(process.env.SCANNER_DEFAULT_NOTIONAL_USDT || 1000),
  holdHours: Number(process.env.SCANNER_DEFAULT_HOLD_HOURS || 8),
  slippagePercent: Number(process.env.SCANNER_DEFAULT_SLIPPAGE_PERCENT || 0.04),
};

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function keyStatus() {
  return {
    binance: {
      apiKey: hasValue(process.env.BINANCE_API_KEY),
      apiSecret: hasValue(process.env.BINANCE_API_SECRET),
    },
    bybit: {
      apiKey: hasValue(process.env.BYBIT_API_KEY),
      apiSecret: hasValue(process.env.BYBIT_API_SECRET),
    },
    bitget: {
      apiKey: hasValue(process.env.BITGET_API_KEY),
      apiSecret: hasValue(process.env.BITGET_API_SECRET),
      passphrase: hasValue(process.env.BITGET_PASSPHRASE),
    },
    okx: {
      apiKey: hasValue(process.env.OKX_API_KEY),
      apiSecret: hasValue(process.env.OKX_API_SECRET),
      passphrase: hasValue(process.env.OKX_PASSPHRASE),
    },
  };
}

app.use(cors());
app.use(express.json());

function signHex(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function signBase64(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64");
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

function getBinanceCredentials() {
  const apiKey = process.env.BINANCE_API_KEY?.trim();
  const apiSecret = process.env.BINANCE_API_SECRET?.trim();

  if (!apiKey || !apiSecret) {
    throw new Error("BINANCE_API_KEY/BINANCE_API_SECRET не заданы");
  }

  return { apiKey, apiSecret };
}

function getBybitCredentials() {
  const apiKey = process.env.BYBIT_API_KEY?.trim();
  const apiSecret = process.env.BYBIT_API_SECRET?.trim();

  if (!apiKey || !apiSecret) {
    throw new Error("BYBIT_API_KEY/BYBIT_API_SECRET не заданы");
  }

  return { apiKey, apiSecret };
}

function getBitgetCredentials() {
  const apiKey = process.env.BITGET_API_KEY?.trim();
  const apiSecret = process.env.BITGET_API_SECRET?.trim();
  const passphrase = process.env.BITGET_PASSPHRASE?.trim();

  if (!apiKey || !apiSecret || !passphrase) {
    throw new Error("BITGET_API_KEY/BITGET_API_SECRET/BITGET_PASSPHRASE не заданы");
  }

  return { apiKey, apiSecret, passphrase };
}

function getOkxCredentials() {
  const apiKey = process.env.OKX_API_KEY?.trim();
  const apiSecret = process.env.OKX_API_SECRET?.trim();
  const passphrase = process.env.OKX_PASSPHRASE?.trim();

  if (!apiKey || !apiSecret || !passphrase) {
    throw new Error("OKX_API_KEY/OKX_API_SECRET/OKX_PASSPHRASE не заданы");
  }

  return { apiKey, apiSecret, passphrase };
}

async function binancePublic(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${BINANCE_BASE_URL}${path}${query ? `?${query}` : ""}`;
  return fetchJson(url);
}

async function binanceSigned(path, params = {}, method = "GET") {
  const { apiKey, apiSecret } = getBinanceCredentials();
  const fullParams = {
    ...params,
    recvWindow: "5000",
    timestamp: Date.now().toString(),
  };

  const query = new URLSearchParams(fullParams).toString();
  const signature = signHex(query, apiSecret);
  const url = `${BINANCE_BASE_URL}${path}?${query}&signature=${signature}`;

  return fetchJson(url, {
    method,
    headers: {
      "X-MBX-APIKEY": apiKey,
      "Content-Type": "application/json",
    },
  });
}

async function createBybitOrder({ symbol, side, quantity, type }) {
  const { apiKey, apiSecret } = getBybitCredentials();
  const timestamp = Date.now().toString();
  const recvWindow = "5000";
  const path = "/v5/order/create";
  const body = JSON.stringify({
    category: "linear",
    symbol,
    side,
    orderType: type,
    qty: String(quantity),
    timeInForce: "IOC",
  });

  const payload = `${timestamp}${apiKey}${recvWindow}${body}`;
  const sign = signHex(payload, apiSecret);

  return fetchJson(`https://api.bybit.com${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-BAPI-API-KEY": apiKey,
      "X-BAPI-TIMESTAMP": timestamp,
      "X-BAPI-RECV-WINDOW": recvWindow,
      "X-BAPI-SIGN": sign,
    },
    body,
  });
}

async function createBitgetOrder({ symbol, side, quantity, type }) {
  const { apiKey, apiSecret, passphrase } = getBitgetCredentials();
  const timestamp = Date.now().toString();
  const path = "/api/v2/mix/order/place-order";
  const bodyObj = {
    symbol,
    productType: "USDT-FUTURES",
    marginMode: "crossed",
    marginCoin: "USDT",
    side: side === "BUY" ? "buy" : "sell",
    orderType: type.toLowerCase(),
    size: String(quantity),
    force: "ioc",
  };
  const body = JSON.stringify(bodyObj);
  const preHash = `${timestamp}POST${path}${body}`;
  const sign = signBase64(preHash, apiSecret);

  return fetchJson(`https://api.bitget.com${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ACCESS-KEY": apiKey,
      "ACCESS-SIGN": sign,
      "ACCESS-TIMESTAMP": timestamp,
      "ACCESS-PASSPHRASE": passphrase,
    },
    body,
  });
}

async function createOkxOrder({ symbol, side, quantity, type }) {
  const { apiKey, apiSecret, passphrase } = getOkxCredentials();
  const timestamp = new Date().toISOString();
  const path = "/api/v5/trade/order";
  const instId = `${symbol.replace("USDT", "-USDT")}-SWAP`;
  const bodyObj = {
    instId,
    tdMode: "cross",
    side: side === "BUY" ? "buy" : "sell",
    ordType: type.toLowerCase(),
    sz: String(quantity),
  };
  const body = JSON.stringify(bodyObj);
  const preHash = `${timestamp}POST${path}${body}`;
  const sign = signBase64(preHash, apiSecret);

  return fetchJson(`https://www.okx.com${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "OK-ACCESS-KEY": apiKey,
      "OK-ACCESS-SIGN": sign,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": passphrase,
    },
    body,
  });
}

async function createExchangeOrder(exchange, { symbol, side, quantity, type }) {
  if (exchange === "binance") {
    const order = await binanceSigned(
      "/fapi/v1/order",
      {
        symbol,
        side,
        type,
        quantity: String(quantity),
      },
      "POST",
    );
    return { exchange, order };
  }

  if (exchange === "bybit") {
    const order = await createBybitOrder({ symbol, side, quantity, type });
    return { exchange, order };
  }

  if (exchange === "bitget") {
    const order = await createBitgetOrder({ symbol, side, quantity, type });
    return { exchange, order };
  }

  if (exchange === "okx") {
    const order = await createOkxOrder({ symbol, side, quantity, type });
    return { exchange, order };
  }

  throw new Error(`Неподдерживаемая биржа для ордера: ${exchange}`);
}

async function getMarketSummary(exchange, symbol) {
  if (exchange === "binance") {
    const [ticker24, premiumIndex] = await Promise.all([
      binancePublic("/fapi/v1/ticker/24hr", { symbol }),
      binancePublic("/fapi/v1/premiumIndex", { symbol }),
    ]);

    return {
      exchange,
      symbol,
      priceChangePercent: Number(ticker24.priceChangePercent),
      volume: Number(ticker24.volume),
      quoteVolume: Number(ticker24.quoteVolume),
      markPrice: Number(premiumIndex.markPrice),
      indexPrice: Number(premiumIndex.indexPrice),
      lastFundingRate: Number(premiumIndex.lastFundingRate),
      nextFundingTime: Number(premiumIndex.nextFundingTime || 0),
      exchangeTime: Date.now(),
    };
  }

  if (exchange === "bybit") {
    const [tickerRes, fundingRes] = await Promise.all([
      fetchJson(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}`),
      fetchJson(`https://api.bybit.com/v5/market/funding/history?category=linear&symbol=${symbol}&limit=1`),
    ]);

    const ticker = tickerRes?.result?.list?.[0];
    const funding = fundingRes?.result?.list?.[0];

    return {
      exchange,
      symbol,
      priceChangePercent: Number(ticker?.price24hPcnt || 0) * 100,
      volume: Number(ticker?.volume24h || 0),
      quoteVolume: Number(ticker?.turnover24h || 0),
      markPrice: Number(ticker?.markPrice || 0),
      indexPrice: Number(ticker?.indexPrice || 0),
      lastFundingRate: Number(funding?.fundingRate || 0),
      nextFundingTime: Number(ticker?.nextFundingTime || 0),
      exchangeTime: Date.now(),
    };
  }

  if (exchange === "bitget") {
    const [tickerRes, fundingRes] = await Promise.all([
      fetchJson(`https://api.bitget.com/api/v2/mix/market/ticker?productType=USDT-FUTURES&symbol=${symbol}`),
      fetchJson(`https://api.bitget.com/api/v2/mix/market/current-fund-rate?productType=USDT-FUTURES&symbol=${symbol}`),
    ]);

    const ticker = tickerRes?.data?.[0] || tickerRes?.data;
    const funding = fundingRes?.data?.[0] || fundingRes?.data;

    return {
      exchange,
      symbol,
      priceChangePercent: Number(ticker?.chgUtc || ticker?.changeUtc24h || 0) * 100,
      volume: Number(ticker?.baseVolume || 0),
      quoteVolume: Number(ticker?.quoteVolume || 0),
      markPrice: Number(ticker?.markPrice || ticker?.lastPr || 0),
      indexPrice: Number(ticker?.indexPrice || ticker?.lastPr || 0),
      lastFundingRate: Number(funding?.fundingRate || 0),
      nextFundingTime: Number(funding?.nextSettleTime || 0),
      exchangeTime: Date.now(),
    };
  }

  if (exchange === "okx") {
    const instId = `${symbol.replace("USDT", "-USDT")}-SWAP`;
    const [tickerRes, fundingRes] = await Promise.all([
      fetchJson(`https://www.okx.com/api/v5/market/ticker?instId=${instId}`),
      fetchJson(`https://www.okx.com/api/v5/public/funding-rate?instId=${instId}`),
    ]);

    const ticker = tickerRes?.data?.[0];
    const funding = fundingRes?.data?.[0];

    return {
      exchange,
      symbol,
      priceChangePercent: Number(ticker?.chg24h || 0) * 100,
      volume: Number(ticker?.vol24h || 0),
      quoteVolume: Number(ticker?.volCcy24h || 0),
      markPrice: Number(ticker?.last || 0),
      indexPrice: Number(ticker?.last || 0),
      lastFundingRate: Number(funding?.fundingRate || 0),
      nextFundingTime: Number(funding?.nextFundingTime || 0),
      exchangeTime: Date.now(),
    };
  }

  throw new Error(`Неподдерживаемая биржа: ${exchange}`);
}

function buildScannerOpportunities(summaries, notionalUsdt, holdHours, slippagePercent) {
  const opportunities = [];
  const fundingCycles = holdHours / 8;

  for (let i = 0; i < summaries.length; i += 1) {
    for (let j = i + 1; j < summaries.length; j += 1) {
      const a = summaries[i];
      const b = summaries[j];

      const higher = a.lastFundingRate >= b.lastFundingRate ? a : b;
      const lower = a.lastFundingRate >= b.lastFundingRate ? b : a;

      const longFundingRate = lower.lastFundingRate;
      const shortFundingRate = higher.lastFundingRate;
      const fundingDiffPercent = Math.abs((shortFundingRate - longFundingRate) * 100);

      // Точный funding PnL для нейтральной пары:
      // long-leg funding = -notional * rate_long * cycles
      // short-leg funding = +notional * rate_short * cycles
      const longFundingPnlUsdt = -notionalUsdt * longFundingRate * fundingCycles;
      const shortFundingPnlUsdt = notionalUsdt * shortFundingRate * fundingCycles;
      const grossFundingPnlUsdt = longFundingPnlUsdt + shortFundingPnlUsdt;

      // Комиссии считаются за вход и выход по обеим ногам.
      const longTakerFeePercent = takerFeesPercent[lower.exchange] || 0.05;
      const shortTakerFeePercent = takerFeesPercent[higher.exchange] || 0.05;
      const roundTripFeesPercent = 2 * (longTakerFeePercent + shortTakerFeePercent);

      // Slippage параметр считается как суммарный процент издержек на round-trip.
      const totalCostPercent = roundTripFeesPercent + slippagePercent;
      const estimatedCostsUsdt = (notionalUsdt * totalCostPercent) / 100;
      const estimatedNetPnlUsdt = grossFundingPnlUsdt - estimatedCostsUsdt;

      if (estimatedNetPnlUsdt <= 0) {
        continue;
      }

      opportunities.push({
        longExchange: lower.exchange,
        shortExchange: higher.exchange,
        symbol: higher.symbol,
        holdHours,
        fundingCycles,
        longFundingRate,
        shortFundingRate,
        fundingDiffPercent,
        longFundingPnlUsdt,
        shortFundingPnlUsdt,
        grossFundingPnlUsdt,
        roundTripFeesPercent,
        estimatedCostsUsdt,
        estimatedNetPnlUsdt,
      });
    }
  }

  return opportunities.sort((x, y) => y.estimatedNetPnlUsdt - x.estimatedNetPnlUsdt);
}

app.get("/api/status", (_req, res) => {
  res.json({
    ok: true,
    service: "fundingarb-backend",
    timestamp: new Date().toISOString(),
    binanceMode: BINANCE_TESTNET ? "testnet" : "mainnet",
    configuredKeys: keyStatus(),
  });
});

app.get("/api/config", (_req, res) => {
  res.json({
    defaults: { scanner: DEFAULT_SCANNER_PARAMS },
    configuredKeys: keyStatus(),
  });
});

app.get("/api/exchanges", (_req, res) => {
  res.json({ exchanges: exchangeRegistry });
});

app.post("/api/exchanges", (req, res) => {
  const { id, name } = req.body || {};
  const normalizedId = String(id || "").trim().toLowerCase();
  const normalizedName = String(name || "").trim();

  if (!normalizedId || !normalizedName) {
    return res.status(400).json({ error: "id и name обязательны" });
  }

  if (exchangeRegistry.some((item) => item.id === normalizedId)) {
    return res.status(400).json({ error: "Биржа с таким id уже существует" });
  }

  exchangeRegistry.push({ id: normalizedId, name: normalizedName, supportsTrading: false });
  return res.status(201).json({ ok: true });
});

app.get("/api/market/summary", async (req, res) => {
  const symbol = String(req.query.symbol || "BTCUSDT").toUpperCase();
  const exchange = String(req.query.exchange || "binance").toLowerCase();

  try {
    const summary = await getMarketSummary(exchange, symbol);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/scanner/opportunities", async (req, res) => {
  const symbol = String(req.query.symbol || DEFAULT_SCANNER_PARAMS.symbol).toUpperCase();
  const notionalUsdt = Number(req.query.notionalUsdt || DEFAULT_SCANNER_PARAMS.notionalUsdt);
  const holdHours = Number(req.query.holdHours || DEFAULT_SCANNER_PARAMS.holdHours);
  const slippagePercent = Number(req.query.slippagePercent || DEFAULT_SCANNER_PARAMS.slippagePercent);

  const enabledExchanges = exchangeRegistry.filter((item) => ["binance", "bybit", "bitget", "okx"].includes(item.id));

  const settled = await Promise.allSettled(enabledExchanges.map((item) => getMarketSummary(item.id, symbol)));
  const summaries = settled
    .filter((item) => item.status === "fulfilled")
    .map((item) => item.value);

  const errors = settled
    .map((item, index) => ({ item, exchange: enabledExchanges[index].id }))
    .filter((x) => x.item.status === "rejected")
    .map((x) => ({ exchange: x.exchange, error: String(x.item.reason?.message || x.item.reason || "unknown") }));

  if (summaries.length < 2) {
    return res.status(500).json({
      error: "Недостаточно биржевых данных для построения арбитражных возможностей",
      errors,
    });
  }

  const opportunities = buildScannerOpportunities(summaries, notionalUsdt, holdHours, slippagePercent);

  return res.json({
    symbol,
    notionalUsdt,
    holdHours,
    slippagePercent,
    usedExchanges: summaries.map((item) => item.exchange),
    skippedExchanges: errors,
    opportunities,
  });
});

app.get("/api/account/positions", async (_req, res) => {
  try {
    const positions = await binanceSigned("/fapi/v2/positionRisk");
    const activePositions = positions
      .filter((position) => Number(position.positionAmt) !== 0)
      .map((position) => ({
        symbol: position.symbol,
        side: Number(position.positionAmt) > 0 ? "LONG" : "SHORT",
        positionAmt: Number(position.positionAmt),
        entryPrice: Number(position.entryPrice),
        markPrice: Number(position.markPrice),
        unrealizedProfit: Number(position.unRealizedProfit),
        leverage: Number(position.leverage),
      }));

    res.json({ count: activePositions.length, positions: activePositions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/trade/order", async (req, res) => {
  const {
    exchange = "binance",
    symbol,
    side,
    type = "MARKET",
    quantity,
  } = req.body || {};

  if (!symbol || !side || !quantity) {
    return res.status(400).json({ error: "exchange, symbol, side и quantity обязательны" });
  }

  try {
    const payload = {
      symbol: String(symbol).toUpperCase(),
      side: String(side).toUpperCase(),
      type: String(type).toUpperCase(),
      quantity: Number(quantity),
    };

    const result = await createExchangeOrder(String(exchange).toLowerCase(), payload);
    res.json({
      live: true,
      exchange: result.exchange,
      mode: BINANCE_TESTNET ? "testnet" : "mainnet",
      order: result.order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/scanner/best-funding", async (req, res) => {
  const notionalUsdt = Number(req.query.notionalUsdt || DEFAULT_SCANNER_PARAMS.notionalUsdt);
  const holdHours = Number(req.query.holdHours || DEFAULT_SCANNER_PARAMS.holdHours);
  const slippagePercent = Number(req.query.slippagePercent || DEFAULT_SCANNER_PARAMS.slippagePercent);
  const topN = Math.min(Number(req.query.topN || 10), 30);

  const enabledExchanges = exchangeRegistry.filter((item) => ["binance", "bybit", "bitget", "okx"].includes(item.id));

  const symbolResults = await Promise.allSettled(
    TOP_SYMBOLS.map(async (symbol) => {
      const settled = await Promise.allSettled(enabledExchanges.map((item) => getMarketSummary(item.id, symbol)));
      const summaries = settled.filter((r) => r.status === "fulfilled").map((r) => r.value);
      if (summaries.length < 2) return [];
      return buildScannerOpportunities(summaries, notionalUsdt, holdHours, slippagePercent);
    }),
  );

  const allOpportunities = symbolResults
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  allOpportunities.sort((a, b) => b.estimatedNetPnlUsdt - a.estimatedNetPnlUsdt);

  return res.json({
    scannedSymbols: TOP_SYMBOLS.length,
    notionalUsdt,
    holdHours,
    slippagePercent,
    opportunities: allOpportunities.slice(0, topN),
  });
});

app.listen(port, () => {
  console.log(`FundingArb backend started on http://localhost:${port}`);
  console.log(`Binance mode: ${BINANCE_TESTNET ? "TESTNET" : "MAINNET"}`);
});
