import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

type ApiStatus = {
  ok: boolean;
  service: string;
  timestamp: string;
};

type ExchangeConfig = {
  id: string;
  name: string;
  enabled: boolean;
  account: string;
  makerFee: number;
  takerFee: number;
  fundingRate: number;
  hedgeMode: "ON" | "OFF";
};

type Position = {
  pair: string;
  exchange: string;
  side: "Long" | "Short";
  pnl: number;
  fee: number;
  funding: number;
  roe: number;
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "1rem",
  background: "#ffffff",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
};

const kpiValueStyle: React.CSSProperties = {
  fontSize: "1.4rem",
  fontWeight: 700,
  margin: "0.35rem 0 0",
};

const initialExchanges: ExchangeConfig[] = [
  {
    id: "binance",
    name: "Binance Futures",
    enabled: true,
    account: "main-arb-01",
    makerFee: 0.018,
    takerFee: 0.04,
    fundingRate: 0.011,
    hedgeMode: "ON",
  },
  {
    id: "bybit",
    name: "Bybit Unified",
    enabled: true,
    account: "hedge-grid-02",
    makerFee: 0.02,
    takerFee: 0.055,
    fundingRate: -0.007,
    hedgeMode: "ON",
  },
  {
    id: "okx",
    name: "OKX Swap",
    enabled: false,
    account: "reserve-exec",
    makerFee: 0.016,
    takerFee: 0.05,
    fundingRate: 0.004,
    hedgeMode: "OFF",
  },
];

const openPositions: Position[] = [
  { pair: "BTCUSDT", exchange: "Binance", side: "Short", pnl: 196.4, fee: 32.8, funding: 41.2, roe: 1.9 },
  { pair: "ETHUSDT", exchange: "Bybit", side: "Long", pnl: 104.6, fee: 17.1, funding: -8.6, roe: 1.1 },
  { pair: "SOLUSDT", exchange: "Binance", side: "Short", pnl: -26.2, fee: 5.6, funding: 6.9, roe: -0.3 },
];

