const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const devMode = process.env.NODE_ENV !== "production";

module.exports = {
    entry: './src/index.js',
    experiments: {
        outputModule: true,
    },
    output: {
        filename: 'item.js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            type: 'module'
        },
        clean:true
    },
    module: {
        rules: [
            {
                test: /\.(sa|sc|c)ss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            importLoaders: 2,
                            modules: true
                        }
                    }
                ]
            },
        ],
    },
    devtool: devMode? 'inline-source-map' : 'source-map',
    plugins: [new MiniCssExtractPlugin()],

    devServer: {
        static: {
            directory: __dirname,
        },
        compress: true,
        port: 3000,
    }
};