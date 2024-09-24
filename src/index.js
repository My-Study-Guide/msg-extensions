import Chart from 'chart.js/auto';

// 차트를 생성하는 코드
const ctx = document.getElementById('concentration_chart').getContext('2d');

// 이미지 로드
const goodImage = new Image();
goodImage.src = '../images/good_small.png';

const warningImage = new Image();
warningImage.src = '../images/warning_small.png';

const dangerImage = new Image();
dangerImage.src = '../images/danger_small.png';

const myChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['Recent 4', 'Recent 3', 'Recent 2', 'Recent 1', 'Current'],
    datasets: [{
      label: 'Concentration',
      data: [60, 75, 85, 50, 35],
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
      pointRadius: 0 // 기본 점 숨김
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  },
  plugins: [{
    beforeDraw: (chart) => {
      const ctx = chart.ctx;
      const dataset = chart.data.datasets[0];
      const meta = chart.getDatasetMeta(0);

      dataset.data.forEach((value, index) => {
        const x = meta.data[index].x;
        const y = meta.data[index].y;

        let image;
        if (value >= 70) {
          image = goodImage;
        } else if (value >= 40) {
          image = warningImage;
        } else {
          image = dangerImage;
        }

        // 이미지 크기를 조정
        ctx.drawImage(image, x - 10, y - 10, 20, 20); // x, y 위치와 크기 조정
      });
    }
  }]
});

// 차트를 업데이트
myChart.update();

// Event listener for clicks on links in a browser action popup.
function onAnchorClick(event) {
  chrome.tabs.create({
    selected: true,
    url: event.srcElement.href
  });
  return false;
}

// Function to analyze
async function analyzeData() {
  // 입력 필드에서 주제 가져오기
  const topicInput = document.getElementById('topic');
  const topic = topicInput.value;

  // 최근 방문한 URL 목록을 가져오기
  const recentUrls = [];
  const historyItems = await new Promise((resolve) => {
    chrome.history.search(
      {
        text: '',
        startTime: Date.now() - 1000 * 60 * 60 * 24 * 7 // 지난 1주일
      },
      resolve
    );
  });

  // URL을 recentUrls 배열에 추가 (최대 5개)
  for (let i = 0; i < Math.min(5, historyItems.length); i++) {
    recentUrls.push(historyItems[i].url);
  }

  // POST 요청에 사용할 body 구성
  const requestBody = {
    topic: topic,
    urls: recentUrls
  };

  try {
    const response = await fetch('http://msg.hyezzang.com:7070/analyze/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const responseData = await response.json(); // 응답을 JSON으로 변환
    console.log('Success:', responseData); // 성공적으로 받은 데이터 처리

    // 응답 데이터를 HTML에 출력 및 차트 업데이트
    displayResponse(responseData);

  } catch (error) {
    console.error('Error:', error); // 에러 처리
  }
}

// Function to display the response data in the HTML and update the chart
function displayResponse(data) {
  const responseDiv = document.getElementById('responseDiv');
  responseDiv.innerHTML = ''; // 기존 내용 삭제

  // 응답 데이터가 올바른지 확인 후 처리
  if (data && data.data && data.data.results) {
    const results = data.data.results;

    // scores 배열로 score 값 추출
    const scores = results.map(result => result.score * 100); // 0.XX 값을 퍼센트로 변환

    // 차트의 데이터 업데이트
    myChart.data.datasets[0].data = scores.reverse(); // scores 배열로 업데이트
    myChart.update(); // 차트 업데이트

    // 응답 데이터를 HTML에 추가
    results.forEach(item => {
      const p = document.createElement('p');
      p.textContent = `URL: ${item.url}, Score: ${parseInt(item.score*100)}, Summary: ${item.summary}`; 
      responseDiv.appendChild(p); // div에 추가
    });
  } else {
    const p = document.createElement('p');
    p.textContent = 'Unexpected data format'; // 예외 처리
    responseDiv.appendChild(p); // div에 추가
  }
}

// Given an array of URLs, build a DOM list of those URLs in the browser action popup.
function buildPopupDom(divName, data) {
  let popupDiv = document.getElementById(divName);
  let ul = document.createElement('ul');
  popupDiv.appendChild(ul);

  // 라벨 배열 정의
  const labels = ['[Current]', '[Recent 1]', '[Recent 2]', '[Recent 3]', '[Recent 4]'];

  for (let i = 0; i < data.length; i++) {
    let a = document.createElement('a');
    a.href = data[i];
    a.appendChild(document.createTextNode(data[i])); // URL만 추가
    a.addEventListener('click', onAnchorClick);

    let li = document.createElement('li');
    
    // 라벨을 클릭할 수 없도록 span 요소로 추가
    let labelSpan = document.createElement('span');
    labelSpan.textContent = `${labels[i]}`; // 라벨 추가
    labelSpan.style.cursor = 'default'; // 커서를 기본으로 설정하여 클릭할 수 없음을 나타냄
    li.appendChild(labelSpan); // 라벨 추가
    li.appendChild(a); // URL 추가

    ul.appendChild(li);
  }
}

// Search history to find up to five links that a user has visited in the last week,
// and show those links in a popup.
function buildTypedUrlList(divName) {
  // To look for history items visited in the last week,
  // subtract a week of milliseconds from the current time.
  let millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
  let oneWeekAgo = new Date().getTime() - millisecondsPerWeek;

  // Search for all history items from the past week.
  chrome.history.search(
    {
      text: '', // Return every history item
      startTime: oneWeekAgo // that was accessed less than one week ago
    },
    function (historyItems) {
      // Extract URLs from the historyItems and limit the list to 5 items.
      let recentUrls = historyItems.slice(0, 5).map(item => item.url);

      // Pass the list of URLs to the function that builds the popup DOM.
      buildPopupDom(divName, recentUrls);
    }
  );
}

// This function is triggered when the popup is loaded.
document.addEventListener('DOMContentLoaded', function () {
  buildTypedUrlList('typedUrl_div');

  // 버튼 클릭 시 분석 함수 호출
  analyzeData(); // 팝업 로드 시 자동으로 분석 수행

  // Create a div to display the response
  const responseDiv = document.createElement('div');
  responseDiv.id = 'responseDiv';
});

// 페이지가 로드될 때, 저장된 텍스트를 불러오기
document.addEventListener('DOMContentLoaded', () => {
  const topicInput = document.getElementById('topic');
  const savedTopic = localStorage.getItem('studyTopic');
  if (savedTopic) {
    topicInput.value = savedTopic;
  }

  topicInput.addEventListener('input', () => {
    localStorage.setItem('studyTopic', topicInput.value);
  });
});