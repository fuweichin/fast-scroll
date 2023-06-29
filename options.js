const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.prototype.slice.call(c.querySelectorAll(s));
async function main() {
  let options = {fastScrollFactor: 3, fastScrollMode: 1};
  let factorInput = $('#fastScrollFactor');
  let modeInputs = $$('input[name="fastScrollMode"]');

  chrome.storage.sync.get(options, (result) => {
    options = result;
    factorInput.defaultValue = factorInput.value = options.fastScrollFactor;
    let checkedValue = '' + options.fastScrollMode;
    console.log('fastScrollMode', checkedValue);
    modeInputs.forEach((input) => {
      input.checked = input.value === checkedValue;
    });
  });

  modeInputs.forEach(function(input) { input.addEventListener('click', this); }, (e) => {
    let input = e.target;
    let mode = parseInt(input.value);
    console.log('fastScrollMode changed', mode);
    globalThis.getOptions().fastScrollMode = options.fastScrollMode = mode;
  });
  factorInput.addEventListener('change', (e) => {
    let input = e.target;
    if (!input.checkValidity()) {
      input.value = input.defaultValue;
    }
    let fastScrollFactor = parseInt(input.value);
    globalThis.getOptions().fastScrollFactor = options.fastScrollFactor = fastScrollFactor;
  });

  $('#save').addEventListener('click', (e) => {
    let button = e.target;
    button.disabled = true;
    chrome.storage.sync.set(options, () => {
      factorInput.defaultValue = options.fastScrollFactor;
      button.disabled = false;
    });
  });
}
queueMicrotask(main);
