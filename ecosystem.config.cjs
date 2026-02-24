// PM2 Ecosystem Config — FundingArb Bot
// Запуск: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: "fundingarb-backend",
      script: "backend/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      env_file: ".env.local",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      max_restarts: 10,
      min_uptime: "30s",
      restart_delay: 3000,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      out_file: "logs/backend-out.log",
      error_file: "logs/backend-err.log",
      merge_logs: true,
      interpreter: "node",
    },
  ],
};
