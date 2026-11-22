// PM2 process manager config: keeps the Lattice backend (and its simulator)
// running persistently, restarting on crash. Usage:
//   pm2 start ecosystem.config.cjs
//   pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: 'lattice-api',
      script: 'apps/api/dist/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOST: '0.0.0.0',
        DATABASE_PATH: './data/lattice.db',
        SIMULATION_ENABLED: 'true',
        SEED_ON_START: 'true',
      },
    },
  ],
};