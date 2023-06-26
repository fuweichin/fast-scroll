const isFirefox = 'fileName' in new Error();

let zoomValues = isFirefox ? [0.3, 0.5, 1, 2, 3, 4, 5] : [0.25, 0.333333, 0.5, 1, 2, 3, 4, 5];
let minZoomValue = Math.min(...zoomValues);
let maxZoomValue = Math.max(...zoomValues);

function nextZoom(current) {
  if (current < minZoomValue) {
    return minZoomValue;
  }
  for (let i = 0; i < zoomValues.length; i += 1) {
    let v = zoomValues[i];
    if (v <= current) {
      continue;
    }
    return v;
  }
  return maxZoomValue;
}
function prevZoom(current) {
  if (current > maxZoomValue) {
    return maxZoomValue;
  }
  for (let i = zoomValues.length - 1; i > -1; i -= 1) {
    let v = zoomValues[i];
    if (v >= current) {
      continue;
    }
    return v;
  }
  return minZoomValue;
}
async function zoomIn() {
  let [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  if (!tab) {
    return;
  }
  let currentZoom = await chrome.tabs.getZoom(tab.id);
  currentZoom = +currentZoom.toFixed(6);
  if (currentZoom < maxZoomValue) {
    let zoomToBe = nextZoom(currentZoom);
    await chrome.tabs.setZoom(tab.id, zoomToBe);
  }
}
async function zoomOut() {
  let [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  if (!tab) {
    return;
  }
  let currentZoom = await chrome.tabs.getZoom(tab.id);
  currentZoom = +currentZoom.toFixed(6);
  if (currentZoom > minZoomValue) {
    let zoomToBe = prevZoom(currentZoom);
    chrome.tabs.setZoom(tab.id, zoomToBe);
  }
}

chrome.runtime.onMessage.addListener(function(data, sender, sendResponse) {
  switch (data.action) {
    case 'zoomIn':
      zoomIn();
      sendResponse({code: 0});
      break;
    case 'zoomOut':
      zoomOut();
      sendResponse({code: 0});
      break;
  }
});
