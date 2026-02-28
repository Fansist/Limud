module.exports = {
  apps: [{
    name: 'limud',
    script: 'npx',
    args: 'next dev -p 3000 -H 0.0.0.0',
    cwd: '/home/user/webapp',
    env: {
      NODE_ENV: 'development',
      NODE_OPTIONS: '--max-old-space-size=768',
    },
    watch: false,
    instances: 1,
    exec_mode: 'fork',
  }]
}