function money(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)} USDT`;
}

function App() {
  const [botEnabled, setBotEnabled] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState("Умеренный");
  const [tradingMode, setTradingMode] = useState("Funding Arb");
  const [maxLeverage, setMaxLeverage] = useState(4);
  const [maxOpenPositions, setMaxOpenPositions] = useState(8);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [dailyDrawdownLimit, setDailyDrawdownLimit] = useState(3.5);
  const [warningSpread, setWarningSpread] = useState(0.22);
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [telegramChatId, setTelegramChatId] = useState("-1002233445566");
  const [telegramTokenMasked, setTelegramTokenMasked] = useState("72****:AAE********************************");
  const [exchanges, setExchanges] = useState(initialExchanges);

  const totalGrossPnl = useMemo(() => openPositions.reduce((acc, item) => acc + item.pnl, 0), []);
  const totalFees = useMemo(() => openPositions.reduce((acc, item) => acc + item.fee, 0), []);
  const totalFunding = useMemo(() => openPositions.reduce((acc, item) => acc + item.funding, 0), []);
  const netPnl = totalGrossPnl - totalFees + totalFunding;

  const riskUsage = useMemo(() => {
    if (selectedRisk === "Консервативный") {
      return 38;
    }

    if (selectedRisk === "Агрессивный") {
      return 81;
    }

    return 59;
  }, [selectedRisk]);

  const nextAction = useMemo(() => {
    if (!botEnabled) {
      return "Бот на паузе. Включите его для торговли.";
    }

    if (selectedRisk === "Консервативный") {
      return "Следующий шаг: ожидать spread > 0.35% и подтверждение объёма.";
    }

    if (selectedRisk === "Агрессивный") {
      return "Следующий шаг: искать spread > 0.2% и открывать короткие циклы.";
    }

    return "Следующий шаг: мониторить spread > 0.28% на основных парах.";
  }, [botEnabled, selectedRisk]);

  const checkApi = async () => {
    setLoadingStatus(true);
    setStatusError("");

    try {
      const response = await fetch("http://localhost:3001/api/status");
      const data = (await response.json()) as ApiStatus;
      setApiStatus(data);
    } catch {
      setApiStatus(null);
      setStatusError("Не удалось получить ответ от backend. Проверьте, запущен ли сервер.");
    } finally {
      setLoadingStatus(false);
    }
  };

  return (
    <main
      style={{
        fontFamily: "Inter, Segoe UI, Arial, sans-serif",
        padding: "2rem 1rem 3rem",
        maxWidth: "1120px",
        margin: "0 auto",
        lineHeight: 1.5,
        color: "#0f172a",
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ marginBottom: "0.4rem" }}>FundingArb Bot · Панель оператора</h1>
        <p style={{ margin: 0, color: "#475569" }}>
          Контроль торговли, рисков, Telegram/бирж и прозрачный чистый PnL с учётом комиссий и фандинга.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <article style={cardStyle}>
          <p style={{ margin: 0, color: "#64748b" }}>Валовый PnL</p>
          <p style={{ ...kpiValueStyle, color: totalGrossPnl >= 0 ? "#166534" : "#b91c1c" }}>{money(totalGrossPnl)}</p>
        </article>
        <article style={cardStyle}>
          <p style={{ margin: 0, color: "#64748b" }}>Комиссии</p>
          <p style={{ ...kpiValueStyle, color: "#b91c1c" }}>-{totalFees.toFixed(2)} USDT</p>
        </article>
        <article style={cardStyle}>
          <p style={{ margin: 0, color: "#64748b" }}>Фандинг</p>
          <p style={{ ...kpiValueStyle, color: totalFunding >= 0 ? "#166534" : "#b91c1c" }}>{money(totalFunding)}</p>
        </article>
        <article style={cardStyle}>
          <p style={{ margin: 0, color: "#64748b" }}>Чистый PnL</p>
          <p style={{ ...kpiValueStyle, color: netPnl >= 0 ? "#166534" : "#b91c1c" }}>{money(netPnl)}</p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Формула: Валовый PnL - Комиссии + Фандинг</p>
        </article>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        <article style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Управление торговлей</h2>
          <label style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "0.6rem" }}>
            <input type="checkbox" checked={botEnabled} onChange={(event) => setBotEnabled(event.target.checked)} />
            Бот активен
          </label>

          <label style={{ display: "block", marginTop: "0.8rem" }}>
            Торговый режим
            <select
              value={tradingMode}
              onChange={(event) => setTradingMode(event.target.value)}
              style={{ width: "100%", marginTop: "0.35rem", padding: "0.45rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option>Funding Arb</option>
              <option>Basis Arb</option>
              <option>Delta Neutral</option>
            </select>
          </label>

          <label style={{ display: "block", marginTop: "0.8rem" }}>
            Макс. плечо: {maxLeverage}x
            <input
              type="range"
              min={1}
              max={15}
              value={maxLeverage}
              onChange={(event) => setMaxLeverage(Number(event.target.value))}
              style={{ width: "100%" }}
            />
          </label>

          <label style={{ display: "block", marginTop: "0.5rem" }}>
            Макс. открытых позиций
            <input
              type="number"
              min={1}
              max={30}
              value={maxOpenPositions}
              onChange={(event) => setMaxOpenPositions(Number(event.target.value))}
              style={{ width: "100%", marginTop: "0.35rem", padding: "0.45rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </label>
        </article>

        <article style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Риски и лимиты</h2>
          <label style={{ display: "block", marginTop: "0.6rem" }}>
            Профиль риска
            <select
              value={selectedRisk}
              onChange={(event) => setSelectedRisk(event.target.value)}
              style={{ width: "100%", marginTop: "0.35rem", padding: "0.45rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option>Консервативный</option>
              <option>Умеренный</option>
              <option>Агрессивный</option>
            </select>
          </label>

          <label style={{ display: "block", marginTop: "0.8rem" }}>
            Дневной лимит просадки (%):
            <input
              type="number"
              step={0.1}
              value={dailyDrawdownLimit}
              onChange={(event) => setDailyDrawdownLimit(Number(event.target.value))}
              style={{ width: "100%", marginTop: "0.35rem", padding: "0.45rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </label>

          <label style={{ display: "block", marginTop: "0.8rem" }}>
            Порог предупреждения по spread (%):
            <input
              type="number"
              step={0.01}
              value={warningSpread}
              onChange={(event) => setWarningSpread(Number(event.target.value))}
              style={{ width: "100%", marginTop: "0.35rem", padding: "0.45rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </label>

          <p style={{ margin: "0.9rem 0 0.3rem", color: "#475569" }}>Использование риск-бюджета: {riskUsage}%</p>
          <div style={{ width: "100%", height: "10px", background: "#e2e8f0", borderRadius: "999px" }}>
            <div
              style={{
                width: `${riskUsage}%`,
                height: "100%",
                borderRadius: "999px",
                background: riskUsage > 75 ? "#dc2626" : "#2563eb",
              }}
            />
          </div>
        </article>

        <article style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Telegram и уведомления</h2>
          <label style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "0.6rem" }}>
            <input
              type="checkbox"
              checked={telegramEnabled}
              onChange={(event) => setTelegramEnabled(event.target.checked)}
            />
            Уведомления в Telegram включены
          </label>

          <label style={{ display: "block", marginTop: "0.8rem" }}>
            Chat ID
            <input
              value={telegramChatId}
              onChange={(event) => setTelegramChatId(event.target.value)}
              style={{ width: "100%", marginTop: "0.35rem", padding: "0.45rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </label>

          <label style={{ display: "block", marginTop: "0.8rem" }}>
            Bot Token (masked)
            <input
              value={telegramTokenMasked}
              onChange={(event) => setTelegramTokenMasked(event.target.value)}
              style={{ width: "100%", marginTop: "0.35rem", padding: "0.45rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </label>

          <p style={{ marginTop: "0.7rem", color: "#64748b", fontSize: "0.9rem" }}>
            Триггеры: ошибки ордеров, превышение риска, смена funding &gt; 0.015%, резкий рост комиссий.
          </p>
        </article>
      </section>

      <section style={{ ...cardStyle, marginTop: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Настройка бирж</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                <th>Биржа</th>
                <th>Активна</th>
                <th>Аккаунт</th>
                <th>Maker fee %</th>
                <th>Taker fee %</th>
                <th>Funding %</th>
                <th>Hedge mode</th>
              </tr>
            </thead>
            <tbody>
              {exchanges.map((exchange) => (
                <tr key={exchange.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td>{exchange.name}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={exchange.enabled}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setExchanges((prev) => prev.map((item) => (item.id === exchange.id ? { ...item, enabled: checked } : item)));
                      }}
                    />
                  </td>
                  <td>{exchange.account}</td>
                  <td>{exchange.makerFee.toFixed(3)}</td>
                  <td>{exchange.takerFee.toFixed(3)}</td>
                  <td style={{ color: exchange.fundingRate >= 0 ? "#166534" : "#b91c1c" }}>{exchange.fundingRate.toFixed(3)}</td>
                  <td>{exchange.hedgeMode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...cardStyle, marginTop: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Открытые позиции и PnL-структура</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                <th>Пара</th>
                <th>Биржа</th>
                <th>Сторона</th>
                <th>Валовый PnL</th>
                <th>Комиссии</th>
                <th>Фандинг</th>
                <th>ROE %</th>
              </tr>
            </thead>
            <tbody>
              {openPositions.map((position, index) => (
                <tr key={`${position.pair}-${index}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td>{position.pair}</td>
                  <td>{position.exchange}</td>
                  <td>{position.side}</td>
                  <td style={{ color: position.pnl >= 0 ? "#166534" : "#b91c1c" }}>{money(position.pnl)}</td>
                  <td style={{ color: "#b91c1c" }}>-{position.fee.toFixed(2)} USDT</td>
                  <td style={{ color: position.funding >= 0 ? "#166534" : "#b91c1c" }}>{money(position.funding)}</td>
                  <td style={{ color: position.roe >= 0 ? "#166534" : "#b91c1c" }}>{position.roe.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        <article style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Статус backend</h2>
          <p style={{ marginTop: "0.2rem", color: "#64748b" }}>
            Endpoint: <code>http://localhost:3001/api/status</code>
          </p>

          <button
            onClick={checkApi}
            disabled={loadingStatus}
            style={{
              marginTop: "0.6rem",
              border: "none",
              borderRadius: "8px",
              background: "#2563eb",
              color: "white",
              padding: "0.55rem 0.8rem",
              cursor: loadingStatus ? "wait" : "pointer",
            }}
          >
            {loadingStatus ? "Проверяем..." : "Проверить API"}
          </button>

          {apiStatus && (
            <ul style={{ marginTop: "0.9rem", marginBottom: 0, paddingLeft: "1.1rem" }}>
              <li>OK: {String(apiStatus.ok)}</li>
              <li>Сервис: {apiStatus.service}</li>
              <li>Время: {new Date(apiStatus.timestamp).toLocaleString()}</li>
            </ul>
          )}

          {statusError && <p style={{ marginTop: "0.9rem", color: "#b91c1c" }}>{statusError}</p>}
        </article>

        <article style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Действия оператора</h2>
          <p style={{ marginTop: "0.2rem", color: "#64748b" }}>{nextAction}</p>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
            <button style={{ padding: "0.45rem 0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
              Перезапуск сессии
            </button>
            <button style={{ padding: "0.45rem 0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
              Экспорт логов
            </button>
            <button style={{ padding: "0.45rem 0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
              Тестовый ордер
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
