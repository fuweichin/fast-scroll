const isFirefox = 'fileName' in new Error();
const lineHeight = isFirefox ? 100 / 6 : 100 / 3;
const fastScrollFactor = 2; // To get 3x scroll speed, set fastScrollFactor to 2

let isSmoothScrollWheel = false;
let taskQueue = [];
let weakMap = new WeakMap();
let scrollingElement = document.scrollingElement;

window.addEventListener('keyup', (e) => {
  if (e.key === 'Alt')
    e.preventDefault();
});

scrollingElement.addEventListener('wheel', (e) => {
  if (e.altKey && e.ctrlKey) {
    if (e.deltaY) { // Ctrl + Alt + WheelY = fast zoom
      e.preventDefault();
      if (e.deltaY < 0) {
        chrome.runtime.sendMessage({action: 'zoomIn'}).then((response) => {
          // NOOP
        });
      } else {
        chrome.runtime.sendMessage({action: 'zoomOut'}).then((response) => {
          // NOOP
        });
      }
    } else if (e.deltaX) { // prevent Ctrl + WheelX from zoom
      e.preventDefault();
    }
  } else if (e.altKey) {
    if (isFirefox) // prevent Alt + WheelY from back-forward navigation
      e.preventDefault();
  }
}, {passive: false});

scrollingElement.addEventListener('wheel', (e) => {
  if (e.altKey && !e.ctrlKey) {
    if (e.deltaMode === 2) // skip if 'scroll by pages' detected
      return;
    if (isSmoothScrollWheel)
      return;
    let topOffset = 0;
    let leftOffset = 0;
    let axis;
    if (e.deltaY) {
      if (e.deltaMode === 0 && Math.abs(e.deltaY) < 33) { // skip if 'smooth scroll wheel' detected
        isSmoothScrollWheel = true;
        return;
      }
      if (e.shiftKey) { // Shift + Alt + WheelY = fast x-scroll
        leftOffset = e.deltaMode === 0 ? e.deltaY : Math.round(e.deltaY * lineHeight);
        axis = 'x';
      } else { // Alt + WheelY = fast y-scroll
        topOffset = e.deltaMode === 0 ? e.deltaY : Math.round(e.deltaY * lineHeight);
        axis = 'y';
      }
    } else if (e.deltaX) { // Alt + WheelX = fast x-scroll
      if (e.deltaMode === 0 && Math.abs(e.deltaX) < 33) { // skip if 'smooth scroll wheel' detected
        isSmoothScrollWheel = true;
        return;
      }
      leftOffset = e.deltaMode === 0 ? e.deltaX : Math.round(e.deltaX * lineHeight);
      axis = 'x';
    }
    let scrollable;
    if (axis === 'y') {
      scrollable = weakMap.get(e.target);
      if (!scrollable) {
        scrollable = getScrollableParent(e.target, axis);
        weakMap.set(e.target, scrollable);
      }
    } else {
      scrollable = getScrollableParent(e.target, axis);
    }
    if (scrollable !== scrollingElement)
      return;
    let task = {
      left: leftOffset,
      top: topOffset,
      behavior: 'instant'
    };
    for (let i = 0; i < fastScrollFactor; i++) {
      taskQueue.push(task);
    }
    if (isFirefox) { // scroll immediately since default behavior
      scrollingElement.scrollBy(task);
    }
  }
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'MetaLeft' || e.code === 'OSLeft') {
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'MetaLeft' || e.code === 'OSLeft') {
    e.preventDefault();
  }
});

let isScrolling = false;
let doScroll = () => {
  if (taskQueue.length > 0) {
    let task = taskQueue.shift();
    scrollingElement.scrollBy(task);
    requestAnimationFrame(doScroll);
  } else {
    isScrolling = false;
  }
};
document.addEventListener('scroll', (e) => {
  if (!isScrolling && taskQueue.length > 0) {
    isScrolling = true;
    requestAnimationFrame(doScroll);
  }
});

document.addEventListener('scrollend', (e) => {
  isSmoothScrollWheel = false;
});

/* scrollable */
let rScrollable = ['scroll', 'auto'];
let isYScrollable = (el) => {
  return el.scrollHeight > el.clientHeight && rScrollable.includes(window.getComputedStyle(el).overflowY) ||
      el === scrollingElement;
};
let isXScrollable = (el) => {
  return el.scrollWidth > el.clientWidth && rScrollable.includes(window.getComputedStyle(el).overflowX) ||
      el === scrollingElement;
};
let getScrollableParent = function (el, axis = 'y') {
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

