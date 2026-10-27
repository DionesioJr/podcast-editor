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
      error_file: '/var/log/pm2/podcast-api-error.log',
      out_file: '/var/log/pm2/podcast-api-out.log',
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
      error_file: '/var/log/pm2/podcast-worker-error.log',
      out_file: '/var/log/pm2/podcast-worker-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
