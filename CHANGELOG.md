# Changelog of Fast Scroll



## [0.2.0] - 2023-06-29

### Added

- Support Mac keyboard <kbd>option</kbd>, <kbd>command</kbd> as an equivalent of PC keyboard <kbd>Alt</kbd>, <kbd>Ctrl</kbd> for macOS
- Support instant scroll behavior
- Added scroll-by-page delta mode
- Added extension options page
- Added popup page to show extension usage

### Fixed

- Fixed scrollbar staggering on overscroll

### Changed

- Listen wheel event only when modifier key Alt/option pressed
- Respect web developers' `event.preventDefault()` to prevent wheel event from scrolling
- Ignore web developers' script dispatching wheel events on scrolling element.



## [0.1.0] - 2023-06-26

### Added

- Added fast vertical scroll, fast horizontal scroll
- Added fast zoom
- Support overlay scrollbars
- Support smooth scroll behavior
