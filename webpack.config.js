module.exports = {
    mode: 'development',  
    entry: './src/index.js', 
    devtool: 'source-map',
    output: {
      path: __dirname + '/dist',
      filename: 'main.js',
    },
    // 기타 설정
  };