const env = {
  isFirefox: 'fileName' in new Error(),
  isMacOS: navigator.userAgentData?.platform === 'macOS' || navigator.platform.startsWith('Mac'),
};
const config = {
  lineHeight: env.isFirefox ? 100 / 6 : 100 / 3, // pre-knowledge of Windows platform, may vary on other platforms
  scrollBehavior: 'smooth', // to be detected, and cached to background.js
};
let options = { // to be synchronized from storage.sync
  fastScrollFactor: 3,
  fastScrollMode: 1, // 1: scroll by pixels, 2: scroll by pages
};
globalThis.getOptions = () => {
  return options;
};
let taskQueue = [];
let taskHandle = 0;

/* event handlers */
let yScrollingParentMap = new WeakMap();
let xScrollingParentMap = new WeakMap();
let scrollingElement = document.scrollingElement;
let isSmoothScrollWheel = false;

let wheelHandler = (e) => {
  let altKey = e.altKey;
  let ctrlKey = env.isMacOS ? e.metaKey : e.ctrlKey;
  if (altKey && !ctrlKey) {
    if (e.defaultPrevented || !e.isTrusted) // respect `event.preventDefault()`, ignore script-triggered event
      return;
    if (e.deltaMode === 2 || isSmoothScrollWheel) // skip if 'scroll by pages' detected, 'smooth scroll wheel' detected
      return;
    let {isFirefox} = env;
    if (isFirefox)
      e.preventDefault(); // prevent Alt + WheelY and Alt + WheelX from back-forward navigation
    let topOffset = 0;
    let leftOffset = 0;
    let axis;
    let {fastScrollFactor: factor, fastScrollMode} = options;
    if (e.deltaY) {
      if (e.deltaMode === 0 && Math.abs(e.deltaY) < 33) { // skip if 'smooth scroll wheel' detected
        isSmoothScrollWheel = true;
        return;
      }
      if (e.shiftKey) { // assign Shift + Alt + WheelY to fast horizontal scroll
        leftOffset = e.deltaMode === 0 ? e.deltaY : Math.round(e.deltaY * config.lineHeight);
        axis = 'x';
      } else { // assign Alt + WheelY to fast vertical scroll
        topOffset = e.deltaMode === 0 ? e.deltaY : Math.round(e.deltaY * config.lineHeight);
        axis = 'y';
      }
    } else if (e.deltaX) { // assign Alt + WheelX to fast horizontal scroll
      if (e.deltaMode === 0 && Math.abs(e.deltaX) < 33) { // skip if 'smooth scroll wheel' detected
        isSmoothScrollWheel = true;
        return;
      }
      leftOffset = e.deltaMode === 0 ? e.deltaX : Math.round(e.deltaX * config.lineHeight);
      axis = 'x';
    } else {
      return;
    }
    let scrollable;
    if (axis === 'y') {
      scrollable = yScrollingParentMap.get(e.target);
      if (!scrollable) {
        scrollable = getScrollableParent(e.target, axis);
        yScrollingParentMap.set(e.target, scrollable);
      }
      if (!canScrollYBy(scrollable, topOffset))
        return; // detected overscroll-y
    } else {
      scrollable = xScrollingParentMap.get(e.target);
      if (!scrollable) {
        scrollable = getScrollableParent(e.target, axis);
        xScrollingParentMap.set(e.target, scrollable);
      }
      if (!canScrollXBy(scrollable, leftOffset))
        return; // detected overscroll-x
    }
    if (scrollable !== scrollingElement) {
      if (isFirefox) {
        scrollable.scrollBy({
          left: leftOffset,
          top: topOffset,
          behavior: 'auto',
        }); // scroll immediately since default behavior was prevented
      }
      return; // only support fast scroll on document.scrollingElement
    }
    if (fastScrollMode === 2) {
      e.preventDefault();
      if (axis === 'y') {
        let sign = Math.sign(e.deltaY);
        scrollingElement.scrollBy(0, sign * scrollingElement.clientHeight);
      } else {
        let sign = (e.shiftKey && e.deltaY) ? Math.sign(e.deltaY) : Math.sign(e.deltaX);
        scrollingElement.scrollBy(sign * scrollingElement.clientWidth, 0);
      }
      return;
    }
    if (config.scrollBehavior === 'smooth') {
      let task = {left: leftOffset, top: topOffset, behavior: 'instant'};
      if (!isFirefox) {
        if (taskHandle !== 0) {
          e.preventDefault();
        } else {
          factor -= 1; // reduce scroll factor by 1 since default scroll allowed
        }
      }
      for (let i = 0; i < factor; i++) {
        taskQueue.push(task);
      }
    } else {
      if (!isFirefox)
        e.preventDefault();
      if (axis === 'y') {
        scrollingElement.scrollTo(0, scrollingElement.scrollTop + topOffset * factor);
      } else {
        scrollingElement.scrollTo(scrollingElement.scrollLeft + leftOffset * factor, 0);
      }
    }
  } else if (altKey && ctrlKey) {
    if (e.deltaY) {
      e.preventDefault(); // prevent Alt + Ctrl + WheelY from zooming
      let action =  e.deltaY < 0 ? 'zoomIn' : 'zoomOut';
      chrome.runtime.sendMessage({action}).then(handleDeferredResponse).then((_) => { // assign Alt + Ctrl + WheelY to fast zoom
        // NOOP
      });
    } else if (e.deltaX) {
      if (env.isFirefox)
        e.preventDefault(); // prevent  Alt + Ctrl + WheelX from horizontal scroll
    }
  }
};
let doScroll = () => {
  if (taskQueue.length > 0) {
    let task = taskQueue.pop();
    let {left, top} = task;
    if (top) {
      if (canScrollYBy(scrollingElement, top))
        scrollingElement.scrollBy(left, top);
    } else {
      if (canScrollXBy(scrollingElement, left))
        scrollingElement.scrollBy(left, top);
    }
    taskHandle = requestAnimationFrame(doScroll);
  } else {
    taskHandle = 0;
  }
};
let scrollHandler = (e) => {
  if (taskHandle === 0 && taskQueue.length > 0) {
    taskHandle = requestAnimationFrame(doScroll);
  }
};
let scrollendHandler = (e) => {
  if (taskHandle !== 0) {
    e.stopImmediatePropagation();
  }
  isSmoothScrollWheel = false;
};

