module.exports = {
  servers: {
    one: {
      host: 'v22015123209630421.goodsrv.de',
      username: 'maroggo',
    }
  },

  app: {
    // TODO: change app name and path
    name: 'Rechords',
    path: '../app',

    servers: {
      one: {},
    },

    buildOptions: {
      serverOnly: true,
    },

    env: {
      ROOT_URL: 'http://beta.hoelibu.ch',
      PORT: 3333,
      MONGO_URL: 'mongodb://localhost/meteor'
    },

    // ssl: { // (optional)
    //   // Enables let's encrypt (optional)
    //   autogenerate: {
    //     email: 'email.address@domain.com',
    //     // comma separated list of domains
    //     domains: 'website.com,www.website.com'
    //   }
    // },

    docker: {
      // change to 'abernix/meteord:base' if your app is using Meteor 1.4 - 1.5
      image: 'abernix/meteord:node-8.4.0-base',
    },

    // Show progress bar while uploading bundle to server
    // You might need to disable it on CI servers
    enableUploadProgressBar: true
  },

  mongo: {
    version: '3.4.1',
    servers: {
      one: {}
    }
  }
};
