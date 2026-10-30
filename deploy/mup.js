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
      // DOMAIN also names the container, so it stays as it is; ROOT_URL can
      // differ, e.g. the punycode host the OAuth redirect is registered for.
      ROOT_URL: process.env.ROOT_URL || 'https://' + process.env.DOMAIN,
      MONGO_URL: 'mongodb://localhost/meteor',
      // Without these the Jubla-DB login stays switched off.
      ...(process.env.JUBLADB_CLIENT_ID && {
        JUBLADB_URL: process.env.JUBLADB_URL,
        JUBLADB_CLIENT_ID: process.env.JUBLADB_CLIENT_ID,
        JUBLADB_CLIENT_SECRET: process.env.JUBLADB_CLIENT_SECRET,
      }),
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
