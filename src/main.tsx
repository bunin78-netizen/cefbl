import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

type ExchangeKeys = {
  apiKey: boolean;
  apiSecret: boolean;
  passphrase?: boolean;
};

type ApiStatus = {
  ok: boolean;
  service: string;
  timestamp: string;
  binanceMode: "mainnet" | "testnet";
  configuredKeys?: Record<string, ExchangeKeys>;
};

type ApiConfig = {
  defaults?: {
    scanner?: {
      symbol?: string;
      notionalUsdt?: number;
      holdHours?: number;
      slippagePercent?: number;
    };
  };
  configuredKeys?: Record<string, ExchangeKeys>;
};

type Exchange = {
  id: string;
  name: string;
  supportsTrading: boolean;
};

type MarketSummary = {
  exchange: string;
  symbol: string;
  priceChangePercent: number;
  volume: number;
  quoteVolume: number;
  markPrice: number;
  indexPrice: number;
  lastFundingRate: number;
  nextFundingTime: number;
  exchangeTime: number;
};

type LivePosition = {
  symbol: string;
  side: "LONG" | "SHORT";
  positionAmt: number;
  entryPrice: number;
  markPrice: number;
  unrealizedProfit: number;
  leverage: number;
};

type ScannerOpportunity = {
  longExchange: string;
  shortExchange: string;
  symbol: string;
  fundingCycles?: number;
  longFundingRate?: number;
  shortFundingRate?: number;
  fundingDiffPercent: number;
  longFundingPnlUsdt?: number;
  shortFundingPnlUsdt?: number;
  grossFundingPnlUsdt: number;
  roundTripFeesPercent?: number;
  estimatedCostsUsdt: number;
  estimatedNetPnlUsdt: number;
  holdHours: number;
};

type StrategySettings = {
  minFundingDiffPercent: number;
  minSpreadPercent: number;
  maxEntrySlippagePercent: number;
  minNetEdgePercent: number;
  maxHoldHours: number;
  rebalanceThresholdPercent: number;
  autoHedge: boolean;
  onlyTopLiquidity: boolean;
};

type Tab = "overview" | "scanner" | "settings";

const ui = {
  bg: "#f8fafc",
  panel: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  primary: "#2563eb",
};

const cardStyle: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: "14px",
  background: ui.panel,
  padding: "1rem",
  boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "0.25rem",
  border: `1px solid ${ui.border}`,
  borderRadius: "8px",
  padding: "0.45rem 0.55rem",
};

