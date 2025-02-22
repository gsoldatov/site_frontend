import type { Config } from "jest";


// Jest configuration
const config: Config = {
    // // Jest configuration template, which is used as a base
    // NOTE: not required, because it only sets `transform` property, which is overriden below
    // preset: "ts-jest",

    // Environment, in which tests are run
    // NOTE: Jest v29 requires `jest-environment-jsdom` installed separately to support localStorage
    testEnvironment: "jsdom",

    // List of directories, which are scanned for test files
    roots: ["tests"],
    
    // Transpile files to make them usable in tests
    // (current prject configuration treats .js / .ts files as written using CJS modules, and so does Jest;
    // transpilation allows testing app (and using test utils) with ES modules)
    transform: {
        "^.+\\.[jt]sx?$": "ts-jest",
    },
    
    // Map files to test stubs
    moduleNameMapper: {
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/tests/_mocks/file-mock.js",
      "\\.(css|less)$": "<rootDir>/tests/_mocks/style-mock.js",
      "parse-markdown\\.worker(?:\\.jsx?)?$": "<rootDir>/tests/_mocks/markdown-parse-worker-mock.js"
    },

    // Run additional imports before tests are executed
    setupFilesAfterEnv: [
      "./jest-setup.ts"
    ]
};

module.exports = config;
