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
          // Для node_modules — обычные CSS без modules
          {
            test: /\.css$/i,
            include: /node_modules/,
            use: [
              MiniCssExtractPlugin.loader,
              'css-loader'
            ],
          },
          // Для своего кода — CSS Modules
          {
            test: /\.css$/i,
            exclude: /node_modules/,
            use: [
              MiniCssExtractPlugin.loader,
              {
                loader: 'css-loader',
                options: {
                  importLoaders: 1,
                  modules: true,
                }
              }
            ],
          },
          {
            test: /\.(sa|sc)ss$/i,
            use: [
              MiniCssExtractPlugin.loader,
              {
                loader: 'css-loader',
                options: {
                  importLoaders: 2,
                  modules: true,
                }
              },
              'sass-loader'
            ],
          },
          {
            test: /\.(png|svg|jpg|jpeg|gif)$/i,
            type: 'asset/inline',
          },
        ],
      },
      
    devtool: devMode? 'inline-source-map' : 'source-map',
    plugins: [new MiniCssExtractPlugin()],
    resolve: {
        extensions: ['.js', '.css'],
        modules: [path.resolve(__dirname, 'node_modules'), 'node_modules']
      },      
    devServer: {
        static: {
            directory: __dirname,
        },
        compress: true,
        port: 3000,
    }
};