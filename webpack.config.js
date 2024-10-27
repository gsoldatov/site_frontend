const webpack = require("webpack");
const path = require("path");

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const TerserWebpackPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const HLJSUsedLanguages = require("./src/util/markdown/hljs-used-languages.json");


// Get settings from environment variables
//
// NOTE: to set a variable in Powershell, use `$Env:<variable> = <string-value>`;
// to clear an existing variable, use `$Env:<variable> = ""`.
let isDevEnv = (process.env.NODE_ENV === "development");
let bundleAnalyze = (process.env.BUNDLE_ANALYZE);


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

    resolve: {
        // Possible extensions of module files
        extensions: [".ts", ".tsx", ".js", ".jsx"]
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
        },

        minimizer: isDevEnv ? undefined : [
            // Minimize CSS & clear comments
            new CssMinimizerPlugin({
                minimizerOptions: {
                    preset: [
                        "default",
                        { discardComments: { removeAll: true }}
                    ]
                },
            }),

            // Clear comments from JS code
            new TerserWebpackPlugin({
                terserOptions: {
                    output: {
                        comments: false
                    }                    
                },
                extractComments: false
            })
        ]
    },


    plugins: [
        // Generate a treemap chart on build
        new BundleAnalyzerPlugin({
            analyzerMode: bundleAnalyze ? "static" : "disabled"
        }),

        // Shake off unused highlight.js languages
        new webpack.ContextReplacementPlugin(
            /highlight\.js\/lib\/languages$/,
            new RegExp(`^./(${HLJSUsedLanguages.join('|')})$`)
        ),

        // Shake off unused moment.js locales
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en|ru/),

        // Extract CSS into separate files (required for CssMinimizerPlugin)
        new MiniCssExtractPlugin({
            filename: "[name].[contenthash].css",
            chunkFilename: "[name].[contenthash].css"
        }),

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
        static: {
            directory: path.resolve(__dirname, "dist"),
        },

        // Serve index.html instead of 404 responses to enable HTML5 History API usage
        historyApiFallback: true,

        devMiddleware: {
            // Save served files to disk after they're built by dev server
            writeToDisk: true
        }
    },


    // Source mapping tool (maps bundled code to original files and names)
    devtool: isDevEnv ? "inline-source-map" : undefined,


    // Settings for module processing
    module: {
        rules: [
            isDevEnv && {
                // Enable source map loader in dev env in order to generate source maps
                // (Typescript processing, unlike regulate JS, is done using a separate loader)
                enforce: "pre",     // runs before other loaders
                test: /\.[jt]sx?$/, 
                exclude: /node_modules/, 
                loader: "source-map-loader" 
            },

            {
                test: /\.[jt]sx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },

            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,    // extracts CSS into separate files (must be placed BEFORE css-loader)
                    // "style-loader",      // injects CSS into js files (not compatible with MiniCssExtractPlugin)
                    "css-loader"            // resolves CSS imports in js files
                ]
            },
            {
                test: /\.(png|svg|jpg|gif|eot)$/,
                // loader: "file-loader?name=static/icons/[name].[ext]"
                type: "asset/resource",
                generator: {
                    filename: "static/icons/[name].[ext]"
                }
            },
            {   // required for imports from Semantic UI
                test: /\.(ttf|woff|woff2)$/,
                type: "asset/resource",
                generator: {
                    filename: "static/fonts/[name].[ext]"
                }
            },
            {
                test: /\.worker\.js$/,
                exclude: /(node_modules)/,
                loader: "worker-loader",
                options: {
                    filename: "[name].[contenthash].js"
                }
            }
        ]
    },
};
