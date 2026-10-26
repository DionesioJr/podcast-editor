module.exports = {
  apps: [
    {
      name: 'podcast-api',
      script: 'dist/src/main.js',
      autorestart: true,
      exp_backoff_restart_delay: 100,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/podcast-api-error.log',
      out_file: '/var/log/pm2/podcast-api-out.log',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'podcast-worker',
      script: 'dist/src/worker.js',
      autorestart: true,
      exp_backoff_restart_delay: 100,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/podcast-worker-error.log',
      out_file: '/var/log/pm2/podcast-worker-out.log',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
