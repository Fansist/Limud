module.exports = {
  apps: [{
    name: 'limud',
    // v9.6.3: Use server.js which auto-detects standalone build
    // Fixes: "next start" does not work with "output: standalone"
    script: 'server.js',
    cwd: '/home/user/webapp',
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      HOSTNAME: '0.0.0.0',
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
