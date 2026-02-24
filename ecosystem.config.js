// PM2 Ecosystem Config — FundingArb Bot
// Запуск: pm2 start ecosystem.config.js
// Статус: pm2 status
// Логи:   pm2 logs fundingarb-backend

module.exports = {
  apps: [
    {
      name: 'fundingarb-backend',
      script: 'backend/server.js',
      
      // Переменные окружения
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      
      // Загрузка .env.local
      env_file: '.env.local',
      
      // Автоперезапуск при падении
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      
      // Перезапуск при ошибке (макс 10 раз за 30 сек)
      max_restarts: 10,
      min_uptime: '30s',
      restart_delay: 3000,
      
      // Логи
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: 'logs/backend-out.log',
      error_file: 'logs/backend-err.log',
      merge_logs: true,
      
      // Для Windows нужно явно указать интерпретатор
      interpreter: 'node',
    }
  ]
};
