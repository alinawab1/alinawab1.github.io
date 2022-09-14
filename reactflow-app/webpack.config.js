const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.join(__dirname, './dist'),
        filename: 'index_bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$|jsx/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.css$/,
                use: [
                    {loader: 'style-loader'},
                    {loader: 'css-loader',
                        options: {url: false} // tell css-loader to not package images referenced in css. perhaps re-activate this for base64 injection
                    },
                ] // use
            },
            {
                test: /\.svg$/,
                oneOf: [
                    {
                        resourceQuery: /file/, // size_35.svg?file
                        use: 'file-loader'
                    },
                    {
                        use: 'react-svg-loader'
                    }
                ]
            },
            {
                test: /\.html$/,
                use: {
                    loader: 'html-loader'
                    
                }
            }

        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html'
        })
    ]
}
