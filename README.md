# Fast Scroll

[Fast Scroll](https://github.com/fuweichin/fast-scroll) by Fuwei Chin brings fast vertical scroll, fast horizontal scroll and fast zoom.



## Features

+ support both vertical and horizontal scroll directions, both instant and smooth scroll behaviors
+ support both by-pixels and by-page scroll modes
+ supports fast zoom iteration over integral multiples(200%, 300%, 400%, ...), unit fractions(50%, 33%, 25%, ...)
+ works friendly with overlay scrollbars if scroll behavior is smooth

Special Notes:

+ won't work when [Smooth Scroll Wheel](https://learn.microsoft.com/en-us/windows-hardware/drivers/hid/keyboard-and-mouse-hid-client-drivers#supported-buttons-and-wheels-on-mice) or or "Scroll one screen at a time" is detected, thus to avoid conflict
+ only works on top-level scrolling elements

Alternatives:

+ [Fast Scroll](https://chrome.google.com/webstore/detail/fast-scroll/ecnjcglleblahonnenpaiofkabfakgdi?hl=en-US) by Mickaël Allonneau
+ [Fast Scroll](https://chrome.google.com/webstore/detail/fast-scroll/dkdnncjokeklapahlhbgfnnakjjaogmb?hl=en-US) by Diego Aquino
+ [Fast scroll](https://addons.mozilla.org/en-US/firefox/addon/fast-scroll/) by ddhillon



## Browser Requirements

+ Chrome 114 / Microsoft Edge 114
+ Firefox 114



## Usage

 Activation Modifier Key: Alt / option

| Action \\ Input \ Platform | Windows, Linux                                               | macOS                                                        |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| fast vertical scroll       | <kbd>Alt</kbd> + <code>WheelY</code>                         | <kbd>option</kbd> + <code>WheelY</code>                      |
| fast horizontal scroll     | <kbd>Alt</kbd> + <kbd>Shift</kbd> + <code>WheelY</code>, <kbd>Alt</kbd> + <code>WheelX</code> | <kbd>option</kbd> + <kbd>Shift</kbd> + <code>WheelY</code>, <kbd>option</kbd> + <code>WheelX</code> |
| fast zoom                  | <kbd>Alt</kbd> + <kbd>Ctrl</kbd> + <code>WheelY</code>       | <kbd>option</kbd> + <kbd>command</kbd> + <code>WheelY</code> |



## Known Issues

+ overlay scrollbars doesn't show during fast scroll if scroll behavior is instant



## License

MIT &copy; 2023 Fuwei Chin

Icons used in this project are from open source project [Twemoji](https://twemoji.twitter.com/) which is licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/)
