const { defineConfig } = require("@meteorjs/rspack");

// The `less` Atmosphere build plugin is gone; LESS now goes through
// less-loader. `type: "css/auto"` lets rspack decide between a stylesheet and
// a CSS module based on the filename.
module.exports = defineConfig(() => ({
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [{ loader: "less-loader" }],
        type: "css/auto",
      },
    ],
  },
}));
