module.exports = {
  servers: {
    one: {
      host: process.env.SSH_HOST,
      username: process.env.SSH_USER,
      pem: 'id_rsa_github_actor',
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
      image: 'abernix/meteord:node-12-base',
    },

    enableUploadProgressBar: false
  },

  mongo: {
    version: '3.4.1',
    servers: {
      one: {}
    }
  }
};
