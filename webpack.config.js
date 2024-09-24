// npm install --save-dev babel-loader @babel/core @babel/preset-env
// npx webpack --mode development
const path = require('path');

module.exports = {
  mode: 'development',  
  entry: './src/index.js', // 진입점 파일
  devtool: 'source-map', // 소스맵 사용
  output: {
    path: path.resolve(__dirname, 'dist'), // 번들된 파일의 출력 경로
    filename: 'popup.js', // 번들된 파일 이름
  },
  module: {
    rules: [
      {
        test: /\.js$/, // 모든 .js 파일을 대상으로
        exclude: /node_modules/, // node_modules 폴더는 제외
        use: {
          loader: 'babel-loader', // Babel 로더 사용
          options: {
            presets: ['@babel/preset-env'] // 최신 JavaScript 변환을 위한 프리셋
          }
        }
      }
    ]
  }
};
