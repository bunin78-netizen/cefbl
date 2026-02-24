import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

type ApiStatus = {
  ok: boolean;
  service: string;
  timestamp: string;
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "1rem",
  background: "#ffffff",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
};

function App() {
  const [botEnabled, setBotEnabled] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState("Умеренный");
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

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
        maxWidth: "980px",
        margin: "0 auto",
        lineHeight: 1.5,
        color: "#0f172a",
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ marginBottom: "0.4rem" }}>FundingArb Bot · Панель оператора</h1>
        <p style={{ margin: 0, color: "#475569" }}>
          Удобный интерфейс для контроля состояния бота, параметров риска и статуса API.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1rem",
        }}
      >
        <article style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Управление ботом</h2>
          <p style={{ marginTop: "0.2rem", color: "#64748b" }}>
            Быстрый доступ к ключевым переключателям.
          </p>

          <label style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "1rem" }}>
            <input
              type="checkbox"
              checked={botEnabled}
              onChange={(event) => setBotEnabled(event.target.checked)}
            />
            Бот активен
          </label>

          <label style={{ display: "block", marginTop: "1rem" }}>
            <span style={{ display: "block", marginBottom: "0.35rem" }}>Профиль риска</span>
            <select
              value={selectedRisk}
              onChange={(event) => setSelectedRisk(event.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.6rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
              }}
            >
              <option>Консервативный</option>
              <option>Умеренный</option>
              <option>Агрессивный</option>
            </select>
          </label>
        </article>

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
