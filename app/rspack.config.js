const { defineConfig } = require("@meteorjs/rspack");

module.exports = defineConfig((Meteor) => ({
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [
          {
            loader: "less-loader",
          },
        ],
        type: "css/auto",
      },
    ],
  },
}));
