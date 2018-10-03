const path = require('path');

module.exports = () => {
  const modePath = path.resolve(__dirname, 'app/assets/js/');

  return {
    mode: 'production',
    entry: `./app/app.js`,
    output: {
      path: modePath,
      filename: 'bundle.app.js',
      publicPath: 'app/assets/js/',
    },
    performance: { hints: false },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          query: {
            presets: ['es2015'],
          },
        },
      ],
    },
    stats: {
      colors: true,
    },
    devtool: 'source-map',
  };
};
