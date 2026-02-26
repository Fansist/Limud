module.exports = {
  apps: [
    {
      name: 'limud',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '768M',
    },
  ],
};
