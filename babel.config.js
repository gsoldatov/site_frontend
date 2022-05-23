// Babel configuration for running tests
module.exports = {
  "env": {
    "test": {
        presets: ['@babel/preset-env', '@babel/preset-react'],
        // transform-runtime fixes "regeneratorRuntime is not defined" error,
        plugins: ["@babel/plugin-transform-runtime"]
    //   "plugins": ["@babel/plugin-transform-modules-commonjs"]
    }
  }
};