# PiP Corner

A GNOME Shell **51** extension for Chromium video Picture-in-Picture on Wayland.
Designed for [Picture-in-Picture Extension (by Google)](https://chromewebstore.google.com/detail/picture-in-picture-extens/hkgfoiooedgoejojocmhlaklaeopbecg).
This repository follows the source/staging/documentation layout of Package Updates.

## Features

- Automatically keeps recognized Chromium/Google Chrome video PiP above normal windows.
- Handles PiP already open when enabled and metadata arriving after window creation.
- Recognizes the English PiP title by default; add your own exact title in preferences.
- Places PiP in a configurable corner of its current monitor’s work area.
- Horizontal/vertical margins: **16 logical pixels** by default; corner: **bottom right**.
- Restores the previous Always on Top state on disable; does not steal focus.

Sizing is added in subsequent feature commits.
Open PiP with the Google extension button (or Alt+P); no extra GNOME button is needed.
Built-in Chromium video PiP is handled too: Shell cannot identify which extension opened it.

## Build and installation

Requires GNOME Shell 51, GJS, GNU make, Node.js (syntax checks), GLib tools and
`gnome-extensions`. No browser patch, native messaging host, root access or X11
window-control utility is required.

```sh
make pack
make install
# On Wayland, log out and back in before enabling a newly installed extension.
gnome-extensions enable pip-corner@v9eq.github.io
```

Archive: `dist/pip-corner@v9eq.github.io.shell-extension.zip`.
Installing/enabling is a manual step; building does not change the desktop.

## Preferences

```sh
gnome-extensions prefs pip-corner@v9eq.github.io
```

**Corner** selects any of the four corners. **Horizontal margin** and **Vertical
margin** accept 0–500 logical pixels, measured from the work area (not behind
panels). Margins shrink if there is not enough space. Settings apply to open PiP.
You can drag the window freely; a later resize, settings or work-area change
anchors it again. Disabling leaves its geometry in place.

**Additional PiP window title** adds one exact title alongside `Picture in picture`.
Leave it empty for English defaults. **Additional browser app ID / WM class** is
optional for Chromium builds using a different app ID. Matching ignores case and
surrounding whitespace. Use Looking Glass (Alt+F2 → `lg`, Windows tab) to inspect
a window's title and class. Settings take effect immediately.

## Repository layout

```text
src/             Shell runtime, preferences and metadata
schemas/         GSettings XML
docs/            Architecture, limitations and upstream references
.build/          Generated staging directory (ignored)
dist/            Generated extension ZIP (ignored)
```

See [Architecture](docs/architecture.md) and [Contributing](CONTRIBUTING.md).
Code is [GPL-2.0-or-later](LICENSE). This is an independent GNOME extension, not a Google product.
