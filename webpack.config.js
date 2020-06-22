const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

let isDevEnv = (process.env.NODE_ENV === "development");

module.exports = {
    mode: isDevEnv ? "development" : "production",
    entry: "./src/index.js",

    output: {
        filename: "[name].[contenthash].js",
        chunkFilename: "[name].[contenthash].js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "/"
    },

    optimization: {
        splitChunks: {
            chunks: "all"
        }
    },

    plugins: [
        new CleanWebpackPlugin({ cleanStaleWebpackAssets: true }),
        new HtmlWebpackPlugin({
            title: "Site",
            template: "./src/index.html"
        })
    ],

    devServer: {
        contentBase: path.resolve(__dirname, "dist"),
        historyApiFallback: true,
        writeToDisk: true
    },

    devtool: isDevEnv ? "inline-source-map" : undefined,

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env", "@babel/preset-react"],
                    plugins: ["@babel/plugin-transform-runtime"]
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
                test: /\.(png|svg|jpg|gif)$/,
                loader: "file-loader?name=/static/icons/[name].[ext]"
            },
        ]
    },
};