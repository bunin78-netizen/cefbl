# 🤖 FundingArb Bot — Инструкция по запуску на Windows

## 📋 Требования

| Компонент | Версия | Ссылка |
|-----------|--------|--------|
| Windows | 10 / 11 | — |
| Node.js | 18 LTS или 20 LTS | https://nodejs.org/ |
| npm | 9+ (идёт с Node.js) | — |

---

## ⚡ Быстрый старт (3 шага)

### Шаг 1 — Установите Node.js

1. Перейдите на https://nodejs.org/
2. Скачайте **LTS** версию (рекомендуется 20.x)
3. Запустите установщик, нажимайте **Next**
4. ✅ Убедитесь, что галочка **"Add to PATH"** стоит
5. После установки **перезапустите командную строку**

Проверка:
```
node --version   → v20.x.x
npm --version    → 10.x.x
```

### Шаг 2 — Установите бота

Дважды кликните на `install.bat`

Скрипт автоматически:
- Установит все npm зависимости
- Создаст файл `.env.local` для API ключей
- Откроет файл конфигурации в Блокноте

### Шаг 3 — Добавьте API ключи

Откройте `.env.local` и заполните ключи ваших бирж:

```env
BINANCE_API_KEY=ваш_ключ
BINANCE_API_SECRET=ваш_секрет

BYBIT_API_KEY=ваш_ключ
BYBIT_API_SECRET=ваш_секрет

OKX_API_KEY=ваш_ключ
OKX_API_SECRET=ваш_секрет
OKX_PASSPHRASE=ваш_пассфраза

BITGET_API_KEY=ваш_ключ
BITGET_API_SECRET=ваш_секрет
BITGET_PASSPHRASE=ваш_пассфраза

MEXC_API_KEY=ваш_ключ
MEXC_API_SECRET=ваш_секрет

TELEGRAM_BOT_TOKEN=токен_бота
TELEGRAM_CHAT_ID=ваш_chat_id
```

---

## 🚀 Запуск

### Вариант 1 — Простой (рекомендуется)

```
Дважды кликните: start-all.bat
```

Открывается два окна:
- **Окно 1**: Backend сервер (порт 3001)
- **Окно 2**: Frontend сервер (порт 5173)
- Автоматически открывается браузер

### Вариант 2 — Раздельный запуск

```
start-backend.bat   ← только сервер
start-frontend.bat  ← только интерфейс
```

### Вариант 3 — PM2 (фоновая работа)

```
start-pm2.bat
```

PM2 запускает бота в фоне — он работает даже если закрыть окно.

---

## 🔧 Управление

| Файл | Описание |
|------|----------|
| `install.bat` | Первоначальная установка |
| `start-all.bat` | Запуск Backend + Frontend |
| `start-backend.bat` | Только бэкенд |
| `start-frontend.bat` | Только фронтенд |
| `start-pm2.bat` | PM2 менеджер |
| `stop-all.bat` | Остановить всё |
| `check-status.bat` | Диагностика |
| `update-bot.bat` | Обновить зависимости |

---

## 📱 Telegram бот

### Как создать Telegram бот:

1. Откройте Telegram, найдите **@BotFather**
2. Напишите `/newbot`
3. Введите название, например: `My Arbitrage Bot`
4. Введите username, например: `my_arb_bot`
5. Скопируйте **токен** в `.env.local` → `TELEGRAM_BOT_TOKEN`

### Как получить Chat ID:

1. Напишите боту любое сообщение
2. Откройте в браузере:
   ```
   https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates
   ```
3. Найдите `"chat":{"id":XXXXXXX}` — это ваш Chat ID
4. Скопируйте в `.env.local` → `TELEGRAM_CHAT_ID`

---

## 🔑 Как получить API ключи бирж

### Binance
1. https://www.binance.com/en/my/settings/api-management
2. Создать API → Enable Futures Trading
3. Ограничить по IP (рекомендуется)

### Bybit
1. https://www.bybit.com/app/user/api-management
2. Create New Key → Contract - Trade
3. Permissions: Contract (Read + Trade)

### OKX
1. https://www.okx.com/account/my-api
2. Create API V5 → Trade permission
3. Заполнить Passphrase

### Bitget
1. https://www.bitget.com/account/apimanage
2. Create API → Futures trade
3. Заполнить Passphrase

