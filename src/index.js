console.log("This is a popup!")
chrome.devtools.panels.create('demo panel', 'image/icon.png', 'panel.html', () => {
    console.log('user switched to this panel');
  });
  