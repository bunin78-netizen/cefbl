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
- Остановка обоих процессов: `Ctrl + C`

### Раздельный запуск

```bash
npm run start:backend
npm run start:frontend
```

### Примечание для Windows

`.bat`-скрипты сохранены и продолжают работать. Новый вариант через `npm run ...` кроссплатформенный и одинаковый для Linux/Windows.