function money(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)} USDT`;
}

function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = React.useState(false);
  const id = React.useId();
  return (
    <span
      style={{ position: "relative", display: "inline-block", marginLeft: "4px", verticalAlign: "middle" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
      aria-describedby={visible ? id : undefined}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 15, height: 15, borderRadius: "50%", background: "#94a3b8",
          color: "#fff", fontSize: "0.6rem", fontWeight: "bold", cursor: "help",
        }}
      >?</span>
      {visible && (
        <span
          id={id}
          role="tooltip"
          style={{
            position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
            transform: "translateX(-50%)", background: "#1e293b", color: "#f8fafc",
            padding: "6px 10px", borderRadius: 8, fontSize: "0.72rem", lineHeight: 1.45,
            width: "max-content", maxWidth: 240, zIndex: 9999, pointerEvents: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          }}
        >{text}</span>
      )}
    </span>
  );
}

function App() {
  const [tab, setTab] = useState<Tab>("overview");

  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [selectedExchange, setSelectedExchange] = useState("binance");
  const [newExchangeId, setNewExchangeId] = useState("");
  const [newExchangeName, setNewExchangeName] = useState("");
  const [exchangeError, setExchangeError] = useState("");

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [market, setMarket] = useState<MarketSummary | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState("");

  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState("");

  const [orderExchange, setOrderExchange] = useState("binance");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [orderQuantity, setOrderQuantity] = useState("0.001");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<string>("");

  const [scannerNotional, setScannerNotional] = useState(1000);
  const [scannerHoldHours, setScannerHoldHours] = useState(8);
  const [scannerSlippage, setScannerSlippage] = useState(0.04);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scannerRows, setScannerRows] = useState<ScannerOpportunity[]>([]);

  const [bestFundingLoading, setBestFundingLoading] = useState(false);
  const [bestFundingError, setBestFundingError] = useState("");
  const [bestFundingRows, setBestFundingRows] = useState<ScannerOpportunity[]>([]);

  const [executeModal, setExecuteModal] = useState<ScannerOpportunity | null>(null);
  const [executeQty, setExecuteQty] = useState("0.001");
  const [executingTrade, setExecutingTrade] = useState(false);
  const [executeResult, setExecuteResult] = useState<string>("");

  const [strategyMode, setStrategyMode] = useState<"Conservative" | "Balanced" | "Aggressive">("Balanced");
  const [strategy, setStrategy] = useState<StrategySettings>({
    minFundingDiffPercent: 0.03,
    minSpreadPercent: 0.12,
    maxEntrySlippagePercent: 0.04,
    minNetEdgePercent: 0.08,
    maxHoldHours: 8,
    rebalanceThresholdPercent: 0.35,
    autoHedge: true,
    onlyTopLiquidity: true,
  });

  const selectedExchangeMeta = useMemo(() => exchanges.find((item) => item.id === selectedExchange), [exchanges, selectedExchange]);
  const totalUnrealized = useMemo(() => positions.reduce((acc, p) => acc + p.unrealizedProfit, 0), [positions]);
  const positiveScannerRows = useMemo(() => scannerRows.filter((x) => x.estimatedNetPnlUsdt > 0), [scannerRows]);

  const estimatedFundingPercent = useMemo(() => Math.abs((market?.lastFundingRate ?? 0) * 100), [market]);
  const estimatedSpreadPercent = useMemo(() => {
    if (!market || market.indexPrice === 0) return 0;
    return Math.abs(((market.markPrice - market.indexPrice) / market.indexPrice) * 100);
  }, [market]);

  const estimatedEdgePercent = useMemo(() => {
    const takerAndSlip = strategy.maxEntrySlippagePercent + 0.08;
    return estimatedFundingPercent + estimatedSpreadPercent - takerAndSlip;
  }, [estimatedFundingPercent, estimatedSpreadPercent, strategy.maxEntrySlippagePercent]);

  const strategyHints = useMemo(() => {
    const hints: string[] = [];
    if (!market) return ["Загрузите live market data для сигналов стратегии."];

    hints.push(
      estimatedFundingPercent >= strategy.minFundingDiffPercent
        ? `✅ Funding OK (${estimatedFundingPercent.toFixed(4)}% >= ${strategy.minFundingDiffPercent.toFixed(4)}%)`
        : `⚠️ Funding low (${estimatedFundingPercent.toFixed(4)}% < ${strategy.minFundingDiffPercent.toFixed(4)}%)`,
    );

    hints.push(
      estimatedSpreadPercent >= strategy.minSpreadPercent
        ? `✅ Spread OK (${estimatedSpreadPercent.toFixed(4)}%)`
        : `⚠️ Spread below target (${estimatedSpreadPercent.toFixed(4)}%)`,
    );

    hints.push(
      estimatedEdgePercent >= strategy.minNetEdgePercent
        ? `✅ Net-edge positive (${estimatedEdgePercent.toFixed(4)}%)`
        : `⛔ Net-edge too low (${estimatedEdgePercent.toFixed(4)}%)`,
    );

    hints.push(`План: hold ${strategy.maxHoldHours}h, rebalance > ${strategy.rebalanceThresholdPercent}%.`);
    hints.push(strategy.autoHedge ? "Auto-hedge включен." : "Auto-hedge выключен: directional risk выше.");
    return hints;
  }, [estimatedEdgePercent, estimatedFundingPercent, estimatedSpreadPercent, market, strategy]);

  const applyPreset = (mode: "Conservative" | "Balanced" | "Aggressive") => {
    setStrategyMode(mode);
    if (mode === "Conservative") {
      setStrategy({ minFundingDiffPercent: 0.05, minSpreadPercent: 0.18, maxEntrySlippagePercent: 0.03, minNetEdgePercent: 0.12, maxHoldHours: 6, rebalanceThresholdPercent: 0.25, autoHedge: true, onlyTopLiquidity: true });
      return;
    }
    if (mode === "Aggressive") {
      setStrategy({ minFundingDiffPercent: 0.02, minSpreadPercent: 0.08, maxEntrySlippagePercent: 0.06, minNetEdgePercent: 0.04, maxHoldHours: 12, rebalanceThresholdPercent: 0.45, autoHedge: true, onlyTopLiquidity: false });
      return;
    }
    setStrategy({ minFundingDiffPercent: 0.03, minSpreadPercent: 0.12, maxEntrySlippagePercent: 0.04, minNetEdgePercent: 0.08, maxHoldHours: 8, rebalanceThresholdPercent: 0.35, autoHedge: true, onlyTopLiquidity: true });
  };

  const checkApi = async () => {
    setLoadingStatus(true);
    setStatusError("");
    try {
      const response = await fetch("http://localhost:3001/api/status");
      setApiStatus((await response.json()) as ApiStatus);
    } catch {
      setApiStatus(null);
      setStatusError("Не удалось подключиться к backend.");
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/config");
      const data = (await response.json()) as ApiConfig;
      setApiConfig(data);
      const scanner = data.defaults?.scanner;
      if (scanner?.symbol) setSymbol(String(scanner.symbol).toUpperCase());
      if (typeof scanner?.notionalUsdt === "number") setScannerNotional(scanner.notionalUsdt);
      if (typeof scanner?.holdHours === "number") setScannerHoldHours(scanner.holdHours);
      if (typeof scanner?.slippagePercent === "number") setScannerSlippage(scanner.slippagePercent);
    } catch {
      setApiConfig(null);
    }
  };

  const loadExchanges = async () => {
    setExchangeError("");
    try {
      const response = await fetch("http://localhost:3001/api/exchanges");
      const data = await response.json();
      const loaded = Array.isArray(data.exchanges) ? data.exchanges : [];
      setExchanges(loaded);
      if (loaded.length > 0 && !loaded.some((item: Exchange) => item.id === selectedExchange)) setSelectedExchange(loaded[0].id);
      if (loaded.length > 0 && !loaded.some((item: Exchange) => item.id === orderExchange)) setOrderExchange(loaded[0].id);
    } catch {
      setExchangeError("Не удалось загрузить список бирж");
    }
  };

  const addExchange = async () => {
    setExchangeError("");
    try {
      const response = await fetch("http://localhost:3001/api/exchanges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: newExchangeId, name: newExchangeName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка добавления биржи");
      setNewExchangeId("");
      setNewExchangeName("");
      await loadExchanges();
    } catch (error) {
      setExchangeError(error instanceof Error ? error.message : "Ошибка добавления биржи");
    }
  };

  const fetchMarket = async () => {
    setMarketLoading(true);
    setMarketError("");
    try {
      const response = await fetch(`http://localhost:3001/api/market/summary?exchange=${encodeURIComponent(selectedExchange)}&symbol=${encodeURIComponent(symbol)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка получения рынка");
      setMarket(data as MarketSummary);
    } catch (error) {
      setMarket(null);
      setMarketError(error instanceof Error ? error.message : "Ошибка получения рынка");
    } finally {
      setMarketLoading(false);
    }
  };

  const scanOpportunities = async () => {
    setScannerLoading(true);
    setScannerError("");
    try {
      const response = await fetch(`http://localhost:3001/api/scanner/opportunities?symbol=${encodeURIComponent(symbol)}&notionalUsdt=${scannerNotional}&holdHours=${scannerHoldHours}&slippagePercent=${scannerSlippage}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error || "Ошибка сканера");
      }
      const data = await response.json();
      const rows = Array.isArray(data.opportunities) ? data.opportunities : [];
      setScannerRows(rows.filter((row) => Number(row?.estimatedNetPnlUsdt || 0) > 0));
    } catch (error) {
      setScannerRows([]);
      setScannerError(error instanceof Error ? error.message : "Ошибка сканера");
    } finally {
      setScannerLoading(false);
    }
  };

  const scanBestFunding = async () => {
    setBestFundingLoading(true);
    setBestFundingError("");
    try {
      const response = await fetch(`http://localhost:3001/api/scanner/best-funding?notionalUsdt=${scannerNotional}&holdHours=${scannerHoldHours}&slippagePercent=${scannerSlippage}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error || "Ошибка сканера лучшего фандинга");
      }
      const data = await response.json();
      const rows = Array.isArray(data.opportunities) ? data.opportunities : [];
      setBestFundingRows(rows.filter((row) => Number(row?.estimatedNetPnlUsdt || 0) > 0));
    } catch (error) {
      setBestFundingRows([]);
      setBestFundingError(error instanceof Error ? error.message : "Ошибка сканера лучшего фандинга");
    } finally {
      setBestFundingLoading(false);
    }
  };

  const openExecuteModal = (row: ScannerOpportunity) => {
    setExecuteModal(row);
    setExecuteResult("");
  };

  const executeOpportunity = async () => {
    if (!executeModal) return;
    setExecutingTrade(true);
    setExecuteResult("");
    try {
      const qty = Number(executeQty);
      const [longRes, shortRes] = await Promise.allSettled([
        fetch("http://localhost:3001/api/trade/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exchange: executeModal.longExchange, symbol: executeModal.symbol, side: "BUY", type: "MARKET", quantity: qty }),
        }).then((r) => r.json()),
        fetch("http://localhost:3001/api/trade/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exchange: executeModal.shortExchange, symbol: executeModal.symbol, side: "SELL", type: "MARKET", quantity: qty }),
        }).then((r) => r.json()),
      ]);
      const longOk = longRes.status === "fulfilled" && !longRes.value?.error;
      const shortOk = shortRes.status === "fulfilled" && !shortRes.value?.error;
      if (longOk && shortOk) {
        setExecuteResult(`✅ Long на ${executeModal.longExchange} и Short на ${executeModal.shortExchange} — исполнены`);
      } else {
        const errors: string[] = [];
        if (!longOk) errors.push(`Long (${executeModal.longExchange}): ${longRes.status === "fulfilled" ? (longRes.value?.error ?? "ошибка") : "ошибка"}`);
        if (!shortOk) errors.push(`Short (${executeModal.shortExchange}): ${shortRes.status === "fulfilled" ? (shortRes.value?.error ?? "ошибка") : "ошибка"}`);
        setExecuteResult(`⚠️ ${errors.join("; ")}`);
      }
    } catch (error) {
      setExecuteResult(error instanceof Error ? `Ошибка: ${error.message}` : "Ошибка исполнения");
    } finally {
      setExecutingTrade(false);
    }
  };

  const fetchPositions = async () => {
    setPositionsLoading(true);
    setPositionsError("");
    try {
      const response = await fetch("http://localhost:3001/api/account/positions");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка получения позиций");
      setPositions(Array.isArray(data.positions) ? data.positions : []);
    } catch (error) {
      setPositions([]);
      setPositionsError(error instanceof Error ? error.message : "Ошибка получения позиций");
    } finally {
      setPositionsLoading(false);
    }
  };

  const placeOrder = async () => {
    setPlacingOrder(true);
    setOrderResult("");
    try {
      const response = await fetch("http://localhost:3001/api/trade/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchange: orderExchange, symbol, side: orderSide, type: "MARKET", quantity: Number(orderQuantity) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка выставления ордера");
      setOrderResult(`Ордер отправлен на ${data.exchange}`);
      if (orderExchange === "binance") await fetchPositions();
    } catch (error) {
      setOrderResult(error instanceof Error ? `Ошибка: ${error.message}` : "Ошибка выставления ордера");
    } finally {
      setPlacingOrder(false);
    }
  };

  useEffect(() => {
    loadExchanges();
    loadConfig();
    checkApi();
  }, []);

  const tabBtn = (id: Tab, title: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: "0.5rem 0.85rem",
        borderRadius: "9px",
        border: `1px solid ${tab === id ? ui.primary : ui.border}`,
        background: tab === id ? "#dbeafe" : "white",
        color: tab === id ? "#1d4ed8" : ui.text,
      }}
    >
      {title}
    </button>
  );

  return (
    <main style={{ fontFamily: "Inter, Segoe UI, Arial, sans-serif", padding: "1.4rem", maxWidth: "1200px", margin: "0 auto", color: ui.text, background: ui.bg }}>
      <header style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>FundingArb · Pro Operator</h1>
          <p style={{ margin: "0.3rem 0 0", color: ui.muted }}>Удобная панель: мульти-биржевые ордера, сканер возможностей и отдельная вкладка всех важных настроек.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {tabBtn("overview", "Обзор")}
          {tabBtn("scanner", "Сканер")}
          {tabBtn("settings", "Настройки")}
        </div>
      </header>

      {tab === "overview" && (
        <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1rem", marginBottom: "1rem" }}>
            <article style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Статус</h3>
              <button onClick={checkApi} disabled={loadingStatus}>Обновить статус</button>
              {apiStatus && (
                <>
                  <p>Service: {apiStatus.service} · Binance {apiStatus.binanceMode.toUpperCase()}</p>
                  <p style={{ color: ui.muted, fontSize: "0.9rem" }}>Ключи: Binance {apiStatus.configuredKeys?.binance?.apiKey ? "✅" : "❌"} · Bybit {apiStatus.configuredKeys?.bybit?.apiKey ? "✅" : "❌"} · Bitget {apiStatus.configuredKeys?.bitget?.apiKey ? "✅" : "❌"} · OKX {apiStatus.configuredKeys?.okx?.apiKey ? "✅" : "❌"}</p>
                </>
              )}
              {statusError && <p style={{ color: "#b91c1c" }}>{statusError}</p>}
            </article>

            <article style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Рынок</h3>
              <label>Биржа<Tooltip text="Выберите биржу для получения live-данных о рынке" /><select value={selectedExchange} onChange={(e) => setSelectedExchange(e.target.value)} style={inputStyle}>{exchanges.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
              <label style={{ display: "block", marginTop: "0.5rem" }}>Пара<Tooltip text="Торговая пара, например BTCUSDT" /><input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} style={inputStyle} /></label>
              <button onClick={fetchMarket} disabled={marketLoading} style={{ marginTop: "0.6rem" }}>{marketLoading ? "Загрузка..." : "Обновить рынок"}</button>
              {market && <p style={{ marginTop: "0.6rem" }}>Mark {market.markPrice} · Funding {(market.lastFundingRate * 100).toFixed(4)}%</p>}
              {marketError && <p style={{ color: "#b91c1c" }}>{marketError}</p>}
            </article>

            <article style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Быстрый ордер</h3>
              <label>Биржа ордера<Tooltip text="На какой бирже разместить рыночный ордер" /><select value={orderExchange} onChange={(e) => setOrderExchange(e.target.value)} style={inputStyle}>{exchanges.filter((x) => x.supportsTrading).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                <label>Side<Tooltip text="BUY — открыть Long / закрыть Short. SELL — открыть Short / закрыть Long" /><select value={orderSide} onChange={(e) => setOrderSide(e.target.value as "BUY" | "SELL")} style={inputStyle}><option value="BUY">BUY</option><option value="SELL">SELL</option></select></label>
                <label>Qty<Tooltip text="Количество контрактов (не в USDT). Например 0.001 BTC" /><input value={orderQuantity} onChange={(e) => setOrderQuantity(e.target.value)} style={inputStyle} /></label>
              </div>
              <button onClick={placeOrder} disabled={placingOrder} style={{ marginTop: "0.7rem" }}>{placingOrder ? "Отправка..." : "Отправить MARKET"}</button>
              {orderResult && <p style={{ marginTop: "0.6rem" }}>{orderResult}</p>}
            </article>
          </section>

          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Позиции Binance</h3>
            <button onClick={fetchPositions} disabled={positionsLoading}>{positionsLoading ? "Обновляем..." : "Обновить позиции"}</button>
            <p>Unrealized PnL: <strong style={{ color: totalUnrealized >= 0 ? "#166534" : "#b91c1c" }}>{money(totalUnrealized)}</strong></p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: `1px solid ${ui.border}`, textAlign: "left" }}><th>Пара</th><th>Side</th><th>Size</th><th>Entry</th><th>Mark</th><th>uPnL</th></tr></thead>
                <tbody>
                  {positions.map((p) => <tr key={`${p.symbol}-${p.side}`} style={{ borderBottom: `1px solid #f1f5f9` }}><td>{p.symbol}</td><td>{p.side}</td><td>{p.positionAmt}</td><td>{p.entryPrice}</td><td>{p.markPrice}</td><td style={{ color: p.unrealizedProfit >= 0 ? "#166534" : "#b91c1c" }}>{money(p.unrealizedProfit)}</td></tr>)}
                </tbody>
              </table>
            </div>
            {positionsError && <p style={{ color: "#b91c1c" }}>{positionsError}</p>}
          </section>
        </>
      )}

      {tab === "scanner" && (
        <>
        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Сканер арбитражных возможностей</h3>
          {apiConfig?.defaults?.scanner && <p style={{ color: ui.muted }}>Defaults: {apiConfig.defaults.scanner.symbol} · {apiConfig.defaults.scanner.notionalUsdt} USDT · {apiConfig.defaults.scanner.holdHours}h · {apiConfig.defaults.scanner.slippagePercent}% slippage</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "0.6rem", alignItems: "end" }}>
            <label>Symbol<Tooltip text="Торговая пара для сравнения funding rate на разных биржах (например BTCUSDT)" /><input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} style={inputStyle} /></label>
            <label>Notional USDT<Tooltip text="Размер позиции в USDT — используется для расчёта ожидаемой прибыли и издержек" /><input type="number" value={scannerNotional} onChange={(e) => setScannerNotional(Number(e.target.value))} style={inputStyle} /></label>
            <label>Hold hours<Tooltip text="Сколько часов держать позицию. Funding начисляется каждые 8 часов, поэтому 8h = 1 цикл" /><input type="number" value={scannerHoldHours} onChange={(e) => setScannerHoldHours(Number(e.target.value))} style={inputStyle} /></label>
            <label>Slippage %<Tooltip text="Ожидаемое проскальзывание при входе и выходе из позиции (оба плеча вместе)" /><input type="number" step={0.01} value={scannerSlippage} onChange={(e) => setScannerSlippage(Number(e.target.value))} style={inputStyle} /></label>
            <button onClick={scanOpportunities} disabled={scannerLoading}>{scannerLoading ? "Сканируем..." : "Сканировать"}</button>
          </div>

          <div style={{ marginTop: "0.8rem", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "0.7rem" }}>
            <div style={{ ...cardStyle, padding: "0.7rem" }}><div style={{ color: ui.muted }}>Прибыльных связок</div><strong>{scannerRows.length}</strong></div>
            <div style={{ ...cardStyle, padding: "0.7rem" }}><div style={{ color: ui.muted }}>Положительных по net PnL</div><strong>{positiveScannerRows.length}</strong></div>
          </div>

          <div style={{ marginTop: "0.8rem", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: `1px solid ${ui.border}`, textAlign: "left" }}><th>Long</th><th>Short</th><th>Funding diff</th><th>Funding long</th><th>Funding short</th><th>Gross funding</th><th>Fees % RT</th><th>Costs</th><th>Net</th><th></th></tr></thead>
              <tbody>
                {scannerRows.map((r, i) => (
                  <tr key={`${r.longExchange}-${r.shortExchange}-${i}`} style={{ borderBottom: "1px solid #f1f5f9", background: "#f0fdf4" }}>
                    <td>{r.longExchange}</td>
                    <td>{r.shortExchange}</td>
                    <td>{r.fundingDiffPercent.toFixed(4)}%</td>
                    <td>{money(r.longFundingPnlUsdt ?? 0)}</td>
                    <td>{money(r.shortFundingPnlUsdt ?? 0)}</td>
                    <td>{money(r.grossFundingPnlUsdt)}</td>
                    <td>{(r.roundTripFeesPercent ?? 0).toFixed(4)}%</td>
                    <td style={{ color: "#b91c1c" }}>-{r.estimatedCostsUsdt.toFixed(2)} USDT</td>
                    <td style={{ color: "#166534", fontWeight: 700 }}>{money(r.estimatedNetPnlUsdt)}</td>
                    <td><button onClick={() => openExecuteModal(r)} style={{ background: ui.primary, color: "#fff", border: "none", borderRadius: "7px", padding: "0.3rem 0.65rem", cursor: "pointer", whiteSpace: "nowrap" }}>Исполнить</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {scannerError && <p style={{ color: "#b91c1c" }}>{scannerError}</p>}
        </section>

        <section style={{ ...cardStyle, marginTop: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>🔍 Поиск лучшего фандинга</h3>
          <p style={{ color: ui.muted, marginTop: 0 }}>
            Автоматически сканирует топ-10 символов (включая BTC, ETH, SOL, BNB, XRP и др.) по всем биржам и находит наиболее выгодные арбитражные возможности.
            Параметры (Notional, Hold hours, Slippage) берутся из полей выше.
          </p>
          <button onClick={scanBestFunding} disabled={bestFundingLoading} style={{ background: ui.primary, color: "#fff", border: "none", borderRadius: "9px", padding: "0.5rem 1rem", cursor: bestFundingLoading ? "not-allowed" : "pointer" }}>
            {bestFundingLoading ? "Сканируем все символы..." : "Найти лучший фандинг"}
          </button>
          {bestFundingRows.length > 0 && (
            <div style={{ marginTop: "0.8rem", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${ui.border}`, textAlign: "left" }}>
                    <th>Символ</th><th>Long</th><th>Short</th><th>Funding diff</th><th>Funding long</th><th>Funding short</th><th>Gross funding</th><th>Fees % RT</th><th>Costs</th><th>Net PnL</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {bestFundingRows.map((r, i) => (
                    <tr key={`best-${r.symbol}-${r.longExchange}-${i}`} style={{ borderBottom: "1px solid #f1f5f9", background: "#f0fdf4" }}>
                      <td><strong>{r.symbol}</strong></td>
                      <td>{r.longExchange}</td><td>{r.shortExchange}</td>
                      <td>{r.fundingDiffPercent.toFixed(4)}%</td>
                      <td>{money(r.longFundingPnlUsdt ?? 0)}</td>
                      <td>{money(r.shortFundingPnlUsdt ?? 0)}</td>
                      <td>{money(r.grossFundingPnlUsdt)}</td>
                      <td>{(r.roundTripFeesPercent ?? 0).toFixed(4)}%</td>
                      <td style={{ color: "#b91c1c" }}>-{r.estimatedCostsUsdt.toFixed(2)} USDT</td>
                      <td style={{ color: "#166534", fontWeight: "bold" }}>{money(r.estimatedNetPnlUsdt)}</td>
                      <td><button onClick={() => openExecuteModal(r)} style={{ background: ui.primary, color: "#fff", border: "none", borderRadius: "7px", padding: "0.3rem 0.65rem", cursor: "pointer", whiteSpace: "nowrap" }}>Исполнить</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {bestFundingError && <p style={{ color: "#b91c1c" }}>{bestFundingError}</p>}
        </section>
        </>
      )}

      {tab === "settings" && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "1rem" }}>
          <article style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Стратегия и риск</h3>
            <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginBottom: "0.7rem" }}>
              <button onClick={() => applyPreset("Conservative")} style={{ border: strategyMode === "Conservative" ? `2px solid ${ui.primary}` : `1px solid ${ui.border}`, borderRadius: "8px" }}>Консервативный</button>
              <button onClick={() => applyPreset("Balanced")} style={{ border: strategyMode === "Balanced" ? `2px solid ${ui.primary}` : `1px solid ${ui.border}`, borderRadius: "8px" }}>Сбалансированный</button>
              <button onClick={() => applyPreset("Aggressive")} style={{ border: strategyMode === "Aggressive" ? `2px solid ${ui.primary}` : `1px solid ${ui.border}`, borderRadius: "8px" }}>Агрессивный</button>
            </div>

            <label>Min funding diff %<Tooltip text="Минимальная разница funding rate между биржами для открытия арбитражной позиции" /><input type="number" step={0.001} value={strategy.minFundingDiffPercent} onChange={(e) => setStrategy((p) => ({ ...p, minFundingDiffPercent: Number(e.target.value) }))} style={inputStyle} /></label>
            <label>Min spread %<Tooltip text="Минимальный спред между mark price и index price — дополнительный источник прибыли" /><input type="number" step={0.001} value={strategy.minSpreadPercent} onChange={(e) => setStrategy((p) => ({ ...p, minSpreadPercent: Number(e.target.value) }))} style={inputStyle} /></label>
            <label>Max slippage %<Tooltip text="Максимально допустимое проскальзывание при входе в позицию" /><input type="number" step={0.001} value={strategy.maxEntrySlippagePercent} onChange={(e) => setStrategy((p) => ({ ...p, maxEntrySlippagePercent: Number(e.target.value) }))} style={inputStyle} /></label>
            <label>Min net-edge %<Tooltip text="Минимальная чистая прибыль после вычета комиссий и проскальзывания. Позиция не открывается ниже этого порога" /><input type="number" step={0.001} value={strategy.minNetEdgePercent} onChange={(e) => setStrategy((p) => ({ ...p, minNetEdgePercent: Number(e.target.value) }))} style={inputStyle} /></label>
            <label>Max hold h<Tooltip text="Максимальное время удержания позиции (в часах). 8h = 1 цикл начисления фандинга" /><input type="number" step={1} value={strategy.maxHoldHours} onChange={(e) => setStrategy((p) => ({ ...p, maxHoldHours: Number(e.target.value) }))} style={inputStyle} /></label>
            <label>Rebalance %<Tooltip text="Порог отклонения позиции (%), при котором срабатывает автоматическая ребалансировка" /><input type="number" step={0.01} value={strategy.rebalanceThresholdPercent} onChange={(e) => setStrategy((p) => ({ ...p, rebalanceThresholdPercent: Number(e.target.value) }))} style={inputStyle} /></label>
            <label style={{ display: "flex", gap: "0.45rem", marginTop: "0.6rem" }}><input type="checkbox" checked={strategy.autoHedge} onChange={(e) => setStrategy((p) => ({ ...p, autoHedge: e.target.checked }))} /> Auto-hedge<Tooltip text="Автоматически открывает противоположную позицию на другой бирже для полного нейтрального хеджирования" /></label>
            <label style={{ display: "flex", gap: "0.45rem" }}><input type="checkbox" checked={strategy.onlyTopLiquidity} onChange={(e) => setStrategy((p) => ({ ...p, onlyTopLiquidity: e.target.checked }))} /> Только топ-ликвидность<Tooltip text="Использовать только торговые пары с высоким объёмом торгов для минимизации проскальзывания" /></label>
          </article>

          <article style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Подсказки стратегии</h3>
            <p style={{ color: ui.muted }}>Funding: <strong>{estimatedFundingPercent.toFixed(4)}%</strong> · Spread: <strong>{estimatedSpreadPercent.toFixed(4)}%</strong> · Net-edge: <strong style={{ color: estimatedEdgePercent >= 0 ? "#166534" : "#b91c1c" }}>{estimatedEdgePercent.toFixed(4)}%</strong></p>
            <ul>{strategyHints.map((h, i) => <li key={`hint-${i}`}>{h}</li>)}</ul>
            <h4>Биржи и ключи</h4>
            <div style={{ display: "grid", gap: "0.35rem" }}>
              {["binance", "bybit", "bitget", "okx"].map((id) => (
                <div key={id} style={{ display: "flex", justifyContent: "space-between", border: `1px solid ${ui.border}`, borderRadius: "8px", padding: "0.4rem 0.55rem" }}>
                  <span>{id.toUpperCase()}</span>
                  <span>{apiConfig?.configuredKeys?.[id]?.apiKey ? "API ✅" : "API ❌"}</span>
                </div>
              ))}
            </div>
          </article>

          <article style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Управление биржами</h3>
            <p style={{ color: ui.muted, marginTop: 0 }}>Добавляйте кастомные биржи, если нужен отдельный мониторинг/интеграция.</p>
            <label>Exchange id<input value={newExchangeId} onChange={(e) => setNewExchangeId(e.target.value)} style={inputStyle} /></label>
            <label>Name<input value={newExchangeName} onChange={(e) => setNewExchangeName(e.target.value)} style={inputStyle} /></label>
            <button onClick={addExchange} style={{ marginTop: "0.6rem" }}>Добавить</button>
            {exchangeError && <p style={{ color: "#b91c1c" }}>{exchangeError}</p>}
            <div style={{ marginTop: "0.7rem", maxHeight: "180px", overflow: "auto", border: `1px solid ${ui.border}`, borderRadius: "8px", padding: "0.45rem" }}>
              {exchanges.map((x) => (
                <div key={x.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0" }}>
                  <span>{x.name}</span>
                  <span style={{ color: ui.muted }}>{x.supportsTrading ? "trading" : "data-only"}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
      {executeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Исполнить сделку"
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) { setExecuteModal(null); setExecuteResult(""); } }}
        >
          <div style={{ ...cardStyle, width: "min(96vw,420px)", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ marginTop: 0 }}>Исполнить сделку</h3>
            <p style={{ marginTop: 0, color: ui.muted }}>
              <strong>{executeModal.symbol}</strong> · Long на <strong>{executeModal.longExchange}</strong> · Short на <strong>{executeModal.shortExchange}</strong>
            </p>
            <div style={{ display: "grid", gap: "0.3rem", marginBottom: "0.9rem", fontSize: "0.88rem", color: ui.muted }}>
              <span>Funding diff: <strong>{executeModal.fundingDiffPercent.toFixed(4)}%</strong></span>
              <span>Est. net PnL: <strong style={{ color: "#166534" }}>{money(executeModal.estimatedNetPnlUsdt)}</strong></span>
            </div>
            <label>
              Количество контрактов
              <Tooltip text="Количество контрактов для каждой ноги (long и short). Например 0.001 BTC" />
              <input
                type="number"
                step="0.001"
                value={executeQty}
                onChange={(e) => setExecuteQty(e.target.value)}
                style={inputStyle}
                disabled={executingTrade}
              />
            </label>
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.9rem" }}>
              <button
                onClick={executeOpportunity}
                disabled={executingTrade}
                style={{ flex: 1, background: ui.primary, color: "#fff", border: "none", borderRadius: "9px", padding: "0.55rem 1rem", cursor: executingTrade ? "not-allowed" : "pointer", fontWeight: 600 }}
              >
                {executingTrade ? "Исполняем..." : "Подтвердить и исполнить"}
              </button>
              <button
                onClick={() => { setExecuteModal(null); setExecuteResult(""); }}
                disabled={executingTrade}
                style={{ padding: "0.55rem 0.9rem", borderRadius: "9px", border: `1px solid ${ui.border}`, cursor: "pointer" }}
              >
                Отмена
              </button>
            </div>
            {executeResult && (
              <p style={{ marginTop: "0.7rem", fontWeight: 500, color: executeResult.startsWith("✅") ? "#166534" : "#b91c1c" }}>
                {executeResult}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
