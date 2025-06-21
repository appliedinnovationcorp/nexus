const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: './src/index.tsx',
  
  devServer: {
    port: 3005,
    historyApiFallback: true,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: {
              noEmit: false,
            },
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },

  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        adminPortal: isDevelopment 
          ? 'adminPortal@http://localhost:3001/remoteEntry.js'
          : 'adminPortal@https://admin-portal.yourdomain.com/remoteEntry.js',
        employeePortal: isDevelopment
          ? 'employeePortal@http://localhost:3002/remoteEntry.js'
          : 'employeePortal@https://employee-portal.yourdomain.com/remoteEntry.js',
        clientPortal: isDevelopment
          ? 'clientPortal@http://localhost:3003/remoteEntry.js'
          : 'clientPortal@https://client-portal.yourdomain.com/remoteEntry.js',
        developerPortal: isDevelopment
          ? 'developerPortal@http://localhost:3004/remoteEntry.js'
          : 'developerPortal@https://developer-portal.yourdomain.com/remoteEntry.js',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.2.0',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.2.0',
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^6.20.0',
        },
        'react-query': {
          singleton: true,
          requiredVersion: '^3.39.3',
        },
        zustand: {
          singleton: true,
          requiredVersion: '^4.4.6',
        },
      },
    }),
    
    new HtmlWebpackPlugin({
      template: './public/index.html',
      title: 'B2B Platform - Shell',
    }),
  ],

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