### MEXC
1. https://www.mexc.com/user/openapi
2. Create API Key → Futures permission

---

## ⚙️ Настройки бота (.env.local)

```env
# Минимальный спред для входа в позицию (%)
MIN_SPREAD_PERCENT=0.3

# Размер каждой позиции в USDT
MAX_POSITION_USDT=100

# Максимум открытых позиций одновременно
MAX_OPEN_POSITIONS=5

# Кредитное плечо (1 = без плеча — безопаснее)
LEVERAGE=1

# Интервал сканирования рынка (мс)
CHECK_INTERVAL_MS=5000

# Время удержания позиции (минуты)
HOLD_MINUTES=60
```

---

## 🛠 Устранение проблем

### ❌ "Node.js не найден"
- Установите Node.js с https://nodejs.org/ (LTS версию)
- После установки **перезапустите** командную строку/PowerShell
- Проверьте: `node --version`

### ❌ "npm install не работает"
```cmd
# Очистить кэш npm
npm cache clean --force

# Удалить node_modules и переустановить
rmdir /s /q node_modules
npm install
```

### ❌ "Порт 3001 уже занят"
```cmd
# Найти процесс на порту 3001
netstat -aon | find "3001"

# Завершить процесс (замените XXXX на PID)
taskkill /F /PID XXXX
```
Или запустите `stop-all.bat`

### ❌ "Backend недоступен" в браузере
- Убедитесь, что `start-backend.bat` запущен
- Проверьте ошибки в окне бэкенда
- Запустите `check-status.bat`

### ❌ Ошибки API ключей
- Убедитесь, что ключи правильно скопированы (без пробелов)
- Проверьте разрешения: Futures Trading должен быть включён
- IP ограничение: добавьте ваш IP в whitelist на бирже

### ❌ Антивирус блокирует .bat файлы
- Добавьте папку с ботом в исключения антивируса
- Или запустите файлы через `cmd /k start-backend.bat`

---

## 📊 Структура проекта

```
fundingarb-bot/
├── backend/
│   └── server.js          ← Node.js сервер (вся логика торговли)
├── src/
│   └── App.tsx            ← React интерфейс
├── .env.local             ← API ключи (НЕ делитесь этим файлом!)
├── install.bat            ← Установка
├── start-all.bat          ← Запуск всего
├── start-backend.bat      ← Запуск бэкенда
├── start-frontend.bat     ← Запуск фронтенда
├── start-pm2.bat          ← PM2 менеджер
├── stop-all.bat           ← Остановка
├── check-status.bat       ← Диагностика
├── ecosystem.config.js    ← PM2 конфиг
└── WINDOWS_SETUP.md       ← Эта инструкция
```

---

## ⚠️ ВАЖНЫЕ ПРЕДУПРЕЖДЕНИЯ

> 🔴 **РЕАЛЬНЫЕ ДЕНЬГИ**: Бот торгует реальными средствами на реальных биржах.
> 
> 🔴 **ТЕСТИРУЙТЕ СНАЧАЛА**: Начните с минимальной суммы (10-20 USDT) чтобы убедиться что всё работает корректно.
>
> 🔴 **РИСК ПОТЕРЬ**: Арбитраж не гарантирует прибыль. Учитывайте комиссии (~0.05-0.1%), проскальзывание цены и задержки API.
>
> 🔴 **БЕЗОПАСНОСТЬ**: Никогда не передавайте файл `.env.local` третьим лицам. Ограничьте API ключи по IP.
>
> 🔴 **ТОЛЬКО Futures**: API ключи должны иметь доступ только к Futures торговле, НЕ к выводу средств.

---

## 📞 Интерфейс бота

После запуска откройте: **http://localhost:5173**

| Раздел | Описание |
|--------|----------|
| **Арбитраж** | Текущие возможности: спред, биржи, прогноз прибыли |
| **Открытые позиции** | Активные сделки с PnL в реальном времени |
| **История** | Закрытые позиции и реализованный PnL |
| **Логи** | Подробный лог всех действий бота |
| **Настройки** | Изменение параметров без перезапуска |

Управление:
- ▶️ **Start** — запуск сканирования и торговли
- ⏸ **Pause** — пауза (позиции не закрываются)
- ⏹ **Stop** — полная остановка
- **Закрыть** — ручное закрытие любой позиции