/* messaging with background.js */
let deferred = {};
function handleDeferredResponse(data) {
  if (!data.responseId)
    throw new TypeError('No responseId');
  if (data.status !== 'pending')
    throw new TypeError('Not a pending response');
  return new Promise((resolve, reject) => {
    deferred[data.responseId] = {resolve, reject};
  });
}
function handleImmediateResponse(data) {
  if (data.status === 'fulfilled') {
    return data.value;
  } else {
    throw data.reason;
  }
}
chrome.runtime.onMessage.addListener((data) => {
  let {responseId} = data;
  if (responseId) {
    let obj = deferred[responseId];
    if (obj) {
      if (data.status === 'fulfilled') {
        obj.resolve(data.value);
      } else {
        obj.reject(data.reason);
      }
      delete deferred[responseId];
    }
  }
});

/* Fast Scroll API */
let fastScroll = false;
let requestFastScroll = () => {
  scrollingElement.addEventListener('wheel', wheelHandler, {passive: false});
  document.addEventListener('scroll', scrollHandler);
  document.addEventListener('scrollend', scrollendHandler);
  fastScroll = true;
};
let exitFastScroll = () => {
  scrollingElement.removeEventListener('wheel', wheelHandler, {passive: false});
  document.removeEventListener('scroll', scrollHandler);
  document.removeEventListener('scrollend', scrollendHandler);
  if (taskQueue.length > 0) {
    taskQueue.length = 0;
  }
  fastScroll = false;
};

/* main */
queueMicrotask(async function main() {
  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Alt') {
      if (!fastScroll)
        requestFastScroll();
    }
  });
  document.body.addEventListener('keyup', (e) => {
    if (e.key === 'Alt') {
      e.preventDefault(); // prevent menu button from focusing (Chrome), prevent menu bar from popup (Firefox)
      if (!e.getModifierState('Alt')) {
        if (fastScroll)
          exitFastScroll();
      }
    }
  });
  document.addEventListener('visibilitychange', () => { // in case of press of Alt + Tab, which keyup event of 'Tab' may not be triggered
    if (document.visibilityState === 'hidden') {
      if (fastScroll)
        exitFastScroll();
    }
  });
  chrome.storage.sync.get(options, (result) => {
    options = result;
  });
  chrome.storage.sync.onChanged.addListener((changes) => {
    let key = 'fastScrollFactor';
    if (key in changes) {
      options[key] = changes[key].newValue || 3;
    }
  });
  let behavior = await chrome.runtime.sendMessage({action: 'getScrollBehavior'}).then(handleImmediateResponse);
  if (behavior === 'auto' && document.visibilityState === 'visible') {
    let smooth = await detectSmoothScroll();
    behavior = smooth ? 'smooth' : 'instant';
    chrome.runtime.sendMessage({action: 'setScrollBehavior', value: behavior}).then(handleImmediateResponse);
  }
  config.scrollBehavior = behavior;
});

/* scroll utilities */
let rScrollable = ['scroll', 'auto'];
let isYScrollable = (el) => {
  return el.scrollHeight > el.clientHeight && rScrollable.includes(window.getComputedStyle(el).overflowY);
};
let isXScrollable = (el) => {
  return el.scrollWidth > el.clientWidth && rScrollable.includes(window.getComputedStyle(el).overflowX);
};
let getScrollableParent = function (el, axis) {
  if (axis === 'x') {
    for (let parent = el; parent !== null && parent !== scrollingElement; parent = parent.parentNode) {
      if (isXScrollable(parent)) {
        return parent;
      }
    }
  } else {
    for (let parent = el; parent !== null && parent !== scrollingElement; parent = parent.parentNode) {
      if (isYScrollable(parent)) {
        return parent;
      }
    }
  }
  return scrollingElement;
};
let canScrollYBy = (el, y) => y < 0 ? el.scrollTop > 0 : el.scrollHeight - el.clientHeight - el.scrollTop > 0;
let canScrollXBy = (el, x) => x < 0 ? el.scrollLeft > 0 : el.scrollWidth - el.clientWidth - el.scrollLeft > 0;
let detectSmoothScroll = () => {
  return new Promise((resolve) => {
    let resolved = false;
    let template = document.createElement('template');
    template.innerHTML = `<div style="position:absolute;left:-999px;top:-999px;width:360px;height:640px;overflow:auto;scroll-behavior:smooth;">
<div style="height:960px;"></div>
</div>`;
    let container = template.content.cloneNode(true).firstChild;
    let scrollCount = 0;
    let handler = (e) => { scrollCount++; };
    container.addEventListener('scroll', handler);
    container.addEventListener('scrollend', (e) => {
      if (resolved)
        return;
      resolved = true;
      container.removeEventListener('scroll', handler);
      container.remove();
      resolve(scrollCount > 1);
    }, {once: true});
    document.body.appendChild(container);
    queueMicrotask(() => {
      container.scrollBy({left: 0, top: container.scrollHeight - container.clientHeight, behavior: 'smooth'});
      setTimeout(() => {
        if (resolved)
          return;
        resolved = true;
        resolve(scrollCount > 1);
        container.remove();
      }, 400);
    });
  });
};
