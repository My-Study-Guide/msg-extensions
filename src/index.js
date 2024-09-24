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
      pointStyle: [], // 각 점의 스타일을 정의할 배열
      pointRadius: 10 // 점의 기본 크기
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true
      }
    },
    elements: {
      point: {
        radius: 0 // 기본 점은 숨김
      }
    }
  },
  plugins: [{
    beforeDraw: (chart) => {
      const ctx = chart.ctx;
      const dataset = chart.data.datasets[0];
      
      dataset.data.forEach((value, index) => {
        const x = chart.scales.x.getPixelForValue(index);
        const y = chart.scales.y.getPixelForValue(value);

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

// 각 데이터 포인트에 대해 이미지를 설정
myChart.data.datasets[0].data.forEach((value, index) => {
  if (value >= 70) {
    myChart.data.datasets[0].pointStyle[index] = goodImage; // good 이미지
  } else if (value >= 40) {
    myChart.data.datasets[0].pointStyle[index] = warningImage; // warning 이미지
  } else {
    myChart.data.datasets[0].pointStyle[index] = dangerImage; // danger 이미지
  }
});

// 차트를 업데이트
myChart.update();

// Event listener for clicks on links in a browser action popup.
// Open the link in a new tab of the current window.
function onAnchorClick(event) {
    chrome.tabs.create({
      selected: true,
      url: event.srcElement.href
    });
    return false;
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
      labelSpan.textContent = `${labels[i]} `; // 라벨 추가
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
  });
  