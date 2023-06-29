const $ = (s, c = document) => c.querySelector(s);
function main() {
  $('#options').addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });
}
queueMicrotask(main);
