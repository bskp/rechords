const { defineConfig } = require("@meteorjs/rspack");
const rspack = require("@rspack/core");

/**
 * Browsers that support `light-dark()` natively. The theme in
 * client/variables.import.less is built on it: html.dark sets only
 * `color-scheme: dark` and every colour token is a light-dark() pair, so the
 * browser resolves the theme from the colour scheme alone.
 *
 * Lightning CSS otherwise downlevels light-dark() into a
 * var(--lightningcss-light) / var(--lightningcss-dark) polyfill. That polyfill
 * cannot express "follow a colour-scheme set by a class": it emits the dark
 * half under html.dark and nothing for the default state, so in light mode both
 * custom properties are unset, both var() fall back, and every token collapses
 * to two concatenated colours -- `#dd4407#ffcb00` -- which is invalid and drops
 * the colour entirely. That is what shipped unthemed.
 *
 * These targets are deliberately scoped to the CSS minimizer rather than set
 * as a package.json browserslist, which would also move swc's JavaScript
 * output. The app already required native light-dark(): the classic bundler
 * never transpiled it.
 *
 * This alone is not enough -- `meteor build` still downlevelled until
 * client/variables.import.less also declared `color-scheme: light` on html.
 * Both are needed; see the note there.
 */
const MODERN_BROWSERS = [
  "chrome >= 123",
  "edge >= 123",
  "firefox >= 120",
  "safari >= 17.5",
  "ios_saf >= 17.5",
];

module.exports = defineConfig(() => ({
  module: {
    rules: [
      // The `less` Atmosphere build plugin is gone; LESS now goes through
      // less-loader. `type: "css/auto"` lets rspack decide between a
      // stylesheet and a CSS module based on the filename.
      {
        test: /\.less$/,
        use: [{ loader: "less-loader" }],
        type: "css/auto",
      },
    ],
  },
  optimization: {
    // Spelling out both minimizers replaces rspack's defaults, which would
    // otherwise run Lightning CSS against its own much older target list.
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin(),
      new rspack.LightningCssMinimizerRspackPlugin({
        minimizerOptions: { targets: MODERN_BROWSERS },
      }),
    ],
  },
}));
