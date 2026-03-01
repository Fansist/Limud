module.exports = {
  apps: [{
    name: 'limud',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000 -H 0.0.0.0',
    cwd: '/home/user/webapp',
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=384',
    },
    watch: false,
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '400M',
    autorestart: true,
    restart_delay: 2000,
    max_restarts: 5,
  }]
}
