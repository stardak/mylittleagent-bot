module.exports = {
  apps: [{
    name: 'mylittleagent',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production'
    },
    // Restart if process uses too much memory
    kill_timeout: 5000,
    // Wait 5s between restart attempts
    restart_delay: 5000,
    // Max 10 restarts in 15 minutes
    max_restarts: 10,
    min_uptime: '30s',
    // Logs
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }]
};
