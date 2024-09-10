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
  
    for (let i = 0, ie = data.length; i < ie; ++i) {
      let a = document.createElement('a');
      a.href = data[i];
      a.appendChild(document.createTextNode(data[i]));
      a.addEventListener('click', onAnchorClick);
  
      let li = document.createElement('li');
      li.appendChild(a);
  
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
  