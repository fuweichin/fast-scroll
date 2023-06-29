const env = {
  isFirefox: 'fileName' in new Error()
};

/* zoom */
let zoomValues = env.isFirefox ? [0.3, 0.5, 1, 2, 3, 4, 5] : [0.25, 0.333333, 0.5, 1, 2, 3, 4, 5];
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

/* scroll */
let scrollBehavior = 'auto';
function setScrollBehavior(behavior) {
  scrollBehavior = behavior;
}
function getScrollBehavior() {
  return scrollBehavior;
}

/* main */
let methods = {
  zoomIn,
  zoomOut,
  setScrollBehavior,
  getScrollBehavior,
};
chrome.runtime.onMessage.addListener(function(data, sender, sendResponse) {
  let method = methods[data.action];
  if (typeof method === 'function') {
    let returnValue;
    try {
      returnValue = method.apply(methods, 'value' in data ? [data.value] : []);
    } catch (e) {
      let reason = {name: e.name, message: e.message, stack: e.stack};
      sendResponse({status: 'rejected', reason});
      return;
    }
    if (method.constructor.name === 'AsyncFunction' ||
      returnValue && typeof returnValue.then === 'function') { // check if returnValue is thenable
      let responseId = crypto.randomUUID();
      sendResponse({status: 'pending', responseId});
      Promise.resolve(returnValue).then((value) => {
        chrome.tabs.sendMessage(sender.tab.id, {status: 'fulfilled', value, responseId}, {frameId: sender.frameId});
      }, (e) => {
        let reason = {name: e.name, message: e.message, stack: e.stack};
        chrome.tabs.sendMessage(sender.tab.id, {status: 'rejected', reason, responseId}, {frameId: sender.frameId});
      });
    } else {
      sendResponse({status: 'fulfilled', value: returnValue});
    }
  }
});
