// 1. 엔트리 포인트 설정
// 2. rules에 로더 설정 및 순서 배치(뒤의 요소부터 번들링에 반영)
// 3. build 위치 및 개발 서버 셋팅
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

// dev/production 분리용
require('dotenv').config()

module.exports = {
    mode: process.env.mode,
    entry: './src/index.tsx',
    output: {
        path: __dirname + '/build',
        filename: 'bundle.js',
        publicPath: '/'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.css'],
        plugins: [new TsconfigPathsPlugin()]
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: '/node_modules/',
                loader: 'babel-loader'
            },
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_module/,
                use: {
                    loader: "ts-loader",
                },
            },
            {
                test: /\.css$/,
                use: [
                    { loader: 'style-loader' },
                    { loader: 'css-loader' }
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: 'public/index.html',
            hash: true,
            favicon: 'public/favicon.ico'
        }),
        new webpack.DefinePlugin({
            port: process.env.port,
            "process.env" : JSON.stringify(process.env)
        })
    ],
    devServer: {
        host: process.env.host,
        port: process.env.port,
        static: {
            directory: __dirname + '/public',
        },
        compress: true,
        historyApiFallback: true,
        hot: true
    }
}