import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <main
      style={{
        fontFamily: "Segoe UI, Arial, sans-serif",
        padding: "2rem",
        maxWidth: "720px",
        margin: "0 auto",
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ marginBottom: "0.5rem" }}>FundingArb Bot</h1>
      <p style={{ marginTop: 0, color: "#4b5563" }}>
        Приложение успешно запущено. Это стартовая страница для проверки запуска на
        Windows 10.
      </p>

      <section
        style={{
          marginTop: "1.5rem",
          border: "1px solid #d1d5db",
          borderRadius: "12px",
          padding: "1rem",
          background: "#f9fafb",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Проверка API</h2>
        <p style={{ marginBottom: 0 }}>
          Backend status endpoint: <code>http://localhost:3001/api/status</code>
        </p>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
