module.exports = {
  servers: {
    one: {
      host: 'v22015123209630421.goodsrv.de',
      username: 'maroggo',
    }
  },

  app: {
    name: 'Rechords',
    path: '../app',

    servers: {
      one: {},
    },

    buildOptions: {
      serverOnly: true,
      debug: false
    },

    env: {
      ROOT_URL: 'http://hoelibu.ch',
      PORT: 3333,
      MONGO_URL: 'mongodb://localhost/meteor'
    },

    docker: {
      image: 'abernix/meteord:node-12-base',
    },

    // Show progress bar while uploading bundle to server
    // You might need to disable it on CI servers
    enableUploadProgressBar: true
  },

  /* Collides with already-running nginx.
  proxy: {
    domains: 'hoelibu.ch,www.hoelibu.ch'
  },
  */

  mongo: {
    version: '3.4.1',
    servers: {
      one: {}
    }
  }
};
