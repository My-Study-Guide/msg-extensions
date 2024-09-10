module.exports = {
    mode: 'development',  
    entry: './src/index.js', 
    devtool: 'source-map',
    output: {
      path: __dirname + '/dist',
      filename: 'popup.js',
    },
    // 기타 설정
  };