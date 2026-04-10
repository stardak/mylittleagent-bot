module.exports = {
  apps: [
    {
      name: 'mylittleagent',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      kill_timeout: 5000,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '30s',
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      // ── Kronos Financial Foundation Model ──────────────────────────────
      // Pre-trained on 45 global exchanges. Acts as a directional filter:
      // if Kronos disagrees with a technical signal (>60% confidence),
      // the trade is skipped. Fail-open: bot trades on technicals if down.
      name: 'kronos-service',
      script: 'kronos-service/start.sh',
      interpreter: 'bash',
      instances: 1,
      autorestart: true,
      watch: false,
      // Model requires ~2-4GB RAM; give it room
      max_memory_restart: '8G',
      kill_timeout: 10000,
      restart_delay: 15000,   // wait 15s on crash — model reload is slow
      max_restarts: 5,
      min_uptime: '60s',
      error_file: './logs/kronos-error.log',
      out_file: './logs/kronos-output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      env: {
        KRONOS_MODEL: 'small',   // mini | small | base
        KRONOS_PORT: '5001',
      },
    },
  ]
};

