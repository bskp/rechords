require('dotenv').config();
module.exports = {
  servers: {
    one: {
      host: process.env.SSH_HOST,
      username: process.env.SSH_USER,
      pem: '~/.ssh/id_rsa_github_actor',
    }
  },

  app: {
    name: process.env.DOMAIN.replaceAll('.', '-'),
    path: '../app',

    servers: {
      one: {},
    },

    buildOptions: {
      serverOnly: true,
      debug: false
    },

    env: {
      PORT: process.env.PROXY_PORT,
      ROOT_URL: 'https://' + process.env.DOMAIN,
      MONGO_URL: 'mongodb://localhost/meteor'
    },

    docker: {
      image: 'zodern/meteor:latest',
    },

    enableUploadProgressBar: false
  },

  mongo: {
    version: '5.0.26',
    servers: {
      one: {}
    }
  }
};
