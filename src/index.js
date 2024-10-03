import Chart from 'chart.js/auto';

// 로컬 스토리지에서 저장된 데이터 가져오기
let savedData = localStorage.getItem('chartData');

// 만약 저장된 데이터가 있으면 JSON으로 변환하고, 없으면 기본 샘플 데이터를 사용
let chartData = savedData ? JSON.parse(savedData) : [60, 75, 85, 50, 35];

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
      data: chartData,
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

// Event listener for topic setting button click
const analyzeButton = document.getElementById('analyze_button');
analyzeButton.addEventListener('click', analyzeData);

// Function to analyze data
async function analyzeData() {
  const topicInput = document.getElementById('topic');
  const topic = topicInput.value;

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

  for (let i = 0; i < Math.min(5, historyItems.length); i++) {
    recentUrls.push(historyItems[i].url);
  }

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

    const responseData = await response.json(); 
    console.log('Success:', responseData);

    // 응답 데이터를 차트와 HTML에 출력
    displayResponse(responseData);

    // 받은 차트 데이터를 로컬 스토리지에 저장
    saveChartData(responseData.data.results.map(result => result.score * 100)); 

    // 응답 데이터를 로컬 스토리지에 저장
    saveResponseData(responseData);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to save chart data to localStorage
function saveChartData(data) {
  localStorage.setItem('chartData', JSON.stringify(data));
}

// Function to save response data to localStorage
function saveResponseData(data) {
  localStorage.setItem('responseData', JSON.stringify(data));
}

// Function to display the response data in the HTML and update the chart
function displayResponse(data) {
  const responseDiv = document.getElementById('responseDiv');
  responseDiv.innerHTML = ''; // 기존 내용 삭제

  if (data && data.data && data.data.results) {
    const results = data.data.results;
    const scores = results.map(result => result.score * 100); 

    // 차트 데이터 업데이트
    myChart.data.datasets[0].data = scores.reverse();
    myChart.update(); 

    results.forEach(item => {
      const p = document.createElement('p');
      p.textContent = `URL: ${item.url}, Score: ${parseInt(item.score * 100)}, Summary: ${item.summary}`;
      responseDiv.appendChild(p);
    });
  } else {
    const p = document.createElement('p');
    p.textContent = 'Unexpected data format';
    responseDiv.appendChild(p);
  }
}

// Build a DOM list of visited URLs in the last week
function buildPopupDom(divName, data) {
  let popupDiv = document.getElementById(divName);
  let ul = document.createElement('ul');
  popupDiv.appendChild(ul);

  const labels = ['[Current]', '[Recent 1]', '[Recent 2]', '[Recent 3]', '[Recent 4]'];

  for (let i = 0; i < data.length; i++) {
    let a = document.createElement('a');
    a.href = data[i];
    a.appendChild(document.createTextNode(data[i]));
    a.addEventListener('click', onAnchorClick);

    let li = document.createElement('li');

    let labelSpan = document.createElement('span');
    labelSpan.textContent = `${labels[i]}`;
    labelSpan.style.cursor = 'default';
    li.appendChild(labelSpan);
    li.appendChild(a);

    ul.appendChild(li);
  }
}

// Search history to show up to five visited links
function buildTypedUrlList(divName) {
  let millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
  let oneWeekAgo = new Date().getTime() - millisecondsPerWeek;

  chrome.history.search(
    {
      text: '',
      startTime: oneWeekAgo
    },
    function (historyItems) {
      let recentUrls = historyItems.slice(0, 5).map(item => item.url);
      buildPopupDom(divName, recentUrls);
    }
  );
}

// This function is triggered when the popup is loaded.
document.addEventListener('DOMContentLoaded', function () {
  buildTypedUrlList('typedUrl_div');

  const responseDiv = document.createElement('div');
  responseDiv.id = 'responseDiv';

  // 페이지가 로드될 때 로컬 스토리지에서 저장된 응답 데이터를 불러와 출력
  const savedResponseData = localStorage.getItem('responseData');
  if (savedResponseData) {
    const parsedResponseData = JSON.parse(savedResponseData);
    displayResponse(parsedResponseData);
  }
});

// 페이지가 로드될 때 저장된 주제를 불러오기
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
