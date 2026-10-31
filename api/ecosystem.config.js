const fs = require('fs');
const path = require('path');

const logDir = process.env.PM2_LOG_DIR || '/var/log/pm2';

try {
  fs.mkdirSync(logDir, { recursive: true });
} catch {
  // Melhor esforço: o caminho pode não existir ou não ser gravável.
}

const apiLogs = {
  error_file: path.join(logDir, 'podcast-api-error.log'),
  out_file: path.join(logDir, 'podcast-api-out.log'),
};

const workerLogs = {
  error_file: path.join(logDir, 'podcast-worker-error.log'),
  out_file: path.join(logDir, 'podcast-worker-out.log'),
};

module.exports = {
  apps: [
    {
      name: 'podcast-api',
      script: 'dist/src/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      exp_backoff_restart_delay: 100,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      ...apiLogs,
      merge_logs: true,
      time: true,
    },
    {
      name: 'podcast-worker',
      script: 'dist/src/worker.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      exp_backoff_restart_delay: 100,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
      },
      ...workerLogs,
      merge_logs: true,
      time: true,
    },
  ],
};
