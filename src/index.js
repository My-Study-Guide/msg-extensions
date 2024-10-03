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

// 이미지가 모두 로드된 후에 차트를 생성하도록 보장
const imagesLoaded = Promise.all([
  new Promise((resolve) => { goodImage.onload = resolve; }),
  new Promise((resolve) => { warningImage.onload = resolve; }),
  new Promise((resolve) => { dangerImage.onload = resolve; })
]);

imagesLoaded.then(() => {
  const myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Recent 4', 'Recent 3', 'Recent 2', 'Recent 1', 'Current'],
      datasets: [{
        label: 'Concentration',
        data: chartData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // 채워질 영역의 색상
        borderWidth: 4,
        pointRadius: 0, // 기본 점 숨김
        fill: true // 선 아래 영역을 채움
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
      afterDraw: (chart) => { // beforeDraw에서 afterDraw로 변경
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

  // 차트를 초기 업데이트
  myChart.update();
});

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

  // 이전 fetch 요청에서 사용된 URLs를 불러오기
  const previousFetchUrls = getLastFetchUrls();

  // 현재 fetch 요청에 사용된 URLs과 이전 URLs을 비교하여 새로운 URLs 찾기
  const newUrls = recentUrls.filter(url => !previousFetchUrls.includes(url));

  const lastTopic = localStorage.getItem('lastTopic');
  // 새로운 URLs이 없으면 알림을 표시하고 fetch 요청을 건너뜁니다.
  if (newUrls.length === 0 && lastTopic === topic) {
    alert("No new url and topic. Skip fetch request.");
    return;
  }

  // newUrls의 데이터 타입이 recentUrls와 동일한지 확인 (배열 of strings)
  if (!Array.isArray(newUrls) || !newUrls.every(url => typeof url === 'string')) {
    console.error("newUrls 데이터 타입이 올바르지 않습니다.");
    alert("Invalid newUrls data. Cannot proceed with fetch request.");
    return;
  }
  
  let urlsToUse;

  if (lastTopic !== topic) {
    // 주제가 변경된 경우: recentUrls를 사용
    urlsToUse = recentUrls;
  } else {
    // 주제가 동일한 경우: newUrls를 사용
    urlsToUse = newUrls;
  }
  const requestBody = {
    topic: topic,
    urls: urlsToUse // 변경된 부분: recentUrls 대신 urlsToUse를 보냄
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

    // 응답 데이터를 로컬 스토리지에 저장
    const responseScores = responseData.data.results.map(result => result.score * 100);
    saveChartData(responseScores);
    saveResponseData(responseData);

    // 마지막 fetch 요청에 사용된 URLs과 topic를 저장
    saveLastFetchUrls(recentUrls);
    localStorage.setItem('lastTopic', topicInput.value);

    // 데이터가 저장된 후 차트와 HTML을 업데이트
    loadAndDisplayData();

  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to save chart data to localStorage with rolling window logic
function saveChartData(newData) {
  // Retrieve existing chartData from localStorage
  let existingData = localStorage.getItem('chartData');
  existingData = existingData ? JSON.parse(existingData) : [];

  const n = newData.length; // Number of new data points
  const maxTotal = 5; // Maximum number of data points to keep

  // Calculate how many old data points to keep
  const keepOld = maxTotal - n;

  // Ensure keepOld is non-negative
  const oldDataToKeep = keepOld > 0 ? existingData.slice(-keepOld) : [];

  // Combine old data points to keep with new data points
  const updatedData = [...oldDataToKeep, ...newData];

  // Ensure the total length does not exceed maxTotal
  const finalData = updatedData.slice(-maxTotal);

  // Save the updated chartData back to localStorage
  localStorage.setItem('chartData', JSON.stringify(finalData));
}


// Function to save response data to localStorage
function saveResponseData(newData) {
  // Retrieve existing responseData from localStorage
  let existingData = localStorage.getItem('responseData');
  existingData = existingData ? JSON.parse(existingData) : { data: { results: [] } };

  // Determine the number of new data items
  const newResults = newData.data.results;

  // Combine new data with existing data, placing new data first
  const combinedResults = [...newResults, ...existingData.data.results];

  // Ensure the total length does not exceed 5
  const finalResults = combinedResults.slice(0, 5);

  // Construct the final data structure
  const finalData = { data: { results: finalResults } };

  // Save the updated responseData back to localStorage
  localStorage.setItem('responseData', JSON.stringify(finalData));
}

// Function to save the last fetch URLs to localStorage
function saveLastFetchUrls(urls) {
  localStorage.setItem('lastFetchUrls', JSON.stringify(urls));
}

// Function to get the last fetch URLs from localStorage
function getLastFetchUrls() {
  const savedUrls = localStorage.getItem('lastFetchUrls');
  return savedUrls ? JSON.parse(savedUrls) : [];
}

// **Removed saveNewUrls and getNewUrls functions since they are no longer needed.**
// If you still need to display newUrls, you can adjust accordingly.

// **Added loadAndDisplayData function to load data from localStorage and update chart and HTML**
function loadAndDisplayData() {
  const savedResponseData = localStorage.getItem('responseData');
  const savedChartData = localStorage.getItem('chartData');

  if (savedResponseData && savedChartData) {
    const parsedResponseData = JSON.parse(savedResponseData);
    const parsedChartData = JSON.parse(savedChartData);

    // 차트 데이터 업데이트
    myChart.data.datasets[0].data = parsedChartData;
    myChart.update();

    // 응답 데이터를 HTML에 출력
    displayResponse(parsedResponseData);
  }
}

// Function to display the response data in the HTML
function displayResponse(data) {
  const responseDiv = document.getElementById('responseDiv');
  responseDiv.innerHTML = ''; // 기존 내용 삭제

  if (data && data.data && data.data.results) {
    const results = data.data.results;

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
  document.body.appendChild(responseDiv); // Ensure the responseDiv is added to the DOM

  // 페이지가 로드될 때 로컬 스토리지에서 저장된 응답 데이터를 불러와 출력
  loadAndDisplayData();

  // 마지막 fetch 요청에 사용된 URLs를 불러와 콘솔에 출력하거나 필요한 작업 수행
  const lastFetchUrls = getLastFetchUrls();
  if (lastFetchUrls.length > 0) {
    console.log('Last Fetch URLs:', lastFetchUrls);
    // 예: 이 URLs를 UI에 표시하거나 다른 용도로 사용할 수 있습니다.
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