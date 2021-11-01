module.exports = {
  apps: [{
    name: 'CSC648-T3-prod',
    script: '/opt/prod/source/application/node/app.js',
    env  : {
      PORT: 3000,
      DB_USER: "admin",
      DB_PASSWORD: "admin-648T3",
      DATABASE: "csc648t3_production"
    }
   }],
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'csc648team3.ddns.net',
      key: '~/.ssh/sshKey.pem',
      ref: 'origin/master',
      repo: 'git@github.com:CSC-648-SFSU/csc648-03-fa21-team03.git',
      path: '/opt/prod',
      'post-deploy': 'cd /opt/prod/source/application/node && npm install && pm2 startOrRestart ecosystem_prod.config.js',
      env  : {
        PORT: 3000,
        DB_USER: "admin",
        DB_PASSWORD: "admin-648T3",
        DATABASE: "csc648t3_production"
      }
    }
  }
}

