const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

let isDevEnv = (process.env.NODE_ENV === "development");

module.exports = {
    // Specify default mode in which Webpack will work
    mode: isDevEnv ? "development" : "production",

    // Entry point
    entry: "./src/index.js",

    // Output configuration
    output: {
        filename: "[name].[contenthash].js",
        chunkFilename: "[name].[contenthash].js",
        path: path.resolve(__dirname, "dist"),

        // Public URL of the output directory when referenced in a browser
        publicPath: "/"
    },

    optimization: {

        // SplitChunksPlugin (deduplicates repeatedly imported modules by putting them in separate chunks)
        // By default, it implicitly uses 2 cache groups (sets of rules) for app & vendor code.
        splitChunks: {
            // Which chunks to be selected for optimization (`initial`|`async`|`all`)
            // - `initial` - entry points;
            // - `async` - imported chunks;
            // - `all` = `initial` + `async`.
            chunks: "all"
        }
    },

    plugins: [
        // Plugin for automatic pre-build output folder clearing
        new CleanWebpackPlugin({ cleanStaleWebpackAssets: true }),

        // Plugin for generating an HTML file, which imports the bundle
        new HtmlWebpackPlugin({
            title: "Site",
            template: "./src/index.html"
        })
    ],

    // webpack-dev-server configuration
    devServer: {
        contentBase: path.resolve(__dirname, "dist"),

        // Serve index.html instead of 404 responses to enable HTML5 History API usage
        historyApiFallback: true,

        // Save served files to disk after they're built by dev server
        writeToDisk: true
    },

    // Source mapping tool (maps bundled code to original files and names)
    devtool: isDevEnv ? "inline-source-map" : undefined,

    // Settings for module processing
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env", "@babel/preset-react"],
                    // transform-runtime fixes "regeneratorRuntime is not defined" error,
                    // plugin-proposal-class-properties is required for using static properties
                    plugins: ["@babel/plugin-transform-runtime", "@babel/plugin-proposal-class-properties"]
                }
            },
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader"
                ]
            },
            {
                test: /\.(png|svg|jpg|gif|eot)$/,
                loader: "file-loader?name=static/icons/[name].[ext]"
            },
            {   // required for imports is Semantic UI
                test: /\.(ttf|woff|woff2)$/,
                loader: "file-loader?name=static/fonts/[name].[ext]"
            },
            {
                test: /\.worker\.js$/,
                // use: [{ loader: "worker-loader", options: { publicPath: "/workers/" } }]
                exclude: /(node_modules)/,
                loader: 'worker-loader',
                options: {
                    publicPath: '/scripts/workers/'
                }
            }
        ]
    },
};