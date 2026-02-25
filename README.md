# cefbl

## Универсальный запуск (Linux / Windows)

### 1) Установка зависимостей

```bash
npm install
```

### 2) Запуск backend + frontend одной командой

```bash
npm run start:all
```

- Backend: `http://localhost:3001`
- Frontend (Vite): `http://localhost:5173`

## Multi-exchange live data + real orders

Поддерживаются биржи:
- Binance Futures
- Bybit
- Bitget
- OKX

Основные endpoint'ы:
- `GET /api/exchanges` — список бирж
- `POST /api/exchanges` — добавить биржу (`id`, `name`)
- `GET /api/market/summary?exchange=...&symbol=BTCUSDT` — live market/funding
- `POST /api/trade/order` — **реальный ордер** на выбранной бирже (`exchange`, `symbol`, `side`, `quantity`)
- `GET /api/scanner/opportunities?symbol=BTCUSDT&notionalUsdt=1000&holdHours=8&slippagePercent=0.04` — сканер арбитража фандинга и оценка возможного PnL
- `GET /api/config` — параметры по умолчанию + статус заполнения API-ключей


## Новый удобный интерфейс

Добавлены вкладки:
- **Обзор**: статус, быстрый ордер, рынок и текущие позиции.
- **Сканер**: поиск арбитражных возможностей с оценкой PnL.
- **Настройки**: отдельная вкладка всех ключевых параметров для качественной торговли
  (risk preset, фильтры стратегии, лимиты удержания, статус ключей и управление биржами).

## Сканер возможностей

Сканер сравнивает funding между биржами и показывает:
- где выгоднее держать LONG/SHORT;
- gross funding PnL;
- оценку издержек (taker fee + slippage);
- итоговый estimated net PnL.

## Стратегия арбитража фандинга (UI)

В интерфейсе есть:
- пресеты риска (консервативный / сбалансированный / агрессивный);
- пороги входа (`min funding diff`, `min spread`, `max slippage`, `min net-edge`);
- лимиты удержания и ребаланса;
- подсказки по входу на основе live market data.

## Ключи API и параметры

Скопируйте шаблон и заполните ключи:

```bash
cp .env.example .env.local
```

Поля в `.env.local`:
- `BINANCE_API_KEY`, `BINANCE_API_SECRET`
- `BYBIT_API_KEY`, `BYBIT_API_SECRET`
- `BITGET_API_KEY`, `BITGET_API_SECRET`, `BITGET_PASSPHRASE`
- `OKX_API_KEY`, `OKX_API_SECRET`, `OKX_PASSPHRASE`

Параметры сканера по умолчанию (backend):
- `SCANNER_DEFAULT_SYMBOL`
- `SCANNER_DEFAULT_NOTIONAL_USDT`
- `SCANNER_DEFAULT_HOLD_HOURS`
- `SCANNER_DEFAULT_SLIPPAGE_PERCENT`

Для Binance можно включить тестовую сеть:

```env
BINANCE_TESTNET=true
```

> ⚠️ Любой вызов `/api/trade/order` отправляет реальный ордер на выбранную биржу при валидных ключах.
