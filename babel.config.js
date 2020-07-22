// Babel configuration for running tests
module.exports = {
  "env": {
    "test": {
        presets: ['@babel/preset-env', '@babel/preset-react'],
        // transform-runtime fixes "regeneratorRuntime is not defined" error,
        // plugin-proposal-class-properties is required for using static properties
        plugins: ["@babel/plugin-transform-runtime", "@babel/plugin-proposal-class-properties"]
    //   "plugins": ["@babel/plugin-transform-modules-commonjs"]
    }
  }
};