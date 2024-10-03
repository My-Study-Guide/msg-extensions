# MSG Extensions 
## 1️⃣ What does it do?
- issues warnings when users access websites that are unrelated to the topics they have set for learning.

## 2️⃣ How can execute? 
- yarn install 
- npm install chart.js --save
- npm install --save-dev babel-loader @babel/core @babel/preset-env
- yarn dev (for webpack bundling)
- test: chrome://extensions/

## 3️⃣ Done 
- 방문기록 최근 상위 5개 url 뽑아와서 출력
- Chrome Extension Icon 클릭할 때마다 실행 
- Q. url 페이지 내용 분석해서 유사도 뽑을 수 있는지. 

## 4️⃣ To do 
- 위 방식으로 안된다면 페이지 방문할 때마다 전체 내용을 html 에서 뽑고, 자동으로 서버로 보내게 해야함. 위 방법에 비해 서버 부하 up 
- 위 방식으로 된다면, 유사도를 측정할 주제를 바꾸는 방법도 구현해야함.

